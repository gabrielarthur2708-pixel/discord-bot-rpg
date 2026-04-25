const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, getAllUsers } = require('../../utils/database');
const { xpForLevel } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('saldo')
    .setDescription('💰 Veja seu saldo e aura!')
    .addUserOption(o => o.setName('usuario').setDescription('Ver saldo de outro jogador').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario') || interaction.user;
    const user = getUser(target.id);

    // Get ranking position
    const allUsers = getAllUsers();
    const sorted = Object.entries(allUsers).sort((a, b) => (b[1].coins || 0) - (a[1].coins || 0));
    const rank = sorted.findIndex(([id]) => id === target.id) + 1;

    const level = user.level || 1;
    const xp = user.xp || 0;
    const xpNeeded = xpForLevel(level);
    const prog = Math.floor((xp / xpNeeded) * 10);
    const bar = '█'.repeat(prog) + '░'.repeat(10 - prog);

    const embed = new EmbedBuilder()
      .setColor('#f1c40f')
      .setTitle(`💰 Saldo de ${target.username}`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: '💵 Moedas',    value: `**${(user.coins || 0).toLocaleString('pt-BR')}** 💰`, inline: true },
        { name: '✨ Aura',      value: `**${(user.aura || 0).toLocaleString('pt-BR')}** ✨`,  inline: true },
        { name: '🏆 Ranking',   value: `**#${rank}** no servidor`,                             inline: true },
        { name: `⭐ Nível ${level}`, value: `\`${bar}\` ${xp}/${xpNeeded} XP`,               inline: false },
        { name: '🎯 Missões',
          value: [
            `🎣 Pesca: ${user.missions?.fish || 0}/10 ${user.missions_claimed?.fish ? '✅' : ''}`,
            `🌾 Fazenda: ${user.missions?.plant || 0}/5 ${user.missions_claimed?.plant ? '✅' : ''}`,
            `🏹 Caça: ${user.missions?.hunt || 0}/3 ${user.missions_claimed?.hunt ? '✅' : ''}`,
          ].join(' | '),
          inline: false
        },
      )
      .setFooter({ text: 'Use /ranking para ver o top 10 • /inventario para ver seus itens' });

    return interaction.reply({ embeds: [embed] });
  }
};
