const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadDB(name) {
  const file = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(file)) fs.writeFileSync(file, '{}');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function saveDB(name, data) {
  const file = path.join(DATA_DIR, `${name}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getUser(userId) {
  const db = loadDB('users');
  if (!db[userId]) {
    db[userId] = {
      coins: 500,
      aura: 0,
      inventory: [],
      fish_inventory: [],
      farm_plots: [],
      pet: null,
      job: null,
      warnings: [],
      muted_until: null,
      daily_last: null,
      weekly_last: null,
      pvp_last: null,
      hunt_last: null,
      fish_last: null,
      missions: { fish: 0, plant: 0, hunt: 0 },
      missions_claimed: { fish: false, plant: false, hunt: false },
      total_fish: 0,
      total_hunts: 0,
      total_plants: 0,
      created_at: Date.now(),
    };
    saveDB('users', db);
  }
  return db[userId];
}

function saveUser(userId, userData) {
  const db = loadDB('users');
  db[userId] = userData;
  saveDB('users', db);
}

function getAllUsers() {
  return loadDB('users');
}

module.exports = { loadDB, saveDB, getUser, saveUser, getAllUsers };
