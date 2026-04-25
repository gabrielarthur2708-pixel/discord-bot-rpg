const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { loadDB, saveDB } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('comando')
    .setDescription('⚙️ Criar e gerenciar comandos personalizados (ADM)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s => s.setName('criar').setDescription('✨ Criar um novo comando personalizado')
      .addStringOption(o => o.setName('nome').setDescription('Nome do comando (sem /)').setRequired(true))
      .addStringOption(o => o.setName('resposta').setDescription('O que o bot vai responder').setRequired(true))
      .addStringOption(o => o.setName('descricao').setDescription('Descrição do comando').setRequired(false)))
    .addSubcommand(s => s.setName('remover').setDescription('🗑️ Remover um comando personalizado')
      .addStringOption(o => o.setName('nome').setDescription('Nome do comando').setRequired(true)))
    .addSubcommand(s => s.setName('lista').setDescription('📋 Ver todos os comandos personalizados')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const db = loadDB('custom_commands');

    if (sub === 'criar') {
      const nome = interaction.options.getString('nome').toLowerCase().replace(/[^a-z0-9_]/g, '');
      const resposta = interaction.options.getString('resposta');
      const descricao = interaction.options.getString('descricao') || 'Comando personalizado';

      if (!nome) return interaction.reply({ content: '❌ Nome inválido! Use apenas letras, números e _', ephemeral: true });

      db[nome] = {
        response: resposta,
        description: descricao,
        createdBy: interaction.user.id,
        createdAt: Date.now(),
        uses: 0,
      };
      saveDB('custom_commands', db);

      await interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#2ecc71')
          .setTitle('✨ Comando Criado!')
          .setDescription(`O comando \`/${nome}\` foi criado com sucesso!`)
          .addFields(
            { name: '📝 Nome', value: `/${nome}`, inline: true },
            { name: '💬 Resposta', value: resposta.slice(0, 200), inline: false },
            { name: '📄 Descrição', value: descricao, inline: false },
          )
          .setFooter({ text: 'Use o comando digitando /cmd nome no chat!' })
        ]
      });
    }

    if (sub === 'remover') {
      const nome = interaction.options.getString('nome').toLowerCase();
      if (!db[nome]) return interaction.reply({ content: '❌ Comando não encontrado!', ephemeral: true });

      delete db[nome];
      saveDB('custom_commands', db);

      await interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('🗑️ Comando Removido')
          .setDescription(`O comando \`/${nome}\` foi removido!`)
        ]
      });
    }

    if (sub === 'lista') {
      const cmds = Object.entries(db);
      if (cmds.length === 0) return interaction.reply({ content: '📋 Nenhum comando personalizado criado ainda.', ephemeral: true });

      const list = cmds.map(([name, data]) => `\`/${name}\` — ${data.description} (usado ${data.uses}x)`).join('\n');

      await interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#3498db')
          .setTitle('📋 Comandos Personalizados')
          .setDescription(list)
          .setFooter({ text: `Total: ${cmds.length} comandos` })
        ]
      });
    }
  }
};
