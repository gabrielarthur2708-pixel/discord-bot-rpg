const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadDB, saveDB } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cmd')
    .setDescription('💬 Executar um comando personalizado')
    .addStringOption(o => o.setName('nome').setDescription('Nome do comando').setRequired(true)),

  async execute(interaction) {
    const nome = interaction.options.getString('nome').toLowerCase();
    const db = loadDB('custom_commands');
    const cmd = db[nome];

    if (!cmd) {
      return interaction.reply({
        content: `❌ Comando \`/${nome}\` não encontrado! Use \`/comando lista\` para ver os disponíveis.`,
        ephemeral: true
      });
    }

    // Increment uses
    cmd.uses = (cmd.uses || 0) + 1;
    saveDB('custom_commands', db);

    // Process variables in response
    let response = cmd.response
      .replace('{usuario}', interaction.user.username)
      .replace('{mencao}', `<@${interaction.user.id}>`)
      .replace('{servidor}', interaction.guild?.name || 'servidor')
      .replace('{membros}', interaction.guild?.memberCount || '?');

    await interaction.reply({ content: response });
  }
};
