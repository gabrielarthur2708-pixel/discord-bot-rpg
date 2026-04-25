const { EmbedBuilder } = require('discord.js');
const { getUser, saveUser } = require('../utils/database');
const { FARM_PLANTS, getCurrentSeason, formatTime } = require('../utils/helpers');

async function handleButton(interaction, action, args) {
  // handled via select menu in interactionCreate
}

async function handleSelect(interaction, args) {
  const ownerId = args[0];
  if (interaction.user.id !== ownerId) {
    return interaction.reply({ content: '❌ Essa não é sua fazenda!', ephemeral: true });
  }

  const plantName = interaction.values[0];
  const plant = FARM_PLANTS.find(p => p.name === plantName);
  if (!plant) return interaction.reply({ content: '❌ Planta inválida!', ephemeral: true });

  const user = getUser(interaction.user.id);
  if ((user.farm_plots || []).length >= 5) {
    return interaction.reply({ content: '❌ Você já tem 5 plantas!', ephemeral: true });
  }

  let growTime = plant.time;
  if (user.pet === 'cow') growTime = Math.floor(growTime * 0.8);

  user.farm_plots = user.farm_plots || [];
  user.farm_plots.push({
    name: plant.name,
    emoji: plant.emoji,
    coins: plant.coins,
    season: plant.season,
    planted_at: Date.now(),
    ready_at: Date.now() + growTime,
  });

  saveUser(interaction.user.id, user);

  await interaction.update({
    embeds: [new EmbedBuilder()
      .setColor('#27ae60')
      .setTitle('🌱 Plantado!')
      .setDescription(`${plant.emoji} **${plant.name}** foi plantado!\n⏳ Pronto em: **${formatTime(growTime)}**\n📊 Parcelas usadas: ${user.farm_plots.length}/5`)
    ],
    components: []
  });
}

module.exports = { handleButton, handleSelect };
