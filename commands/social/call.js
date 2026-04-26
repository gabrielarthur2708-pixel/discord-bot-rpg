const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('call')
    .setDescription('🎙️ Faz a Lúmen entrar na sua call (e nunca sair!)'),

  async execute(interaction) {
    // Defer já — entrar em call leva tempo
    await interaction.deferReply();

    const member = interaction.member;
    const channel = member?.voice?.channel;

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
    if (!perms?.has('Connect') || !perms?.has('Speak')) {
      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Sem permissão!')
          .setDescription('Não tenho permissão para **Conectar** ou **Falar** nesse canal.')],
      });
    }

    try {
      // Se já estou conectada nessa call, só avisa
      const existing = getVoiceConnection(interaction.guild.id);
      if (existing && existing.joinConfig?.channelId === channel.id) {
        return interaction.editReply({
          embeds: [new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('💜 Já estou aqui!')
            .setDescription(`Já estou em **${channel.name}** com você!`)],
        });
      }
      if (existing) existing.destroy();

      joinVoiceChannel({
        channelId: channel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false,
      });

      // Não espero pelo estado Ready — Discord pode demorar e a interaction expira
      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor('#2ecc71')
          .setTitle('🎙️ Cheguei na call!')
          .setDescription(`Entrei em **${channel.name}** 💜\n\nUse \`/falar\` pra eu dizer algo, ou me chame pelo nome no chat!`)
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
