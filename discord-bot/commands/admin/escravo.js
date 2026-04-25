const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { grantSlaveAccess, revokeSlaveAccess, loadDB } = require('../../utils/slaveMode');
const { loadDB: loadDatabase } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('escravo')
    .setDescription('👑 Sistema de modo automático (ADM)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s => s.setName('dar').setDescription('✅ Dar acesso permanente ao modo automático')
      .addUserOption(o => o.setName('usuario').setDescription('Usuário').setRequired(true)))
    .addSubcommand(s => s.setName('remover').setDescription('❌ Remover acesso do modo automático')
      .addUserOption(o => o.setName('usuario').setDescription('Usuário').setRequired(true)))
    .addSubcommand(s => s.setName('lista').setDescription('📋 Ver quem tem acesso')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'dar') {
      const target = interaction.options.getUser('usuario');
      grantSlaveAccess(target.id, interaction.user.id);

      await interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#9b59b6')
          .setTitle('✅ Acesso Concedido!')
          .setDescription(`**${target.username}** agora pode usar o modo automático **permanentemente**!\n\nEle pode mencionar o bot e pedir para fazer qualquer tarefa automaticamente.`)
          .addFields(
            { name: '🤖 Como usar', value: `O usuário menciona o bot e pede:\n"@Lúmen pesca tudo pra mim"\n"@Lúmen planta e colhe automático"\n"@Lúmen faz tudo pra mim"`, inline: false }
          )
        ]
      });
    }

    if (sub === 'remover') {
      const target = interaction.options.getUser('usuario');
      revokeSlaveAccess(target.id);

      await interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Acesso Removido!')
          .setDescription(`**${target.username}** não tem mais acesso ao modo automático.`)
        ]
      });
    }

    if (sub === 'lista') {
      const db = loadDatabase('slaves') || {};
      const active = Object.entries(db).filter(([, v]) => v.active);

      if (active.length === 0) {
        return interaction.reply({ content: '📋 Nenhum usuário com acesso ao modo automático.', ephemeral: true });
      }

      const lines = await Promise.all(active.map(async ([id]) => {
        try {
          const u = await interaction.client.users.fetch(id);
          return `• **${u.username}**`;
        } catch {
          return `• ID: ${id}`;
        }
      }));

      await interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#9b59b6')
          .setTitle('📋 Usuários com Modo Automático')
          .setDescription(lines.join('\n'))
        ]
      });
    }
  }
};
