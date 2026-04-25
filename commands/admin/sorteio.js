const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { loadDB, saveDB } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sorteio')
    .setDescription('🎉 Sistema de sorteios (ADM)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s => s.setName('criar').setDescription('🎉 Criar um sorteio')
      .addStringOption(o => o.setName('premio').setDescription('Prêmio do sorteio').setRequired(true))
      .addIntegerOption(o => o.setName('duracao').setDescription('Duração em minutos').setRequired(true).setMinValue(1))
      .addIntegerOption(o => o.setName('vencedores').setDescription('Número de vencedores').setMinValue(1).setMaxValue(10))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'criar') {
      const premio = interaction.options.getString('premio');
      const duracao = interaction.options.getInteger('duracao');
      const numVencedores = interaction.options.getInteger('vencedores') || 1;
      const endTime = Date.now() + duracao * 60 * 1000;

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('giveaway_join:placeholder')
          .setLabel('🎉 Participar')
          .setStyle(ButtonStyle.Success)
      );

      const embed = new EmbedBuilder()
        .setColor('#f1c40f')
        .setTitle('🎉 SORTEIO!')
        .setDescription(`**Prêmio:** ${premio}\n\n🎊 Clique em **Participar** para entrar!\n⏳ Termina: <t:${Math.floor(endTime / 1000)}:R>\n👑 Vencedores: ${numVencedores}`)
        .setFooter({ text: `Criado por ${interaction.user.username}` })
        .setTimestamp();

      const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

      // Update button with message ID
      const realRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`giveaway_join:${msg.id}`)
          .setLabel('🎉 Participar')
          .setStyle(ButtonStyle.Success)
      );
      await msg.edit({ components: [realRow] });

      // Save giveaway
      const giveaways = loadDB('giveaways');
      giveaways[msg.id] = {
        prize: premio,
        endTime,
        winners: numVencedores,
        channelId: interaction.channelId,
        guildId: interaction.guildId,
        participants: [],
        ended: false,
      };
      saveDB('giveaways', giveaways);

      // Schedule end
      setTimeout(async () => {
        try {
          const gaws = loadDB('giveaways');
          const gaw = gaws[msg.id];
          if (!gaw || gaw.ended) return;
          gaw.ended = true;
          saveDB('giveaways', gaws);

          const channel = await interaction.client.channels.fetch(gaw.channelId);
          const message = await channel.messages.fetch(msg.id);

          if (gaw.participants.length === 0) {
            await message.edit({
              embeds: [new EmbedBuilder().setColor('#e74c3c').setTitle('🎉 SORTEIO ENCERRADO').setDescription(`**Prêmio:** ${gaw.prize}\n\n❌ Ninguém participou...`)],
              components: []
            });
            return;
          }

          // Pick winners
          const shuffled = [...gaw.participants].sort(() => Math.random() - 0.5);
          const winnerIds = shuffled.slice(0, Math.min(gaw.winners, shuffled.length));
          const winnerMentions = winnerIds.map(id => `<@${id}>`).join(', ');

          await message.edit({
            embeds: [new EmbedBuilder().setColor('#2ecc71').setTitle('🎉 SORTEIO ENCERRADO!').setDescription(`**Prêmio:** ${gaw.prize}\n\n🏆 **Vencedor(es):** ${winnerMentions}\n👥 Participantes: ${gaw.participants.length}`)],
            components: []
          });
          await channel.send(`🎊 Parabéns ${winnerMentions}! Você ganhou **${gaw.prize}**!`);
        } catch (err) {
          console.error('Erro ao encerrar sorteio:', err);
        }
      }, duracao * 60 * 1000);
    }
  }
};
