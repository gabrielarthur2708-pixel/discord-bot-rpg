function randomChance(percent) {
  return Math.random() * 100 < percent;
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatCoins(amount) {
  return `💰 ${amount.toLocaleString('pt-BR')} moedas`;
}

function cooldownLeft(lastTime, cooldownMs) {
  if (!lastTime) return 0;
  const diff = Date.now() - lastTime;
  return Math.max(0, cooldownMs - diff);
}

function formatTime(ms) {
  if (ms <= 0) return '0s';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function getCurrentSeason() {
  // Seasons change every 2 days based on day of year
  const dayOfYear = Math.floor((Date.now() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24));
  const seasonIndex = Math.floor(dayOfYear / 2) % 4;
  const seasons = ['spring', 'summer', 'autumn', 'winter'];
  return seasons[seasonIndex];
}

const SEASON_INFO = {
  spring: { name: '🌸 Primavera', bonus: ['morango', 'alface'] },
  summer: { name: '☀️ Verão', bonus: ['milho', 'tomate', 'melancia'] },
  autumn: { name: '🍂 Outono', bonus: ['abóbora', 'uva'] },
  winter: { name: '❄️ Inverno', bonus: ['cogumelo', 'batata'] },
};

const FISH_RARITIES = [
  { name: 'Gigante', emoji: '🐟', chance: 60, min: 100, max: 300 },
  { name: 'Anjo', emoji: '🐠', chance: 25, min: 400, max: 700 },
  { name: 'Arcanjo', emoji: '🦈', chance: 10, min: 800, max: 1500 },
  { name: 'Semideus', emoji: '🐉', chance: 4, min: 2000, max: 4000 },
  { name: 'Deus', emoji: '✨', chance: 1, min: 5000, max: 10000 },
];

const HUNT_ANIMALS = [
  { name: 'Coelho', emoji: '🐰', chance: 70, coins: 300 },
  { name: 'Cervo', emoji: '🦌', chance: 20, coins: 900 },
  { name: 'Lobo', emoji: '🐺', chance: 7, coins: 2000 },
  { name: 'Urso', emoji: '🐻', chance: 2.5, coins: 5000 },
  { name: 'Dragão', emoji: '🐲', chance: 0.5, coins: 15000 },
];

const FARM_PLANTS = [
  { name: 'morango', emoji: '🍓', time: 5 * 60 * 1000, coins: 200, season: 'spring' },
  { name: 'alface', emoji: '🥬', time: 3 * 60 * 1000, coins: 120, season: 'spring' },
  { name: 'milho', emoji: '🌽', time: 8 * 60 * 1000, coins: 350, season: 'summer' },
  { name: 'tomate', emoji: '🍅', time: 6 * 60 * 1000, coins: 250, season: 'summer' },
  { name: 'melancia', emoji: '🍉', time: 10 * 60 * 1000, coins: 500, season: 'summer' },
  { name: 'abóbora', emoji: '🎃', time: 7 * 60 * 1000, coins: 300, season: 'autumn' },
  { name: 'uva', emoji: '🍇', time: 9 * 60 * 1000, coins: 420, season: 'autumn' },
  { name: 'cogumelo', emoji: '🍄', time: 4 * 60 * 1000, coins: 180, season: 'winter' },
  { name: 'batata', emoji: '🥔', time: 5 * 60 * 1000, coins: 220, season: 'winter' },
];

const PETS = [
  { id: 'cat', name: 'Gato', emoji: '🐱', price: 5000, bonus: 'aura_boost', desc: '+10% aura' },
  { id: 'dog', name: 'Cachorro', emoji: '🐶', price: 4000, bonus: 'shop_discount', desc: '-10% preço loja' },
  { id: 'wolf', name: 'Lobo', emoji: '🐺', price: 8000, bonus: 'hunt_boost', desc: '+15% caça' },
  { id: 'cow', name: 'Vaca', emoji: '🐄', price: 6000, bonus: 'farm_speed', desc: '-20% tempo fazenda' },
  { id: 'chicken', name: 'Galinha', emoji: '🐔', price: 3000, bonus: 'extra_items', desc: '+10% itens extras' },
  { id: 'dragon', name: 'Dragão', emoji: '🐲', price: 50000, bonus: 'rarity_boost', desc: '+5% raridade' },
  { id: 'phoenix', name: 'Fênix', emoji: '🔥', price: 30000, bonus: 'aura_protect', desc: 'Protege perda de aura 1x/dia' },
];

const JOBS = [
  { id: 'fisherman', name: 'Pescador', emoji: '🎣', bonus: 'fish_boost', desc: '+20% pesca' },
  { id: 'farmer', name: 'Fazendeiro', emoji: '🌾', bonus: 'farm_boost', desc: '+25% fazenda' },
  { id: 'hunter', name: 'Caçador', emoji: '🏹', bonus: 'hunt_boost', desc: '+20% caça' },
  { id: 'merchant', name: 'Comerciante', emoji: '💼', bonus: 'sell_boost', desc: '+15% vendas' },
  { id: 'gambler', name: 'Apostador', emoji: '🎲', bonus: 'casino_boost', desc: '+10% cassino' },
];

function rollFish(hasDragonPet) {
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const fish of FISH_RARITIES) {
    const chance = hasDragonPet ? Math.min(fish.chance + (fish.chance * 0.05), 100) : fish.chance;
    cumulative += chance;
    if (roll < cumulative) {
      const value = randomBetween(fish.min, fish.max);
      return { ...fish, value };
    }
  }
  return { ...FISH_RARITIES[0], value: randomBetween(FISH_RARITIES[0].min, FISH_RARITIES[0].max) };
}

function rollHunt(hasWolfPet, isHunterJob) {
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const animal of HUNT_ANIMALS) {
    cumulative += animal.chance;
    if (roll < cumulative) {
      let coins = animal.coins;
      if (hasWolfPet) coins = Math.floor(coins * 1.15);
      if (isHunterJob) coins = Math.floor(coins * 1.20);
      return { ...animal, coins };
    }
  }
  return HUNT_ANIMALS[0];
}

module.exports = {
  randomChance, randomBetween, formatCoins, cooldownLeft, formatTime,
  getCurrentSeason, SEASON_INFO, FISH_RARITIES, HUNT_ANIMALS, FARM_PLANTS,
  PETS, JOBS, rollFish, rollHunt,
};
