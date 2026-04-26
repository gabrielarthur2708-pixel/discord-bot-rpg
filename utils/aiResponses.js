const { getUser, saveUser } = require('./database');
const { addXP, rollFish, rollHunt, FARM_PLANTS, getCurrentSeason } = require('./helpers');

async function runSlaveAction(client, userId, action) {
  const user = getUser(userId);
  const now = Date.now();
  const FISH_CD = 30 * 60 * 1000;
  const HUNT_CD = 30 * 60 * 1000;

  try {
    if (action === 'pescar') {
      const cdLeft = user.fish_last ? (user.fish_last + FISH_CD) - now : 0;
      if (cdLeft > 0) return { skipped: true, waitMs: cdLeft };
      
      const fish = rollFish(user.pet === 'dragon');
      let value = fish.value;
      if (user.job === 'fisherman') value = Math.floor(value * 1.15);
      user.coins = (user.coins || 0) + value;
      user.fish_last = now;
      user.total_fish = (user.total_fish || 0) + 1;
      user.missions = user.missions || {};
      user.missions.fish = (user.missions.fish || 0) + 1;
      addXP(user, 15);
      saveUser(userId, user);
      return {
        skipped: false,
        waitMs: FISH_CD,
        text: `🎣 Pesquei um **${fish.name}** ${fish.emoji} e vendi por **${value.toLocaleString('pt-BR')} moedas**!\n💰 Saldo atual: **${user.coins.toLocaleString('pt-BR')} moedas**`
      };
    }

    if (action === 'cacar') {
      const cdLeft = user.hunt_last ? (user.hunt_last + HUNT_CD) - now : 0;
      if (cdLeft > 0) return { skipped: true, waitMs: cdLeft };
      
      const animal = rollHunt(user.pet === 'wolf', user.job === 'hunter');
      user.coins = (user.coins || 0) + animal.coins;
      user.hunt_last = now;
      user.total_hunts = (user.total_hunts || 0) + 1;
      addXP(user, 25);
      saveUser(userId, user);
      return {
        skipped: false,
        waitMs: HUNT_CD,
        text: `🏹 Caçei um **${animal.name}** ${animal.emoji} e ganhei **${animal.coins.toLocaleString('pt-BR')} moedas**!\n💰 Saldo atual: **${user.coins.toLocaleString('pt-BR')} moedas**`
      };
    }

    if (action === 'plantar') {
      user.farm_plots = user.farm_plots || [];
      const season = getCurrentSeason();
      let earned = 0, harvested = 0, planted = 0;
      
      user.farm_plots = user.farm_plots.filter(p => {
        if (now >= p.ready_at && now <= p.ready_at + 5 * 60 * 1000) {
          let coins = p.coins;
          if (p.season === season) coins = Math.floor(coins * 1.3);
          if (user.job === 'farmer') coins = Math.floor(coins * 1.2);
          earned += coins; harvested++;
          return false;
        }
        if (now > p.ready_at + 5 * 60 * 1000) return false;
        return true;
      });

      while (user.farm_plots.length < 5) {
        const seasonPlants = FARM_PLANTS.filter(p => p.season === season);
        const plant = seasonPlants[Math.floor(Math.random() * seasonPlants.length)] || FARM_PLANTS[0];
        let growTime = plant.time;
        if (user.pet === 'cow') growTime = Math.floor(growTime * 0.8);
        user.farm_plots.push({
          name: plant.name, emoji: plant.emoji, coins: plant.coins,
          season: plant.season, time: plant.time,
          planted_at: now, ready_at: now + growTime
        });
        planted++;
      }

      if (earned > 0) user.coins = (user.coins || 0) + earned;
      addXP(user, planted * 10);
      saveUser(userId, user);

      const nextReady = user.farm_plots.reduce((min, p) => Math.min(min, p.ready_at), Infinity);
      const waitMs = nextReady - now + 5000;

      if (earned > 0) return {
        skipped: false,
        waitMs,
        text: `🌾 Colhi **${harvested}** plantas e ganhei **${earned.toLocaleString('pt-BR')} moedas**! Plantei mais **${planted}** 🌱\n💰 Saldo atual: **${user.coins.toLocaleString('pt-BR')} moedas**`
      };
      if (planted > 0) return { skipped: false, waitMs, text: `🌱 Plantei **${planted}** novas plantas! Próxima colheita em **${Math.floor(waitMs/60000)} min**` };
      return { skipped: true, waitMs };
    }
  } catch (err) {
    console.error('Slave action error:', err);
  }
  return { skipped: true, waitMs: 60000 };
}

module.exports = { runSlaveAction };
