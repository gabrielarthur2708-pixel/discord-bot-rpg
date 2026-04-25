const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, saveUser } = require('../../utils/database');
const { cooldownLeft, formatTime, randomBetween, randomChance, addXP } = require('../../utils/helpers');

const ROB_COOLDOWN = 5 * 60 * 1000; // 5 minutes

const ROB_METHODS = [
  { name: 'Bater Carteira', emoji: '👛', successChance: 55, minPercent: 5, maxPercent: 15, xpGain: 30, jailTime: 3 },
  { name: 'Assalto Relâmpago', emoji: '⚡', successChance: 40, minPercent: 15, maxPercent: 30, xpGain: 60, jailTime: 6 },
  { name: 'Golpe do Baú', emoji: '💰', successChance: 25, minPercent: 30, maxPercent: 50, xpGain: 100, jailTime: 10 },
  { name: 'Roubo Épico', emoji: '💎', successChance: 10, minPercent: 50, maxPercent: 80, xpGain: 200, jailTime: 20 },
];

const CAUGHT_MESSAGES = [
  'foi pego em flagrante pela polícia! 🚔',
  'tropeçou e caiu na frente do guarda! 😂',
  'deixou a carteira cair no caminho! 🤦',
  'foi reconhecido pela vítima! 👀',
  'o alarme disparou! 🚨',
  'escorregou numa casca de banana! 🍌',
  'foi delatado por uma pomba! 🐦',
];

