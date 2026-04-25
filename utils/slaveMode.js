const { loadDB, saveDB, getUser, saveUser } = require('../utils/database');
const { rollFish, rollHunt, FARM_PLANTS, getCurrentSeason, randomBetween, randomChance } = require('../utils/helpers');
const { EmbedBuilder } = require('discord.js');

// Active slave loops
const activeSlaves = new Map();

function hasSlaveAccess(userId) {
  const db = loadDB('slaves');
  return db[userId] && db[userId].active === true;
}

function grantSlaveAccess(userId, grantedBy) {
  const db = loadDB('slaves');
  db[userId] = { active: true, grantedBy, grantedAt: Date.now() };
  saveDB('slaves', db);
}

function revokeSlaveAccess(userId) {
  const db = loadDB('slaves');
  if (db[userId]) {
    db[userId].active = false;
    saveDB('slaves', db);
  }
  // Stop active loop
  if (activeSlaves.has(userId)) {
    clearInterval(activeSlaves.get(userId));
    activeSlaves.delete(userId);
  }
}

async function runSlaveTask(client, userId, channelId, task) {
  const user = getUser(userId);
  const results = [];

  if (task === 'pescar' || task === 'tudo') {
    const now = Date.now();
    const lastFish = user.fish_last || 0;
    if (now - lastFish >= 30000) {
      if (!randomChance(20)) {
        const fish = rollFish(user.pet === 'dragon');
        if (user.job === 'fisherman') fish.value = Math.floor(fish.value * 1.2);
        user.coins = (user.coins || 0) + fish.value;
        user.fish_last = now;
        user.missions.fish = (user.missions.fish || 0) + 1;
        user.total_fish = (user.total_fish || 0) + 1;
        if (!user.missions_claimed.fish && user.missions.fish >= 10) {
          user.coins += 2000;
          user.missions_claimed.fish = true;
        }
        results.push(`🎣 Pescou **${fish.name}** → +${fish.value.toLocaleString('pt-BR')} moedas`);
      }
    }
  }

  if (task === 'cacar' || task === 'tudo') {
    const now = Date.now();
    const lastHunt = user.hunt_last || 0;
    if (now - lastHunt >= 60000) {
      if (!randomChance(15)) {
        const animal = rollHunt(user.pet === 'wolf', user.job === 'hunter');
        user.coins = (user.coins || 0) + animal.coins;
        user.hunt_last = now;
        user.missions.hunt = (user.missions.hunt || 0) + 1;
        user.total_hunts = (user.total_hunts || 0) + 1;
        if (!user.missions_claimed.hunt && user.missions.hunt >= 3) {
          user.coins += 1800;
          user.missions_claimed.hunt = true;
        }
        results.push(`🏹 Caçou **${animal.name}** → +${animal.coins.toLocaleString('pt-BR')} moedas`);
      }
    }
  }

  if (task === 'plantar' || task === 'fazenda' || task === 'tudo') {
    const now = Date.now();
    const plots = user.farm_plots || [];

    // Harvest ready
    let earned = 0;
    const season = getCurrentSeason();
    const remaining = plots.filter(p => {
      const ROT_TIME = 5 * 60 * 1000;
      if (now > p.ready_at + ROT_TIME) return false;
      if (now >= p.ready_at) {
        let coins = p.coins;
        if (user.job === 'farmer') coins = Math.floor(coins * 1.25);
        if (p.season === season) coins = Math.floor(coins * 1.3);
        earned += coins;
        return false;
      }
      return true;
    });

    if (earned > 0) {
      user.coins = (user.coins || 0) + earned;
      user.farm_plots = remaining;
      results.push(`🌾 Colheu plantas → +${earned.toLocaleString('pt-BR')} moedas`);
    }

    // Plant new if space
    if ((user.farm_plots || []).length < 5) {
      const seasonPlants = FARM_PLANTS.filter(p => p.season === season);
      const bestPlant = seasonPlants[0] || FARM_PLANTS[0];
      let growTime = bestPlant.time;
      if (user.pet === 'cow') growTime = Math.floor(growTime * 0.8);

      user.farm_plots = user.farm_plots || [];
      user.farm_plots.push({
        name: bestPlant.name,
        emoji: bestPlant.emoji,
        coins: bestPlant.coins,
        season: bestPlant.season,
        planted_at: now,
        ready_at: now + growTime,
      });
      results.push(`🌱 Plantou **${bestPlant.name}** automaticamente`);
    }
  }

  if (task === 'vender' || task === 'tudo') {
    const fishInv = user.fish_inventory || [];
    if (fishInv.length > 0) {
      const total = fishInv.reduce((sum, f) => sum + f.value, 0);
      user.coins = (user.coins || 0) + total;
      user.fish_inventory = [];
      results.push(`💰 Vendeu ${fishInv.length} peixes → +${total.toLocaleString('pt-BR')} moedas`);
    }
  }

  saveUser(userId, user);

  if (results.length > 0) {
    try {
      const channel = await client.channels.fetch(channelId);
      const embed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle('🤖 Modo Automático Ativo')
        .setDescription(results.join('\n'))
        .addFields({ name: '💰 Saldo Atual', value: `${user.coins.toLocaleString('pt-BR')} moedas`, inline: true })
        .setFooter({ text: 'Sistema automático em execução...' });
      await channel.send({ content: `<@${userId}>`, embeds: [embed] });
    } catch {}
  }
}

function startSlaveLoop(client, userId, channelId, task) {
  if (activeSlaves.has(userId)) {
    clearInterval(activeSlaves.get(userId));
  }

  // Run immediately then every 35 seconds
  runSlaveTask(client, userId, channelId, task);
  const interval = setInterval(() => {
    runSlaveTask(client, userId, channelId, task);
  }, 35000);

  activeSlaves.set(userId, interval);
}

function stopSlaveLoop(userId) {
  if (activeSlaves.has(userId)) {
    clearInterval(activeSlaves.get(userId));
    activeSlaves.delete(userId);
    return true;
  }
  return false;
}

module.exports = { hasSlaveAccess, grantSlaveAccess, revokeSlaveAccess, startSlaveLoop, stopSlaveLoop };
