const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { getUser, saveUser } = require('../../utils/database');
const { getCurrentSeason, SEASON_INFO, FARM_PLANTS, formatTime } = require('../../utils/helpers');

const ROT_TIME = 5 * 60 * 1000; // 5 minutes to rot

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fazenda')
    .setDescription('🌾 Gerencie sua fazenda!')
    .addSubcommand(s => s.setName('plantar').setDescription('🌱 Plante uma cultura'))
    .addSubcommand(s => s.setName('ver').setDescription('👀 Veja suas plantas'))
    .addSubcommand(s => s.setName('colher').setDescription('🌾 Colha plantas prontas')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const user = getUser(interaction.user.id);
    const season = getCurrentSeason();
    const seasonInfo = SEASON_INFO[season];

    if (sub === 'ver') {
      const plots = user.farm_plots || [];
      if (plots.length === 0) {
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor('#27ae60')
            .setTitle('🌾 Sua Fazenda')
            .setDescription(`Nenhuma planta no momento!\nEstação atual: ${seasonInfo.name}\n\nUse \`/fazenda plantar\` para começar!`)
          ]
        });
      }

      const now = Date.now();
      const plotsDesc = plots.map((p, i) => {
        const timeLeft = (p.ready_at - now);
        const rotLeft = p.ready_at + ROT_TIME - now;
        if (now > p.ready_at + ROT_TIME) return `${i+1}. ${p.emoji} ${p.name} — 💀 **APODRECEU**`;
        if (now >= p.ready_at) return `${i+1}. ${p.emoji} ${p.name} — ✅ **PRONTO** (apodrece em ${formatTime(rotLeft)})`;
        return `${i+1}. ${p.emoji} ${p.name} — ⏳ ${formatTime(timeLeft)}`;
      }).join('\n');

      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#27ae60')
          .setTitle('🌾 Sua Fazenda')
          .setDescription(`**Estação:** ${seasonInfo.name}\n**Bônus:** ${seasonInfo.bonus.join(', ')}\n\n${plotsDesc}`)
          .setFooter({ text: 'Use /fazenda colher para colher as prontas!' })
        ]
      });
    }

    if (sub === 'plantar') {
      if ((user.farm_plots || []).length >= 5) {
        return interaction.reply({ content: '❌ Você já tem 5 plantas! Colha primeiro.', ephemeral: true });
      }

      const options = FARM_PLANTS.map(p => ({
        label: `${p.emoji} ${p.name.charAt(0).toUpperCase() + p.name.slice(1)}`,
        description: `Tempo: ${formatTime(p.time)} | Valor: ${p.coins} moedas${p.season === season ? ' ⭐ Bônus!' : ''}`,
        value: p.name,
        emoji: p.emoji,
      }));

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`farm_plant:${interaction.user.id}`)
          .setPlaceholder('Escolha o que plantar...')
          .addOptions(options)
      );

      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#27ae60')
          .setTitle('🌱 Plantar')
          .setDescription(`Estação atual: ${seasonInfo.name}\n⭐ Culturas com bônus: ${seasonInfo.bonus.join(', ')}`)
        ],
        components: [row]
      });
    }

    if (sub === 'colher') {
      const plots = user.farm_plots || [];
      const now = Date.now();
      let earned = 0;
      let harvested = 0;
      let rotted = 0;

      const remaining = plots.filter(p => {
        if (now > p.ready_at + ROT_TIME) { rotted++; return false; }
        if (now >= p.ready_at) {
          let coins = p.coins;
          const isFarmer = user.job === 'farmer';
          const hasCow = user.pet === 'cow';
          if (isFarmer) coins = Math.floor(coins * 1.25);
          const season = getCurrentSeason();
          if (p.season === season) coins = Math.floor(coins * 1.3);
          earned += coins;
          harvested++;
          return false;
        }
        return true;
      });

      if (harvested === 0 && rotted === 0) {
        return interaction.reply({ content: '⏳ Nenhuma planta pronta para colher ainda!', ephemeral: true });
      }

      user.coins = (user.coins || 0) + earned;
      user.farm_plots = remaining;
      user.missions.plant = (user.missions.plant || 0) + harvested;
      user.total_plants = (user.total_plants || 0) + harvested;

      let missionMsg = '';
      if (!user.missions_claimed.plant && user.missions.plant >= 5) {
        user.coins += 1500;
        user.missions_claimed.plant = true;
        missionMsg = '\n\n🎯 **Missão Completa!** Plantou 5x → +1500 moedas!';
      }

      saveUser(interaction.user.id, user);

      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#f1c40f')
          .setTitle('🌾 Colheita!')
          .setDescription(`Colhidas: **${harvested}** | Apodrecidas: **${rotted}**\n💰 Ganhou: **${earned.toLocaleString('pt-BR')} moedas**${missionMsg}`)
          .addFields({ name: '💵 Saldo', value: `${user.coins.toLocaleString('pt-BR')} moedas`, inline: true })
        ]
      });
    }
  }
};
