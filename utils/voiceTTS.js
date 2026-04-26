const https = require('https');
const {
  createAudioPlayer,
  createAudioResource,
  StreamType,
  getVoiceConnection,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  NoSubscriberBehavior,
  entersState,
} = require('@discordjs/voice');

const guildPlayers = new Map();

function log(...a) { console.log('[TTS]', ...a); }

function getOrCreatePlayer(guildId) {
  let entry = guildPlayers.get(guildId);
  if (entry) return entry;

  const player = createAudioPlayer({
    behaviors: { noSubscriber: NoSubscriberBehavior.Play },
  });
  entry = { player, queue: [], speaking: false };

  player.on('stateChange', (oldS, newS) => {
    log(`player ${oldS.status} -> ${newS.status}`);
    if (newS.status === AudioPlayerStatus.Idle) {
      entry.speaking = false;
      playNext(guildId);
    }
  });
  player.on('error', (err) => {
    log('player error:', err.message);
    entry.speaking = false;
    playNext(guildId);
  });

  guildPlayers.set(guildId, entry);
  return entry;
}

function fetchTTS(text) {
  const safe = text.slice(0, 200);
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(safe)}&tl=pt-BR&total=1&idx=0&textlen=${safe.length}&client=tw-ob`;
  log('fetching TTS:', safe.slice(0, 60), '...');
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/',
        'Accept': '*/*',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
    }, (res) => {
      log('TTS response status:', res.statusCode, 'content-type:', res.headers['content-type']);
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`TTS HTTP ${res.statusCode}`));
      }
      // Buffer the audio so the stream is reliable
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        log('TTS bytes received:', buf.length);
        if (buf.length < 100) return reject(new Error('TTS returned empty audio'));
        const { Readable } = require('stream');
        resolve(Readable.from(buf));
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(new Error('TTS timeout')); });
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
  if (!connection) { log('no connection, dropping queue'); entry.queue = []; return; }

  const text = entry.queue.shift();
  entry.speaking = true;

  try {
    log('connection status:', connection.state.status);
    if (connection.state.status !== VoiceConnectionStatus.Ready) {
      log('waiting for Ready...');
      await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
      log('connection Ready ✓');
    }

    const stream = await fetchTTS(text);
    const resource = createAudioResource(stream, {
      inputType: StreamType.Arbitrary,
      inlineVolume: false,
    });

    const sub = connection.subscribe(entry.player);
    log('subscribe result:', sub ? 'OK' : 'NULL');

    entry.player.play(resource);
    log('player.play() called');
  } catch (err) {
    log('playNext error:', err.message);
    entry.speaking = false;
    setTimeout(() => playNext(guildId), 1000);
  }
}

async function speak(guildId, text) {
  const connection = getVoiceConnection(guildId);
  if (!connection) throw new Error('Não estou em nenhuma call. Use `/call` primeiro!');

  const entry = getOrCreatePlayer(guildId);
  const chunks = splitText(text);
  entry.queue.push(...chunks);
  log(`queued ${chunks.length} chunk(s) for guild ${guildId}, queue size: ${entry.queue.length}`);
  playNext(guildId);
}

module.exports = { speak };
