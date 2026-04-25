const { EmbedBuilder } = require('discord.js');
const { loadDB, saveDB } = require('../utils/database');

async function handleButton(interaction, action, args) {
  const msgId = args[0];
  const giveaways = loadDB('giveaways');
  const gaw = giveaways[msgId];

  if (!gaw) return interaction.reply({ content: '❌ Sorteio não encontrado!', ephemeral: true });
  if (gaw.ended) return interaction.reply({ content: '❌ Esse sorteio já terminou!', ephemeral: true });

  const userId = interaction.user.id;
  if (gaw.participants.includes(userId)) {
    return interaction.reply({ content: '✅ Você já está participando desse sorteio!', ephemeral: true });
  }

  gaw.participants.push(userId);
  saveDB('giveaways', giveaways);

  return interaction.reply({
    content: `🎉 Você entrou no sorteio! **${gaw.participants.length}** participante(s) até agora.`,
    ephemeral: true
  });
}

module.exports = { handleButton };
