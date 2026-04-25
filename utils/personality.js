const { getUser, saveUser, loadDB, saveDB } = require('../utils/database');

const PERSONALITY_RESPONSES = {
  greeting: {
    triggers: ['oi', 'olá', 'oie', 'ola', 'hey', 'hi', 'hello', 'eai', 'e aí', 'e ai', 'salve', 'fala', 'opa'],
    responses: [
      'Oi! Tudo certo por aqui 😊 e você?',
      'Eai! Que bom te ver! 👋',
      'Oi oi! Como posso te ajudar hoje?',
      'Salve! Tô aqui sim, pode falar 😄',
      'Ei! Tudo bem? Precisando de algo?',
      'Opa! Aqui estou 😄',
    ]
  },
  howAreYou: {
    triggers: ['tudo bem', 'tudo bom', 'como vai', 'como você está', 'como vc ta', 'td bem', 'td bom', 'tá bem', 'ta bem'],
    responses: [
      'Tô ótimo! Animado pra jogar 😄 e você?',
      'Tudo bem sim! Pronto pra uma aventura ⚔️',
      'Tô bem demais! E você, vai pescar hoje? 🎣',
      'Tranquilo por aqui! Você quer roubar alguém? 😏',
      'Bem bem! Me chama quando precisar 😂',
    ]
  },
  goodMorning: {
    triggers: ['bom dia'],
    responses: [
      'Bom dia! ☀️ Já pegou sua recompensa diária?',
      'Bom dia! Que hoje traga peixes raros 🐉',
      'Bom dia! ☀️ Vai plantar alguma coisa hoje?',
    ]
  },
  goodAfternoon: {
    triggers: ['boa tarde'],
    responses: [
      'Boa tarde! 🌤️ Perfeita pra uma caçada!',
      'Boa tarde! Já foi no cassino hoje? 🎰',
      'Boa tarde! Tô aqui, pode me chamar! 😄',
    ]
  },
  goodNight: {
    triggers: ['boa noite'],
    responses: [
      'Boa noite! 🌙 Última pescaria antes de dormir?',
      'Boa noite! 🌙 Já pegou a recompensa semanal?',
      'Boa noite! Que você sonhe com moedas 💰😄',
    ]
  },
  thanks: {
    triggers: ['obrigado', 'obrigada', 'valeu', 'vlw', 'thanks', 'brigado'],
    responses: [
      'De nada! 😊 Tô aqui sempre!',
      'Imagina! Qualquer coisa é só chamar 👋',
      'Por nada! Boa sorte nas aventuras! ⚔️',
      'Sempre disponível! 😄',
    ]
  },
  help: {
    triggers: ['ajuda', 'help', 'comandos', 'o que você faz', 'como funciona'],
    responses: [
      'Claro! Use `/ajuda` pra ver tudo que faço 📚',
      'Tem bastante coisa! Veja com `/ajuda` 😄',
      'Olha o `/ajuda` que tem tudo listado! 🎮',
    ]
  },
  rich: {
    triggers: ['sou rico', 'tô rico', 'muito dinheiro', 'cheio de grana'],
    responses: [
      'Cuidado que alguém pode te roubar 😏',
      'Rico assim? Vai no cassino arriscar! 🎰',
      'Mostra o `/perfil` então! 😄',
    ]
  },
  poor: {
    triggers: ['tô pobre', 'sem dinheiro', 'preciso de grana', 'me dá dinheiro', 'tô liso'],
    responses: [
      'Vai pescar! Dá pra ganhar bastante 🎣',
      'Tenta a sorte no cassino... ou rouba alguém 😏',
      'Pega sua `/recompensa diaria`! São 1000 moedas grátis 💰',
      'Caça um dragão, vale 15 mil moedas! 🐲',
    ]
  },
  rob: {
    triggers: ['vou te roubar', 'posso te roubar', 'roubar você'],
    responses: [
      'Pode tentar... mas não vai conseguir 😂',
      'Haha boa sorte! Eu não tenho moedas pra roubar 😄',
      'Eu sou um bot, não tenho carteira! 😂',
    ]
  },
  love: {
    triggers: ['te amo', 'gosto de você', 'você é incrível', 'você é ótimo', 'vc é bom'],
    responses: [
      'Que fofo! 😊 Boa sorte nas aventuras!',
      'Obrigado! Você também é especial 😄',
      'Ahh que legal! Vai lá pescar pra mim então 🎣😂',
    ]
  },
  insult: {
    triggers: ['você é ruim', 'bot inútil', 'vc é horrível', 'odeio você'],
    responses: [
      'Caramba... isso doeu 😅 mas tô aqui pra ajudar!',
      'Tá tudo bem? 😄 Me diz o que posso melhorar!',
      'Tá bom né... vou ignorar isso 😂',
    ]
  },
  play: {
    triggers: ['vamos jogar', 'bora jogar', 'quero jogar', 'jogar'],
    responses: [
      'Bora! Use `/ajuda` e escolhe o que quer fazer! 🎮',
      'Sim! Pesca, caça, planta ou rouba? Me diz! 😄',
      'Que jogo? Cassino 🎰 PvP ⚔️ ou Fazenda 🌾?',
    ]
  },
  bot: {
    triggers: ['você é um bot', 'vc é bot', 'é uma ia', 'é robô', 'é inteligência artificial'],
    responses: [
      'Bot? Que bot? Sou o Lúmen, tô aqui pra jogar! 😄',
      'Haha que nada! Sou o guardião desse servidor 😎',
      'Inteligência artificial? Sou só o Lúmen, seu parceiro! 😄',
      'Não sei do que você tá falando... bora jogar? 😂',
    ]
  },
};

function getSmartResponse(message, username) {
  const content = message.toLowerCase();

  // Check all categories
  for (const [category, data] of Object.entries(PERSONALITY_RESPONSES)) {
    if (data.triggers.some(t => content.includes(t))) {
      const responses = data.responses;
      return responses[Math.floor(Math.random() * responses.length)];
    }
  }

  // Context-aware fallbacks
  if (content.includes('?')) {
    const questions = [
      `Boa pergunta, ${username}! Não sei ao certo, mas posso ajudar com os comandos do servidor 😄`,
      `Hmm... difícil essa. Tenta usar \`/ajuda\` talvez? 😅`,
      `Não tenho certeza sobre isso, mas tô aqui se precisar de outra coisa! 😊`,
    ];
    return questions[Math.floor(Math.random() * questions.length)];
  }

  // Default responses
  const defaults = [
    `Oi ${username}! Me chama se precisar de algo 😄`,
    `Tô aqui! Diz o que precisa 👋`,
    `Pode falar! Tô ligado em tudo por aqui 😎`,
    `${username}! Use \`/ajuda\` pra ver tudo que posso fazer 🎮`,
    `Opa! Qualquer coisa é só falar 😊`,
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
}

module.exports = { getSmartResponse };
