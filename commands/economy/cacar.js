const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUser, saveUser } = require('../../utils/database');
const { rollHunt, cooldownLeft, formatTime, randomChance, addXP } = require('../../utils/helpers');

const HUNT_COOLDOWN = 30 * 60 * 1000;

module.exports = {
  data: new SlashCommandBuilder().setName('cacar').setDescription('🏹 Saia para caçar na floresta!'),

  async execute(interaction) {
    const user = getUser(interaction.user.id);
    const cd = cooldownLeft(user.hunt_last, HUNT_COOLDOWN);
    if (cd > 0) return interaction.reply({
      embeds: [new EmbedBuilder().setColor('#e74c3c')
        .setTitle('⏳ Você está cansado!')
        .setDescription(`Descanse antes de caçar novamente.\n\n⏱️ **Próxima caçada disponível em ${formatTime(cd)}**`)
        .setFooter({ text: '🏹 Lúmen • Caçada' })
      ], ephemeral: true
    });

    await interaction.reply({
      embeds: [new EmbedBuilder().setColor('#8b4513')
        .setTitle('🏹 Caçando...')
        .setDescription('Você entrou na floresta...\n\n🌲 *Pisadas na lama...*\n👁️ *Você vê algo se mexendo nas sombras...*')
        .setFooter({ text: '🏹 Lúmen • Caçada' })
      ]
    });
    await new Promise(r => setTimeout(r, 2500));

    if (randomChance(15)) {
      user.hunt_last = Date.now();
      saveUser(interaction.user.id, user);
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor('#e74c3c')
          .setTitle('🏹 A presa fugiu!')
          .setDescription('O animal era mais rápido! 😤\n\nTente novamente mais tarde!')
          .setFooter({ text: `🏹 Lúmen • Caçada | Próxima em ${formatTime(HUNT_COOLDOWN)}` })
        ]
      });
    }

    const animal = rollHunt(user.pet === 'wolf', user.job === 'hunter');
    user.hunt_last = Date.now();
    user.missions.hunt = (user.missions.hunt || 0) + 1;
    user.total_hunts = (user.total_hunts || 0) + 1;

    let missionBonus = '';
    if (!user.missions_claimed.hunt && user.missions.hunt >= 3) {
      user.coins = (user.coins || 0) + 1800;
      user.missions_claimed.hunt = true;
      missionBonus = '\n\n🎯 **Missão Completa!** +1.800 moedas!';
    }

    const celebrate = animal.name === 'Dragão' ? '\n\n🐲 **DRAGÃO ABATIDO! LENDA!** 🐲' : animal.name === 'Urso' ? '\n\n🐻 **Que caçada épica!**' : '';
    const lv = addXP(user, 25);
    user._pending_hunt = { animal, timestamp: Date.now() };
    saveUser(interaction.user.id, user);

    const colors = { 'Coelho':'#95a5a6','Cervo':'#27ae60','Lobo':'#8e44ad','Urso':'#e67e22','Dragão':'#e74c3c' };
    const rarityLabel = { 'Coelho':'⚪ Comum','Cervo':'🔵 Incomum','Lobo':'🟣 Raro','Urso':'🟡 Épico','Dragão':'🔴 Lendário' };

    const embed = new EmbedBuilder()
      .setColor(colors[animal.name] || '#8b4513')
      .setTitle('🏹 Captura!')
      .setThumbnail(interaction.user.displayAvatarURL())
      .addFields(
        { name: '🎯 Captura', value: `${animal.emoji} **${animal.name}**`, inline: true },
        { name: '⭐ Raridade', value: rarityLabel[animal.name] || animal.name, inline: true },
        { name: '💰 Valor de Venda', value: `${animal.coins.toLocaleString('pt-BR')} 🪙`, inline: true },
        { name: '🏹 Total Caçado', value: `${user.total_hunts} animais`, inline: true },
        { name: '📋 Missão', value: `${user.missions.hunt}/3 ${user.missions_claimed.hunt ? '✅' : ''}`, inline: true },
        { name: '⭐ XP Ganho', value: `+25 XP`, inline: true },
      )
      .setDescription(`${celebrate}${missionBonus}`)
      .setFooter({ text: `🏹 Lúmen • Caçada | Próxima em ${formatTime(HUNT_COOLDOWN)}${lv ? ` | ⬆️ Level ${lv}!` : ''}` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`hunt_sell:${interaction.user.id}`).setLabel('💰 Vender Agora').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`hunt_keep:${interaction.user.id}`).setLabel('🎒 Guardar no Inventário').setStyle(ButtonStyle.Secondary),
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  }
};
