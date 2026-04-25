const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, saveUser } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pix')
    .setDescription('💸 Transfira moedas para outro jogador!')
    .addUserOption(o => o.setName('usuario').setDescription('Para quem enviar?').setRequired(true))
    .addIntegerOption(o => o.setName('valor').setDescription('Quanto enviar?').setRequired(true).setMinValue(1)),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario');
    const valor = interaction.options.getInteger('valor');
    const sender = interaction.user;

    if (target.id === sender.id) return interaction.reply({ content: '❌ Você não pode fazer Pix para si mesmo!', ephemeral: true });
    if (target.bot) return interaction.reply({ content: '❌ Bots não aceitam Pix!', ephemeral: true });

    const senderData = getUser(sender.id);
    const targetData = getUser(target.id);

    if ((senderData.coins || 0) < valor) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Saldo Insuficiente')
          .setDescription(`Você tem **${(senderData.coins||0).toLocaleString('pt-BR')}** moedas mas tentou enviar **${valor.toLocaleString('pt-BR')}**!`)
        ], ephemeral: true
      });
    }

    senderData.coins -= valor;
    targetData.coins = (targetData.coins || 0) + valor;
    saveUser(sender.id, senderData);
    saveUser(target.id, targetData);

    // Notify receiver
    try {
      await target.send({ embeds: [new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('💸 Você recebeu um Pix!')
        .setDescription(`**${sender.username}** te enviou **${valor.toLocaleString('pt-BR')} moedas**! 🎉\n💰 Seu saldo: **${targetData.coins.toLocaleString('pt-BR')}**`)
      ] }).catch(() => {});
    } catch {}

    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('✅ Pix Enviado!')
        .setDescription(`Você enviou **${valor.toLocaleString('pt-BR')} moedas** para **${target.username}**!`)
        .addFields(
          { name: '💸 Enviado', value: `${valor.toLocaleString('pt-BR')} moedas`, inline: true },
          { name: '💰 Seu saldo', value: `${senderData.coins.toLocaleString('pt-BR')} moedas`, inline: true },
        )
        .setFooter({ text: `Para: ${target.username}` })
      ]
    });
  }
};
