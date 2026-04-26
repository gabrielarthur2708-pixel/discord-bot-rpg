const { EmbedBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const { getUser, saveUser } = require('../utils/database');
const { runSlaveAction } = require('../utils/aiResponses');
const { speak } = require('../utils/voiceTTS');

const slaveTimers = new Map(); // userId -> { action: timeoutId }
const slaveChannels = new Map(); // userId -> channel
const slaveActions = new Map(); // userId -> actions[]

function stopSlave(userId) {
  const timers = slaveTimers.get(userId) || {};
  for (const t of Object.values(timers)) clearTimeout(t);
  slaveTimers.delete(userId);
  slaveChannels.delete(userId);
  slaveActions.delete(userId);
}

function isRunning(userId) {
  return slaveTimers.has(userId);
}

async function loopAction(client, userId, action) {
  // Check if still active
  const user = getUser(userId);
  if (!user.slave_mode || !isRunning(userId)) return;

  const channel = slaveChannels.get(userId);
  const mention = `<@${userId}>`;

  try {
    const result = await runSlaveAction(client, userId, action);
    
    if (result && !result.skipped && result.text && channel) {
      await channel.send(`${mention} ${result.text}`);
    }

    // Schedule next run after cooldown
    const waitMs = (result && result.waitMs) ? result.waitMs : 30 * 60 * 1000;
    
    // Check still running before scheduling
    if (!getUser(userId).slave_mode || !isRunning(userId)) return;

    const timer = setTimeout(() => loopAction(client, userId, action), waitMs);
    const existing = slaveTimers.get(userId) || {};
    existing[action] = timer;
    slaveTimers.set(userId, existing);

  } catch (err) {
    console.error(`Slave loop error (${action}):`, err);
    // Retry in 5 min on error
    const timer = setTimeout(() => loopAction(client, userId, action), 5 * 60 * 1000);
    const existing = slaveTimers.get(userId) || {};
    existing[action] = timer;
    slaveTimers.set(userId, existing);
  }
}

async function startSlave(client, userId, actions, channel) {
  // Stop any existing slave first
  stopSlave(userId);

  // Save channel and actions
  slaveChannels.set(userId, channel);
  slaveActions.set(userId, actions);
  slaveTimers.set(userId, {});

  // Start all actions
  for (const action of actions) {
    loopAction(client, userId, action);
    await new Promise(r => setTimeout(r, 500));
  }
}

// AI brain
function brain(content) {
  const l = content.toLowerCase().trim();

  if (l.includes('receita') || l.includes('como fazer') || l.includes('o que comer') || l.includes('como cozinhar')) {
    const r = [
      '🍳 **Omelete Simples:** 2 ovos + sal + manteiga. Bata, frite e dobre. 5 minutinhos!',
      '🍝 **Macarrão ao Alho:** Cozinhe o macarrão, refogue alho no azeite e misture. Delicioso!',
      '🍰 **Bolo de Caneca:** 4c farinha + 4c açúcar + 2c chocolate + 1 ovo + 3c leite. Micro-ondas 3min!',
      '🍔 **Hambúrguer Caseiro:** Carne moída + sal + pimenta, grelhe 3min cada lado no pão!',
      '🥗 **Salada Caprese:** Tomate + mozzarela + manjericão + azeite + sal. Rápido e gostoso!'
    ];
    return r[Math.floor(Math.random()*r.length)];
  }

  if (l.includes('piada') || l.includes('me faça rir') || l.includes('engraçado') || l.includes('conta uma')) {
    const j = [
      '😂 Por que o peixe não usa computador? Porque tem medo de pegar vírus!',
      '😂 O que o zero disse pro oito? Que cinto bonito!',
      '😂 Por que a galinha não joga futebol? Porque bota fora!',
      '😂 Qual animal tem mais dinheiro? O porco — sempre tem um cofrinho!',
      '😂 Por que o livro foi ao médico? Estava com muitas dores de cabeça nos leitores!'
    ];
    return j[Math.floor(Math.random()*j.length)];
  }

  if (l.includes('curiosidade') || l.includes('sabia que') || l.includes('me conta') || l.includes('fato')) {
    const f = [
      '🌟 Polvos têm 3 corações e sangue azul!',
      '🌟 A Torre Eiffel cresce 15cm no verão por causa do calor!',
      '🌟 Flamingos nascem brancos — ficam rosa pela alimentação!',
      '🌟 Abelhas visitam até 1.500 flores para fazer uma colher de mel!',
      '🌟 Golfinhos dormem com um olho aberto!'
    ];
    return f[Math.floor(Math.random()*f.length)];
  }

  if (l.includes('dica') || l.includes('como ganhar') || l.includes('como jogar') || l.includes('me ajuda com o jogo')) {
    return '💡 **Dicas para ganhar moedas rápido:**\n🎣 Pesque a cada 30min\n🏹 Caçe a cada 30min\n🌾 Plante e colha sempre\n🎁 Use `/recompensa diaria` todo dia\n🦹 Roube outros jogadores com `/roubar`\n🎰 Aposte no `/cassino`!';
  }

  const math = l.match(/quanto[  ]?[eé][  ]?(\d+)\s*([+\-*/x])\s*(\d+)/);
  if (math) {
    const a=+math[1], op=math[2], b=+math[3];
    const r = op==='+'?a+b:op==='-'?a-b:op==='*'||op==='x'?a*b:b?+(a/b).toFixed(2):null;
    if(r!==null) return `🧮 **${a} ${op} ${b} = ${r}**`;
  }

  if (l.includes('que horas') || l.includes('que dia') || l.includes('data de hoje') || l.includes('hora')) {
    return `🕐 Agora são: **${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}**`;
  }

  if (['oi','olá','oie','hey','salve','eai','e aí','boa','falae','opa'].some(w=>l.includes(w))) {
    return ['Oi! 😊 Como posso te ajudar?','Eai! 👋 O que você precisa?','Salve! 😄 Pronto pra jogar?','Oi oi! 🎮 Me fala o que você quer!'][Math.floor(Math.random()*4)];
  }
  if (l.includes('tudo bem')||l.includes('como vai')||l.includes('td bem')||l.includes('como vc ta')) {
    return ['Tô ótimo! 😄 E você?','Tudo bem sim! Pronto pra uma aventura! 🗡️','Tô bem demais! Esperando você jogar 🎮'][Math.floor(Math.random()*3)];
  }
  if (l.includes('obrigado')||l.includes('valeu')||l.includes('brigado')||l.includes('vlw')) {
    return ['De nada! 😊','Imagina! Sempre aqui! 👋','Por nada! 🤗'][Math.floor(Math.random()*3)];
  }
  if (l.includes('bom dia')) return 'Bom dia! ☀️ Já pegou sua recompensa? Use `/recompensa diaria`!';
  if (l.includes('boa tarde')) return 'Boa tarde! 🌤️ Bora `/cacar` um pouquinho?';
  if (l.includes('boa noite')) return 'Boa noite! 🌙 Última pesca antes de dormir? Use `/pescar`!';
  if (l.includes('te amo')||l.includes('vc é incrível')||l.includes('você é incrível')) return 'Aww, obrigado! ❤️ Você também é incrível! Agora vai jogar haha 😄';
  if (l.includes('quem é você')||l.includes('o que você é')||l.includes('você é um bot')) return 'Sou o Lúmen! 😄 Tô aqui pra animar o servidor e te ajudar a jogar. Me mencione sempre que precisar!';
  if (l.includes('quantos comandos')||l.includes('o que você faz')) return 'Tenho **20+ comandos**! 🎮 Use `/ajuda` para ver todos. Posso pescar, caçar, plantar, jogar cassino, fazer PvP, roubar e muito mais!';

  return ['Hmm, não entendi muito bem! 😅 Pode falar de outro jeito?','Não sei responder isso exatamente, mas tô aqui! 😊','Me pergunta outra coisa! 😄 Sei sobre receitas, piadas, curiosidades e o jogo!','Boa pergunta! Mas essa eu não sei 😂 Tenta de novo?'][Math.floor(Math.random()*4)];
}

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    try {
    if (message.author.bot) return;

    const rawLower = message.content.toLowerCase().trim();
    const startsWithName = /^(l[uú]men)\b[\s,!?:;-]*/i.test(message.content.trim());
    const mentioned = message.mentions.has(client.user);
    if (!mentioned && !startsWithName) return;

    const content = message.content
      .replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '')
      .replace(/^(l[uú]men)\b[\s,!?:;-]*/i, '')
      .trim();
    const l = content.toLowerCase();
    const user = getUser(message.author.id);
    const mention = `<@${message.author.id}>`;

    // ── STOP ──
    if (['pare','para','stop','chega','cancela','pode parar','desativa'].some(w => l.includes(w))) {
      stopSlave(message.author.id);
      user.slave_mode = false;
      saveUser(message.author.id, user);
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#95a5a6')
          .setTitle('⏹️ Parei tudo!')
          .setDescription('Ok! Parei todas as ações automáticas 😊\nPode me chamar quando quiser recomeçar!')
          .setFooter({ text: 'Lúmen • Modo Automático' })
        ]
      });
    }

    // ── SLAVE MODE ──
    if (user.slave_mode) {
      const wantsFish = l.includes('pescar')||l.includes('pesca')||l.includes('peixe');
      const wantsHunt = l.includes('caçar')||l.includes('caça')||l.includes('caca');
      const wantsFarm = l.includes('plantar')||l.includes('fazenda')||l.includes('colher');
      const wantsAll = l.includes('tudo')||l.includes('faz tudo')||l.includes('tudo pra')||l.includes('farme')||l.includes('trabalha')||l.includes('ganhar')||l.includes('farm');
      const wantsAnything = wantsFish||wantsHunt||wantsFarm||wantsAll||l.includes('faz')||l.includes('faça')||l.includes('pra mim')||l.includes('para mim');

      if (wantsAnything) {
        // Already running? Just tell the user
        if (isRunning(message.author.id)) {
          const currentActions = slaveActions.get(message.author.id) || [];
          return message.reply({
            embeds: [new EmbedBuilder()
              .setColor('#f39c12')
              .setTitle('🤖 Já estou no automático!')
              .setDescription(`Já estou fazendo **${currentActions.join(', ')}** automaticamente para você!\n\nEu te aviso no chat sempre que fizer algo 😄\n\n🛑 Para parar: mencione e diga **"pare"**`)
              .setFooter({ text: 'Lúmen • Modo Automático' })
            ]
          });
        }

        // Start new slave
        let actions = [];
        if (wantsAll) actions = ['pescar','cacar','plantar'];
        else {
          if (wantsFish) actions.push('pescar');
          if (wantsHunt) actions.push('cacar');
          if (wantsFarm) actions.push('plantar');
          if (actions.length === 0) actions = ['pescar','cacar','plantar'];
        }

        await message.reply({
          embeds: [new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('🤖 Modo Automático Ativado!')
            .setDescription(`Certo! Vou fazer **${actions.join(', ')}** pra você automaticamente!\n\n⚡ Começo agora e repito sempre que o cooldown acabar!\n📢 Te aviso no chat toda vez que fizer algo!\n\n🛑 Para parar: mencione e diga **"pare"**`)
            .setFooter({ text: 'Lúmen • Modo Automático' })
          ]
        });

        await startSlave(client, message.author.id, actions, message.channel);
        return;
      }
    }

    // ── AI RESPONSE ──
    await message.channel.sendTyping();
    await new Promise(r => setTimeout(r, 600 + Math.random() * 800));
    const response = brain(content);

    // Stripped version for TTS (no markdown / emojis)
    const ttsText = response
      .replace(/[*_`>~|#]/g, '')
      .replace(/\p{Extended_Pictographic}/gu, '')
      .replace(/\s+/g, ' ')
      .trim();

    // If she's in a voice call in this guild, speak the response too
    if (message.guild) {
      const conn = getVoiceConnection(message.guild.id);
      if (conn && ttsText) {
        speak(message.guild.id, ttsText).catch(err => console.error('TTS reply error:', err.message));
      }
    }

    return message.reply({
      embeds: [new EmbedBuilder()
        .setColor('#3498db')
        .setDescription(response)
        .setFooter({ text: 'Lúmen • IA' })
      ]
    });
    } catch (err) {
      console.error('messageCreate error:', err);
      try {
        await message.reply({ content: '😅 Tive um probleminha pra processar isso. Tenta de novo?' });
      } catch {}
    }
  }
};
