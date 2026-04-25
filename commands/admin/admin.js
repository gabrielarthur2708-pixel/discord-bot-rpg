const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getUser, saveUser } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('👑 Controle admin da economia')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s => s.setName('dar_moedas').setDescription('💰 Dar moedas a um usuário')
      .addUserOption(o => o.setName('usuario').setDescription('Usuário').setRequired(true))
      .addIntegerOption(o => o.setName('quantidade').setDescription('Quantidade').setRequired(true).setMinValue(1)))
    .addSubcommand(s => s.setName('remover_moedas').setDescription('💸 Remover moedas de um usuário')
      .addUserOption(o => o.setName('usuario').setDescription('Usuário').setRequired(true))
      .addIntegerOption(o => o.setName('quantidade').setDescription('Quantidade').setRequired(true).setMinValue(1)))
    .addSubcommand(s => s.setName('resetar').setDescription('🔄 Resetar dados de um usuário')
      .addUserOption(o => o.setName('usuario').setDescription('Usuário').setRequired(true))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getUser('usuario');
    const user = getUser(target.id);

    if (sub === 'dar_moedas') {
      const qty = interaction.options.getInteger('quantidade');
      user.coins = (user.coins || 0) + qty;
      saveUser(target.id, user);
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor('#2ecc71').setTitle('💰 Moedas Adicionadas')
          .setDescription(`Adicionado **${qty.toLocaleString('pt-BR')}** moedas para **${target.username}**\nNovo saldo: **${user.coins.toLocaleString('pt-BR')}**`)]
      });
    }

    if (sub === 'remover_moedas') {
      const qty = interaction.options.getInteger('quantidade');
      user.coins = Math.max(0, (user.coins || 0) - qty);
      saveUser(target.id, user);
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor('#e74c3c').setTitle('💸 Moedas Removidas')
          .setDescription(`Removido **${qty.toLocaleString('pt-BR')}** moedas de **${target.username}**\nNovo saldo: **${user.coins.toLocaleString('pt-BR')}**`)]
      });
    }

    if (sub === 'resetar') {
      const { saveDB, loadDB } = require('../../utils/database');
      const db = loadDB('users');
      delete db[target.id];
      saveDB('users', db);
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor('#f39c12').setTitle('🔄 Dados Resetados')
          .setDescription(`Dados de **${target.username}** foram resetados!`)]
      });
    }
  }
};
