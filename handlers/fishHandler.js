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
