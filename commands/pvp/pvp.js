const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUser, saveUser } = require('../../utils/database');
const { cooldownLeft, formatTime, randomBetween } = require('../../utils/helpers');

const PVP_COOLDOWN = 10 * 60 * 1000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pvp')
    .setDescription('⚔️ Desafie outro jogador!')
    .addUserOption(o => o.setName('alvo').setDescription('Quem você quer desafiar?').setRequired(true)),

  async execute(interaction) {
    const challenger = interaction.user;
    const target = interaction.options.getUser('alvo');

    if (target.id === challenger.id) return interaction.reply({ content: '❌ Você não pode lutar contra si mesmo!', ephemeral: true });
    if (target.bot) return interaction.reply({ content: '❌ Você não pode lutar contra bots!', ephemeral: true });

    const challengerData = getUser(challenger.id);
    const cd = cooldownLeft(challengerData.pvp_last, PVP_COOLDOWN);
    if (cd > 0) return interaction.reply({ content: `⏳ Aguarde **${formatTime(cd)}** para lutar novamente!`, ephemeral: true });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`pvp_accept:${challenger.id}:${target.id}`).setLabel('⚔️ Aceitar').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`pvp_decline:${challenger.id}:${target.id}`).setLabel('🏳️ Recusar').setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      content: `${target}`,
      embeds: [new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('⚔️ Desafio PvP!')
        .setDescription(`**${challenger.username}** desafiou **${target.username}** para uma batalha!\n\n${target.username}, você aceita o desafio?`)
        .addFields(
          { name: '⚔️ Desafiante', value: challenger.username, inline: true },
          { name: '🛡️ Desafiado', value: target.username, inline: true }
        )
        .setFooter({ text: 'O desafio expira em 60 segundos!' })
      ],
      components: [row]
    });

    // Auto-expire
    setTimeout(async () => {
      await interaction.editReply({ components: [] }).catch(() => {});
    }, 60000);
  }
};
