const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getAllUsers } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ranking')
    .setDescription('🏆 Veja os rankings!')
    .addStringOption(o => o.setName('tipo').setDescription('Tipo de ranking').setRequired(true)
      .addChoices({ name: '💰 Dinheiro', value: 'coins' }, { name: '✨ Aura', value: 'aura' })),

  async execute(interaction) {
    await interaction.deferReply();
    const tipo = interaction.options.getString('tipo');
    const allUsers = getAllUsers();

    const sorted = Object.entries(allUsers)
      .map(([id, data]) => ({ id, coins: data.coins || 0, aura: data.aura || 0 }))
      .sort((a, b) => b[tipo] - a[tipo])
      .slice(0, 10);

    const medals = ['🥇', '🥈', '🥉'];
    const lines = await Promise.all(sorted.map(async (entry, i) => {
      let username = `Usuário ${entry.id.slice(0, 6)}`;
      try {
        const u = await interaction.client.users.fetch(entry.id);
        username = u.username;
      } catch {}
      const medal = medals[i] || `**${i + 1}.**`;
      const value = tipo === 'coins' ? `💰 ${entry.coins.toLocaleString('pt-BR')}` : `✨ ${entry.aura.toLocaleString('pt-BR')}`;
      return `${medal} **${username}** — ${value}`;
    }));

    const embed = new EmbedBuilder()
      .setColor(tipo === 'coins' ? '#f1c40f' : '#9b59b6')
      .setTitle(tipo === 'coins' ? '💰 Ranking de Dinheiro' : '✨ Ranking de Aura')
      .setDescription(lines.length ? lines.join('\n') : 'Nenhum usuário encontrado.')
      .setFooter({ text: 'Top 10 jogadores' });

    return interaction.editReply({ embeds: [embed] });
  }
};
