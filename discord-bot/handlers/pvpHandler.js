const { EmbedBuilder } = require('discord.js');
const { getUser, saveUser } = require('../utils/database');
const { randomBetween } = require('../utils/helpers');

async function handleButton(interaction, action, args) {
  const [challengerId, targetId] = args;

  if (action === 'pvp_decline') {
    if (interaction.user.id !== targetId) {
      return interaction.reply({ content: '❌ Apenas o desafiado pode recusar!', ephemeral: true });
    }
    return interaction.update({
      embeds: [new EmbedBuilder().setColor('#95a5a6').setTitle('🏳️ Duelo Recusado').setDescription(`**${interaction.user.username}** recusou o duelo.`)],
      components: []
    });
  }

  if (action === 'pvp_accept') {
    if (interaction.user.id !== targetId) {
      return interaction.reply({ content: '❌ Apenas o desafiado pode aceitar!', ephemeral: true });
    }

    const challenger = await interaction.client.users.fetch(challengerId);
    const target = interaction.user;

    const challengerData = getUser(challengerId);
    const targetData = getUser(targetId);

    // Battle calculation (random with slight skill factor based on aura)
    const challengerPower = randomBetween(1, 100) + Math.floor((challengerData.aura || 0) / 10);
    const targetPower = randomBetween(1, 100) + Math.floor((targetData.aura || 0) / 10);

    const challengerWon = challengerPower > targetPower;
    const winner = challengerWon ? challengerData : targetData;
    const loser = challengerWon ? targetData : challengerData;
    const winnerId = challengerWon ? challengerId : targetId;
    const loserId = challengerWon ? targetId : challengerId;
    const winnerUser = challengerWon ? challenger : target;
    const loserUser = challengerWon ? target : challenger;

    const coinsWon = randomBetween(500, 2000);
    const coinsLost = randomBetween(300, 1000);
    const auraWon = 50;
    const auraLost = 30;

    // Apply phoenix pet protection
    const loserHasPhoenix = loser.pet === 'phoenix';
    const phoenixUsed = loserHasPhoenix && !loser._phoenix_used_today;

    winner.coins = (winner.coins || 0) + coinsWon;
    winner.aura = (winner.aura || 0) + auraWon;
    winner.pvp_last = Date.now();

    if (phoenixUsed) {
      loser._phoenix_used_today = Date.now();
    } else {
      loser.coins = Math.max(0, (loser.coins || 0) - coinsLost);
      loser.aura = Math.max(0, (loser.aura || 0) - auraLost);
    }

    saveUser(winnerId, winner);
    saveUser(loserId, loser);

    const embed = new EmbedBuilder()
      .setColor('#f1c40f')
      .setTitle('⚔️ Resultado da Batalha!')
      .setDescription(`🏆 **${winnerUser.username}** venceu a batalha!`)
      .addFields(
        { name: `🏆 ${winnerUser.username}`, value: `+${coinsWon.toLocaleString('pt-BR')} moedas\n+${auraWon} aura`, inline: true },
        { name: `💀 ${loserUser.username}`, value: phoenixUsed ? '🔥 Fênix protegeu a aura!' : `-${coinsLost.toLocaleString('pt-BR')} moedas\n-${auraLost} aura`, inline: true },
        { name: '⚔️ Poder', value: `${winnerUser.username}: ${challengerWon ? challengerPower : targetPower} | ${loserUser.username}: ${challengerWon ? targetPower : challengerPower}`, inline: false }
      );

    return interaction.update({ embeds: [embed], components: [] });
  }
}

module.exports = { handleButton };
