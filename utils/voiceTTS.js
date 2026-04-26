const https = require('https');
const { createAudioPlayer, createAudioResource, StreamType, getVoiceConnection, AudioPlayerStatus, NoSubscriberBehavior } = require('@discordjs/voice');

// One audio player per guild, with a queue
const guildPlayers = new Map(); // guildId -> { player, queue: [text...] }

function getOrCreatePlayer(guildId) {
  let entry = guildPlayers.get(guildId);
  if (entry) return entry;

  const player = createAudioPlayer({
    behaviors: { noSubscriber: NoSubscriberBehavior.Pause },
  });
  entry = { player, queue: [], speaking: false };

  player.on(AudioPlayerStatus.Idle, () => {
    entry.speaking = false;
    playNext(guildId);
  });
  player.on('error', (err) => {
    console.error('AudioPlayer error:', err.message);
    entry.speaking = false;
    playNext(guildId);
  });

  guildPlayers.set(guildId, entry);
  return entry;
}

function fetchTTS(text) {
  // Google Translate TTS: max ~200 chars per request
  const safe = text.slice(0, 200);
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(safe)}&tl=pt-BR&client=tw-ob`;
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux) Chrome/120',
        'Referer': 'https://translate.google.com/',
      },
    }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`TTS HTTP ${res.statusCode}`));
      }
      resolve(res);
    }).on('error', reject);
  });
}

function splitText(text, max = 180) {
  const out = [];
  let remaining = text.trim();
  while (remaining.length > 0) {
    if (remaining.length <= max) { out.push(remaining); break; }
    let cut = remaining.lastIndexOf(' ', max);
    if (cut < 50) cut = max;
    out.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }
  return out;
}

async function playNext(guildId) {
  const entry = guildPlayers.get(guildId);
  if (!entry || entry.speaking || entry.queue.length === 0) return;

  const connection = getVoiceConnection(guildId);
  if (!connection) { entry.queue = []; return; }

  const text = entry.queue.shift();
  entry.speaking = true;

  try {
    const stream = await fetchTTS(text);
    const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });
    connection.subscribe(entry.player);
    entry.player.play(resource);
  } catch (err) {
    console.error('TTS play error:', err.message);
    entry.speaking = false;
    setTimeout(() => playNext(guildId), 500);
  }
}

async function speak(guildId, text) {
  const connection = getVoiceConnection(guildId);
  if (!connection) throw new Error('Não estou em nenhuma call. Use `/call` primeiro!');

  const entry = getOrCreatePlayer(guildId);
  const chunks = splitText(text);
  entry.queue.push(...chunks);
  playNext(guildId);
}

module.exports = { speak };
