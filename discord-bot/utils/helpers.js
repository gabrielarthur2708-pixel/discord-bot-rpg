function randomChance(percent) { return Math.random() * 100 < percent; }
function randomBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function formatCoins(amount) { return `💰 ${amount.toLocaleString('pt-BR')} moedas`; }
function cooldownLeft(lastTime, cooldownMs) { if (!lastTime) return 0; return Math.max(0, cooldownMs - (Date.now() - lastTime)); }
function formatTime(ms) {
  if (ms <= 0) return '0s';
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function getCurrentSeason() {
  const day = Math.floor((Date.now() - new Date('2024-01-01').getTime()) / (1000*60*60*24));
  return ['spring','summer','autumn','winter'][Math.floor(day/2)%4];
}

const SEASON_INFO = {
  spring: { name: '🌸 Primavera', bonus: ['morango','alface'] },
  summer: { name: '☀️ Verão', bonus: ['milho','tomate','melancia'] },
  autumn: { name: '🍂 Outono', bonus: ['abóbora','uva'] },
  winter: { name: '❄️ Inverno', bonus: ['cogumelo','batata'] },
};

// BALANCED - max 1000 coins per fish
const FISH_RARITIES = [
  { name: 'Comum',    emoji: '🐟', chance: 50, min: 20,  max: 80   },
  { name: 'Incomum',  emoji: '🐠', chance: 28, min: 80,  max: 200  },
  { name: 'Raro',     emoji: '🦈', chance: 14, min: 200, max: 450  },
  { name: 'Épico',    emoji: '🐉', chance: 6,  min: 450, max: 750  },
  { name: 'Lendário', emoji: '✨', chance: 2,  min: 750, max: 1000 },
];

// BALANCED - max 1000 coins per hunt
const HUNT_ANIMALS = [
  { name: 'Coelho', emoji: '🐰', chance: 50, coins: 50  },
  { name: 'Cervo',  emoji: '🦌', chance: 28, coins: 150 },
  { name: 'Lobo',   emoji: '🐺', chance: 14, coins: 350 },
  { name: 'Urso',   emoji: '🐻', chance: 6,  coins: 650 },
  { name: 'Dragão', emoji: '🐲', chance: 2,  coins: 1000},
];

// BALANCED farm values
const FARM_PLANTS = [
  { name: 'morango',  emoji: '🍓', time: 8*60*1000,  coins: 80,  season: 'spring' },
  { name: 'alface',   emoji: '🥬', time: 5*60*1000,  coins: 50,  season: 'spring' },
  { name: 'milho',    emoji: '🌽', time: 12*60*1000, coins: 120, season: 'summer' },
  { name: 'tomate',   emoji: '🍅', time: 10*60*1000, coins: 100, season: 'summer' },
  { name: 'melancia', emoji: '🍉', time: 15*60*1000, coins: 180, season: 'summer' },
  { name: 'abóbora',  emoji: '🎃', time: 12*60*1000, coins: 110, season: 'autumn' },
  { name: 'uva',      emoji: '🍇', time: 14*60*1000, coins: 150, season: 'autumn' },
  { name: 'cogumelo', emoji: '🍄', time: 6*60*1000,  coins: 70,  season: 'winter' },
  { name: 'batata',   emoji: '🥔', time: 8*60*1000,  coins: 90,  season: 'winter' },
];

const PETS = [
  { id: 'cat',     name: 'Gato',     emoji: '🐱', price: 3000,  bonus: 'aura_boost',  desc: '+10% aura'           },
  { id: 'dog',     name: 'Cachorro', emoji: '🐶', price: 2500,  bonus: 'shop_discount',desc: '-10% preço loja'     },
  { id: 'wolf',    name: 'Lobo',     emoji: '🐺', price: 5000,  bonus: 'hunt_boost',  desc: '+10% caça'           },
  { id: 'cow',     name: 'Vaca',     emoji: '🐄', price: 4000,  bonus: 'farm_speed',  desc: '-20% tempo fazenda'  },
  { id: 'chicken', name: 'Galinha',  emoji: '🐔', price: 2000,  bonus: 'extra_items', desc: '+10% itens extras'   },
  { id: 'dragon',  name: 'Dragão',   emoji: '🐲', price: 30000, bonus: 'rarity_boost',desc: '+5% raridade'        },
  { id: 'phoenix', name: 'Fênix',    emoji: '🔥', price: 20000, bonus: 'aura_protect',desc: 'Protege aura 1x/dia' },
];

const JOBS = [
  { id: 'fisherman', name: 'Pescador',    emoji: '🎣', bonus: 'fish_boost',  desc: '+15% valor peixes'  },
  { id: 'farmer',    name: 'Fazendeiro',  emoji: '🌾', bonus: 'farm_boost',  desc: '+20% colheita'      },
  { id: 'hunter',    name: 'Caçador',     emoji: '🏹', bonus: 'hunt_boost',  desc: '+15% caça'          },
  { id: 'merchant',  name: 'Comerciante', emoji: '💼', bonus: 'sell_boost',  desc: '+10% vendas'        },
  { id: 'gambler',   name: 'Apostador',   emoji: '🎲', bonus: 'casino_boost',desc: '+5% cassino'        },
];

function xpForLevel(level) { return level * level * 150; }

function addXP(user, amount) {
  user.xp = (user.xp || 0) + amount;
  let leveled = null;
  while (user.xp >= xpForLevel(user.level || 1)) {
    user.xp -= xpForLevel(user.level || 1);
    user.level = (user.level || 1) + 1;
    user.coins = (user.coins || 0) + user.level * 100;
    leveled = user.level;
  }
  return leveled;
}

function rollFish(hasDragonPet) {
  const roll = Math.random() * 100;
  let cum = 0;
  for (const fish of FISH_RARITIES) {
    cum += hasDragonPet ? Math.min(fish.chance * 1.05, 100) : fish.chance;
    if (roll < cum) return { ...fish, value: randomBetween(fish.min, fish.max) };
  }
  return { ...FISH_RARITIES[0], value: randomBetween(FISH_RARITIES[0].min, FISH_RARITIES[0].max) };
}

function rollHunt(hasWolfPet, isHunterJob) {
  const roll = Math.random() * 100;
  let cum = 0;
  for (const a of HUNT_ANIMALS) {
    cum += a.chance;
    if (roll < cum) {
      let coins = a.coins;
      if (hasWolfPet) coins = Math.floor(coins * 1.1);
      if (isHunterJob) coins = Math.floor(coins * 1.15);
      return { ...a, coins };
    }
  }
  return HUNT_ANIMALS[0];
}

module.exports = { randomChance, randomBetween, formatCoins, cooldownLeft, formatTime, getCurrentSeason, SEASON_INFO, FISH_RARITIES, HUNT_ANIMALS, FARM_PLANTS, PETS, JOBS, xpForLevel, addXP, rollFish, rollHunt };