const SUCCESS_MESSAGES = [
  'sumiu na escuridão como um ninja! 🥷',
  'fugiu numa moto emprestada! 🏍️',
  'desapareceu na multidão! 🌆',
  'saiu correndo e não olhou pra trás! 💨',
  'usou uma fumaça e evaporou! 💨',
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roubar')
    .setDescription('🦹 Tente roubar outro jogador!')
    .addUserOption(o => o.setName('alvo').setDescription('Quem você vai roubar?').setRequired(true))
    .addIntegerOption(o => o.setName('metodo').setDescription('Método de roubo').setRequired(true)
      .addChoices(
        { name: '👛 Bater Carteira (55% sucesso | 5-15%)', value: 0 },
        { name: '⚡ Assalto Relâmpago (40% sucesso | 15-30%)', value: 1 },
        { name: '💰 Golpe do Baú (25% sucesso | 30-50%)', value: 2 },
        { name: '💎 Roubo Épico (10% sucesso | 50-80%)', value: 3 },
      )),

  async execute(interaction) {
    const robber = interaction.user;
    const target = interaction.options.getUser('alvo');
    const methodIndex = interaction.options.getInteger('metodo');
    const method = ROB_METHODS[methodIndex];

    if (target.id === robber.id) return interaction.reply({ content: '❌ Você não pode roubar a si mesmo!', ephemeral: true });
    if (target.bot) return interaction.reply({ content: '❌ Bots não têm dinheiro!', ephemeral: true });

    const robberData = getUser(robber.id);
    const targetData = getUser(target.id);

    // Check if in jail
    if (robberData.jail_until && Date.now() < robberData.jail_until) {
      const left = robberData.jail_until - Date.now();
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('🚔 Você está na cadeia!')
          .setDescription(`Você foi preso e precisa esperar **${formatTime(left)}** para sair!\n\n🔒 Pague sua fiança ou aguarde...`)
        ],
        ephemeral: true
      });
    }

    // Cooldown check
    const cd = cooldownLeft(robberData.rob_last, ROB_COOLDOWN);
    if (cd > 0) return interaction.reply({ content: `⏳ Aguarde **${formatTime(cd)}** para roubar novamente!`, ephemeral: true });

    // Target needs money
    if ((targetData.coins || 0) < 100) {
      return interaction.reply({ content: `❌ **${target.username}** está tão pobre que nem vale a pena roubar! 😂`, ephemeral: true });
    }

    // Animation
    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor('#8b0000')
        .setTitle(`${method.emoji} Planejando o ${method.name}...`)
        .setDescription(`🦹 **${robber.username}** está se aproximando de **${target.username}**...\n\n*Coração acelerado... tensão no ar...*`)
      ]
    });

    await new Promise(r => setTimeout(r, 2500));

    // Success check — wolf pet gives +5% on robbery
    const hasWolf = robberData.pet === 'wolf';
    const successChance = method.successChance + (hasWolf ? 5 : 0);
    const success = randomChance(successChance);

    robberData.rob_last = Date.now();

    if (success) {
      const percent = randomBetween(method.minPercent, method.maxPercent) / 100;
      let stolen = Math.floor(targetData.coins * percent);
      stolen = Math.max(50, Math.min(stolen, 50000));

      robberData.coins = (robberData.coins || 0) + stolen;
      robberData.rob_streak = (robberData.rob_streak || 0) + 1;
      robberData.total_robbed = (robberData.total_robbed || 0) + stolen;
      targetData.coins = Math.max(0, (targetData.coins || 0) - stolen);
      targetData.robbed_count = (targetData.robbed_count || 0) + 1;

      const newLevel = addXP(robberData, method.xpGain);
      saveUser(robber.id, robberData);
      saveUser(target.id, targetData);

      const successMsg = SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)];
      const streakBonus = robberData.rob_streak >= 3 ? `\n🔥 **Streak de ${robberData.rob_streak} roubos!** Você está quente!` : '';
      const levelMsg = newLevel ? `\n\n⬆️ **LEVEL UP! Você chegou ao nível ${newLevel}!**` : '';

      await interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor('#2ecc71')
          .setTitle(`${method.emoji} ROUBO BEM-SUCEDIDO!`)
          .setDescription(`**${robber.username}** ${successMsg}`)
          .addFields(
            { name: '💰 Roubado', value: `${stolen.toLocaleString('pt-BR')} moedas de ${target.username}`, inline: false },
            { name: '✨ XP Ganho', value: `+${method.xpGain} XP`, inline: true },
            { name: '💵 Seu Saldo', value: `${robberData.coins.toLocaleString('pt-BR')} moedas`, inline: true },
          )
          .setFooter({ text: `${streakBonus}${levelMsg}`.trim() || `Streak: ${robberData.rob_streak}` })
        ]
      });

      // DM the victim
      try {
        await target.send({
          embeds: [new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('🚨 Você foi roubado!')
            .setDescription(`**${robber.username}** roubou **${stolen.toLocaleString('pt-BR')} moedas** de você usando ${method.emoji} ${method.name}!\n\nVingue-se com \`/roubar\`! 😤`)
          ]
        }).catch(() => {});
      } catch {}

    } else {
      // CAUGHT!
      const jailMs = method.jailTime * 60 * 1000;
      const fine = Math.floor((robberData.coins || 0) * randomBetween(10, 25) / 100);
      const actualFine = Math.min(fine, 5000);

      robberData.coins = Math.max(0, (robberData.coins || 0) - actualFine);
      robberData.jail_until = Date.now() + jailMs;
      robberData.rob_streak = 0;
      saveUser(robber.id, robberData);

      const caughtMsg = CAUGHT_MESSAGES[Math.floor(Math.random() * CAUGHT_MESSAGES.length)];

      await interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('🚔 PRESO EM FLAGRANTE!')
          .setDescription(`**${robber.username}** ${caughtMsg}`)
          .addFields(
            { name: '💸 Multa', value: `-${actualFine.toLocaleString('pt-BR')} moedas`, inline: true },
            { name: '⏰ Tempo na Cadeia', value: formatTime(jailMs), inline: true },
            { name: '💵 Saldo Restante', value: `${robberData.coins.toLocaleString('pt-BR')} moedas`, inline: true },
          )
          .setFooter({ text: '🔒 Você ficará preso e não pode roubar até sair!' })
        ]
      });
    }
  }
};
