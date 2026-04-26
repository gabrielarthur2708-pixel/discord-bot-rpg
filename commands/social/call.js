const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus, entersState } = require('@discordjs/voice');

function joinAndPersist(guild, channelId) {
  const connection = joinVoiceChannel({
    channelId,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: false,
    selfMute: true,
  });

  // Auto-reconnect if she ever gets kicked/disconnected
  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
      ]);
      // Reconnecting on its own
    } catch {
      // Truly disconnected — destroy and rejoin
      try { connection.destroy(); } catch {}
      setTimeout(() => joinAndPersist(guild, channelId), 3000);
    }
  });

  return connection;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('call')
    .setDescription('🎙️ Faz a Lúmen entrar na sua call (e nunca mais sair!)'),

  async execute(interaction) {
    await interaction.deferReply();

    const channel = interaction.member?.voice?.channel;
    if (!channel) {
      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Você não está em uma call!')
          .setDescription('Entre em um canal de voz primeiro e use `/call` de novo.')],
      });
    }

    const me = interaction.guild.members.me;
    const perms = channel.permissionsFor(me);
    if (!perms?.has('Connect')) {
      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Sem permissão!')
          .setDescription('Não tenho permissão para **Conectar** nesse canal.')],
      });
    }

    try {
      const existing = getVoiceConnection(interaction.guild.id);
      if (existing && existing.joinConfig?.channelId === channel.id) {
        return interaction.editReply({
          embeds: [new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('💜 Já estou aqui!')
            .setDescription(`Já estou em **${channel.name}** com você, e não vou sair!`)],
        });
      }
      if (existing) existing.destroy();

      joinAndPersist(interaction.guild, channel.id);

      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor('#2ecc71')
          .setTitle('🎙️ Cheguei na call!')
          .setDescription(`Entrei em **${channel.name}** 💜\n\nVou ficar aqui te fazendo companhia pra sempre. Se alguém me tirar, eu volto na hora!`)
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
