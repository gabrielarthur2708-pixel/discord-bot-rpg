const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, saveUser } = require('../../utils/database');
const { formatTime } = require('../../utils/helpers');

const DAILY_COOLDOWN = 24 * 60 * 60 * 1000;
const WEEKLY_COOLDOWN = 7 * 24 * 60 * 60 * 1000;
const DAILY_REWARD = 200;
const WEEKLY_REWARD = 800;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('recompensa')
    .setDescription('🎁 Colete suas recompensas!')
    .addSubcommand(s => s.setName('diaria').setDescription('📅 Recompensa diária (1000 moedas)'))
    .addSubcommand(s => s.setName('semanal').setDescription('📆 Recompensa semanal (5000 moedas)')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const user = getUser(interaction.user.id);
    const now = Date.now();

    if (sub === 'diaria') {
      const lastDaily = user.daily_last || 0;
      const timeLeft = DAILY_COOLDOWN - (now - lastDaily);
      if (timeLeft > 0) {
        return interaction.reply({
          content: `⏳ Você já coletou hoje! Próxima recompensa em **${formatTime(timeLeft)}**`,
          ephemeral: true
        });
      }
      user.coins = (user.coins || 0) + DAILY_REWARD;
      user.daily_last = now;
      saveUser(interaction.user.id, user);

      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#f1c40f')
          .setTitle('🎁 Recompensa Diária!')
          .setDescription(`Você coletou **${DAILY_REWARD.toLocaleString('pt-BR')} moedas**!`)
          .addFields({ name: '💰 Saldo Atual', value: `${user.coins.toLocaleString('pt-BR')} moedas`, inline: true })
          .setFooter({ text: 'Volte amanhã para mais!' })
        ]
      });
    }

    if (sub === 'semanal') {
      const lastWeekly = user.weekly_last || 0;
      const timeLeft = WEEKLY_COOLDOWN - (now - lastWeekly);
      if (timeLeft > 0) {
        return interaction.reply({
          content: `⏳ Você já coletou essa semana! Próxima recompensa em **${formatTime(timeLeft)}**`,
          ephemeral: true
        });
      }
      user.coins = (user.coins || 0) + WEEKLY_REWARD;
      user.weekly_last = now;
      saveUser(interaction.user.id, user);

      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#9b59b6')
          .setTitle('🎁 Recompensa Semanal!')
          .setDescription(`Você coletou **${WEEKLY_REWARD.toLocaleString('pt-BR')} moedas**!`)
          .addFields({ name: '💰 Saldo Atual', value: `${user.coins.toLocaleString('pt-BR')} moedas`, inline: true })
          .setFooter({ text: 'Volte na semana que vem!' })
        ]
      });
    }
  }
};
