const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus, entersState, getVoiceConnection } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('call')
    .setDescription('🎙️ Faz a Lúmen entrar na sua call (e nunca sair!)'),

  async execute(interaction) {
    const member = interaction.member;
    const channel = member?.voice?.channel;

    if (!channel) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Você não está em uma call!')
          .setDescription('Entre em um canal de voz primeiro e use `/call` de novo.')],
        ephemeral: true,
      });
    }

    const me = interaction.guild.members.me;
    const perms = channel.permissionsFor(me);
    if (!perms?.has('Connect') || !perms?.has('Speak')) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Sem permissão!')
          .setDescription('Não tenho permissão para **Conectar** ou **Falar** nesse canal.')],
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      const existing = getVoiceConnection(interaction.guild.id);
      if (existing) existing.destroy();

      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false,
      });

      // Auto-reconnect: se cair, tenta voltar pra mesma call pra sempre
      connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(connection, VoiceConnectionStatus.Signalling, 5000),
            entersState(connection, VoiceConnectionStatus.Connecting, 5000),
          ]);
        } catch {
          // Se foi desconectada de verdade, reconecta na mesma call
          try {
            connection.destroy();
          } catch {}
          joinVoiceChannel({
            channelId: channel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: false,
          });
        }
      });

      await entersState(connection, VoiceConnectionStatus.Ready, 30_000);

      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor('#2ecc71')
          .setTitle('🎙️ Cheguei na call!')
          .setDescription(`Entrei em **${channel.name}** e não vou sair! 💜\n\nSe me tirarem, eu volto sozinha.`)
          .setFooter({ text: 'Lúmen • Modo Companhia Eterna' })],
      });
    } catch (err) {
      console.error('call command error:', err);
      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Não consegui entrar')
          .setDescription(`Erro: \`${err.message || 'desconhecido'}\``)],
      });
    }
  },
};
