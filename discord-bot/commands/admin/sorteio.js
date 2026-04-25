const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { loadDB, saveDB } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sorteio')
    .setDescription('🎉 Sistema de sorteios!')
    .addSubcommand(s => s.setName('criar').setDescription('🎉 Criar sorteio (ADM)')
      .addStringOption(o => o.setName('premio').setDescription('Prêmio').setRequired(true))
      .addIntegerOption(o => o.setName('duracao').setDescription('Duração em minutos').setRequired(true).setMinValue(1))
      .addIntegerOption(o => o.setName('vencedores').setDescription('Nº vencedores').setMinValue(1).setMaxValue(10)))
    .addSubcommand(s => s.setName('listar').setDescription('📋 Ver sorteios ativos')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'criar') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
        return interaction.reply({ content: '❌ Apenas ADMs!', ephemeral: true });

      const premio = interaction.options.getString('premio');
      const duracao = interaction.options.getInteger('duracao');
      const numVenc = interaction.options.getInteger('vencedores') || 1;
      const endTime = Date.now() + duracao * 60 * 1000;

      const embed = new EmbedBuilder()
        .setColor('#f1c40f').setTitle('🎉 SORTEIO!')
        .setDescription([
          `> 🎁 **Prêmio:** ${premio}`,
          `> 👑 **Vencedores:** ${numVenc}`,
          `> ⏱️ **Termina:** <t:${Math.floor(endTime/1000)}:R>`,
          `> 👥 **Participantes:** 0`,
          '',
          '**Clique em 🎉 para participar!**',
        ].join('\n'))
        .setFooter({ text: `Criado por ${interaction.user.username}` }).setTimestamp();

      const msg = await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('giveaway_join:placeholder').setLabel('🎉 Participar').setStyle(ButtonStyle.Success))], fetchReply: true });

      await msg.edit({ components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`giveaway_join:${msg.id}`).setLabel('🎉 Participar').setStyle(ButtonStyle.Success))] });

      const giveaways = loadDB('giveaways');
      giveaways[msg.id] = { prize: premio, endTime, winners: numVenc, channelId: interaction.channelId, guildId: interaction.guildId, createdBy: interaction.user.username, participants: [], ended: false };
      saveDB('giveaways', giveaways);

      setTimeout(async () => {
        try {
          const gaws = loadDB('giveaways');
          const gaw = gaws[msg.id];
          if (!gaw || gaw.ended) return;
          gaw.ended = true; saveDB('giveaways', gaws);
          const channel = await interaction.client.channels.fetch(gaw.channelId);
          const message = await channel.messages.fetch(msg.id);
          if (gaw.participants.length === 0) {
            return message.edit({ embeds: [new EmbedBuilder().setColor('#e74c3c').setTitle('🎉 ENCERRADO').setDescription(`Prêmio: ${gaw.prize}\n\n❌ Ninguém participou...`)], components: [] });
          }
          const winnerIds = [...gaw.participants].sort(()=>Math.random()-0.5).slice(0, Math.min(gaw.winners, gaw.participants.length));
          const mentions = winnerIds.map(id=>`<@${id}>`).join(', ');
          await message.edit({ embeds: [new EmbedBuilder().setColor('#2ecc71').setTitle('🎉 SORTEIO ENCERRADO!').setDescription(`> 🎁 **Prêmio:** ${gaw.prize}\n> 🏆 **Vencedor(es):** ${mentions}\n> 👥 **Participantes:** ${gaw.participants.length}`)], components: [] });
          await channel.send(`🎊 Parabéns ${mentions}! Você ganhou **${gaw.prize}**! 🎉`);
        } catch(err) { console.error('Giveaway error:', err); }
      }, duracao * 60 * 1000);
    }

    if (sub === 'listar') {
      const giveaways = loadDB('giveaways');
      const active = Object.entries(giveaways).filter(([,g]) => !g.ended && Date.now() < g.endTime);
      if (active.length === 0) return interaction.reply({ content: '❌ Nenhum sorteio ativo!', ephemeral: true });
      const lines = active.map(([,g]) => `🎉 **${g.prize}** — termina <t:${Math.floor(g.endTime/1000)}:R> | 👥 ${g.participants.length}`).join('\n');
      return interaction.reply({ embeds: [new EmbedBuilder().setColor('#f1c40f').setTitle('📋 Sorteios Ativos').setDescription(lines)], ephemeral: true });
    }
  }
};
