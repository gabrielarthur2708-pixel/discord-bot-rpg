const { EmbedBuilder } = require('discord.js');
const { getUser, saveUser } = require('../utils/database');

async function handleButton(interaction, action, args) {
  const ownerId = args[0];
  if (interaction.user.id !== ownerId) {
    return interaction.reply({ content: '❌ Esse não é o seu peixe!', ephemeral: true });
  }

  const user = getUser(interaction.user.id);
  const pending = user._pending_fish;

  if (!pending || Date.now() - pending.timestamp > 60000) {
    return interaction.reply({ content: '❌ Esse peixe expirou!', ephemeral: true });
  }

  const fish = pending.fish;
  delete user._pending_fish;

  // Check mission completion
  let missionMsg = '';
  if (!user.missions_claimed.fish && user.missions.fish >= 10) {
    user.coins += 2000;
    user.missions_claimed.fish = true;
    missionMsg = '\n\n🎯 **Missão Completa!** Pescou 10x → +2000 moedas!';
  }

  if (action === 'fish_keep') {
    user.fish_inventory = user.fish_inventory || [];
    user.fish_inventory.push({ name: fish.name, emoji: fish.emoji, value: fish.value, timestamp: Date.now() });
    saveUser(interaction.user.id, user);

    await interaction.update({
      embeds: [new EmbedBuilder()
        .setColor('#3498db')
        .setTitle('📦 Peixe Guardado!')
        .setDescription(`O **${fish.name}** ${fish.emoji} foi guardado no inventário!${missionMsg}`)
        .addFields({ name: '📦 Peixes no inventário', value: `${user.fish_inventory.length}`, inline: true })
      ],
      components: []
    });
  } else {
    user.coins = (user.coins || 0) + fish.value;
    saveUser(interaction.user.id, user);

    await interaction.update({
      embeds: [new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('💰 Peixe Vendido!')
        .setDescription(`O **${fish.name}** ${fish.emoji} foi vendido por **${fish.value.toLocaleString('pt-BR')} moedas**!${missionMsg}`)
        .addFields({ name: '💰 Saldo Total', value: `${user.coins.toLocaleString('pt-BR')} moedas`, inline: true })
      ],
      components: []
    });
  }
}

module.exports = { handleButton };

// Sell all fish
async function handleSellAll(interaction, args) {
  const ownerId = args[0];
  if (interaction.user.id !== ownerId) return interaction.reply({ content: '❌ Não é o seu inventário!', ephemeral: true });
  const { getUser, saveUser } = require('../utils/database');
  const user = getUser(interaction.user.id);
  const fishInv = user.fish_inventory || [];
  if (fishInv.length === 0) return interaction.reply({ content: '❌ Sem peixes para vender!', ephemeral: true });
  const total = fishInv.reduce((a, f) => a + (f.value || 0), 0);
  user.coins = (user.coins || 0) + total;
  user.fish_inventory = [];
  saveUser(interaction.user.id, user);
  const { EmbedBuilder } = require('discord.js');
  await interaction.update({ embeds: [new EmbedBuilder().setColor('#2ecc71').setTitle('💰 Todos os Peixes Vendidos!').setDescription(`Vendeu **${fishInv.length}** peixes por **${total.toLocaleString('pt-BR')} moedas**!\n💵 Saldo: **${user.coins.toLocaleString('pt-BR')}**`)], components: [] });
}
module.exports.handleSellAll = handleSellAll;
