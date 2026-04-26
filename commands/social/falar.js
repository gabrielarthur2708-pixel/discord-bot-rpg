const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const { speak } = require('../../utils/voiceTTS');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('falar')
    .setDescription('🗣️ Faz a Lúmen falar algo na call (Google TTS pt-BR)')
    .addStringOption(o =>
      o.setName('texto')
        .setDescription('O que ela vai falar')
        .setRequired(true)
        .setMaxLength(500)),

  async execute(interaction) {
    const text = interaction.options.getString('texto').trim();
    if (!text) {
      return interaction.reply({ content: '❌ Você precisa me dizer o que falar!', ephemeral: true });
    }

    const connection = getVoiceConnection(interaction.guild.id);
    if (!connection) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Não estou em nenhuma call!')
          .setDescription('Entre numa call e use `/call` primeiro pra eu entrar 💜')],
        ephemeral: true,
      });
    }

    try {
      await speak(interaction.guild.id, text);
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#9b59b6')
          .setTitle('🗣️ Falando na call...')
          .setDescription(`> ${text.length > 300 ? text.slice(0, 300) + '...' : text}`)
          .setFooter({ text: 'Lúmen • Voz Google TTS' })],
      });
    } catch (err) {
      console.error('falar command error:', err);
      return interaction.reply({
        content: `❌ Erro ao falar: ${err.message || 'desconhecido'}`,
        ephemeral: true,
      });
    }
  },
};
