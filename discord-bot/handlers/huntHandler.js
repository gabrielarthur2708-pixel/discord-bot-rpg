const { EmbedBuilder } = require('discord.js');
const { getUser, saveUser } = require('../utils/database');

async function handleButton(interaction, action, args) {
  const ownerId = args[0];
  if (interaction.user.id !== ownerId) return interaction.reply({ content: '❌ Essa caçada não é sua!', ephemeral: true });

  const user = getUser(interaction.user.id);
  const pending = user._pending_hunt;
  if (!pending || Date.now() - pending.timestamp > 60000) return interaction.reply({ content: '❌ Essa caçada expirou!', ephemeral: true });

  const animal = pending.animal;
  delete user._pending_hunt;

  if (action === 'hunt_sell') {
    user.coins = (user.coins || 0) + animal.coins;
    saveUser(interaction.user.id, user);
    return interaction.update({
      embeds: [new EmbedBuilder().setColor('#2ecc71').setTitle('💰 Vendido!')
        .addFields(
          { name: '🎯 Animal', value: `${animal.emoji} ${animal.name}`, inline: true },
          { name: '💰 Recebido', value: `${animal.coins.toLocaleString('pt-BR')} moedas`, inline: true },
          { name: '💵 Saldo', value: `${user.coins.toLocaleString('pt-BR')} moedas`, inline: true },
        )
      ], components: []
    });
  }

  if (action === 'hunt_keep') {
    user.hunt_inventory = user.hunt_inventory || [];
    user.hunt_inventory.push({ name: animal.name, emoji: animal.emoji, value: animal.coins, timestamp: Date.now() });
    saveUser(interaction.user.id, user);
    return interaction.update({
      embeds: [new EmbedBuilder().setColor('#3498db').setTitle('🎒 Guardado no Inventário!')
        .addFields(
          { name: '🎯 Animal', value: `${animal.emoji} ${animal.name}`, inline: true },
          { name: '💰 Valor', value: `${animal.coins.toLocaleString('pt-BR')} moedas`, inline: true },
          { name: '🎒 Inventário', value: `${user.hunt_inventory.length} animais guardados`, inline: true },
        )
      ], components: []
    });
  }
}

module.exports = { handleButton };
