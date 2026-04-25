const { getUser, saveUser } = require('../utils/database');
const { addXP, rollFish, rollHunt, FARM_PLANTS, getCurrentSeason, formatTime } = require('../utils/helpers');

const RESPONSES = {
  greeting: {
    triggers: ['oi', 'olá', 'oie', 'ola', 'hey', 'hi', 'hello', 'eai', 'e aí', 'e ai', 'salve', 'fala', 'boa'],
    responses: ['Oi! Tudo certo por aqui 😊 e você?', 'Eai! Que bom te ver por aqui 👋', 'Salve! Tô aqui sim, pode falar 😄', 'Ei! Tudo bem? Precisando de algo?']
  },
  howAreYou: {
    triggers: ['tudo bem', 'tudo bom', 'como vai', 'como você está', 'td bem', 'td bom', 'como vc ta'],
    responses: ['Tô ótimo! Animado pra jogar 😄 e você?', 'Tudo bem sim! Pronto pra uma aventura 🗡️', 'Tô bem demais! Pescando uns peixes aqui 🎣', 'Tô tranquilo! Você quer roubar alguém? 😏']
  },
  goodMorning: { triggers: ['bom dia'], responses: ['Bom dia! ☀️ Já pegou sua recompensa diária hoje?', 'Bom dia! Que hoje seja cheio de peixes raros 🐉', 'Bom dia! ☀️ Vai plantar alguma coisa hoje?'] },
  goodAfternoon: { triggers: ['boa tarde'], responses: ['Boa tarde! 🌤️ Perfeita pra uma caçada!', 'Boa tarde! Já foi no cassino hoje? 🎰', 'Boa tarde! 🌤️ Tô aqui, pode me chamar!'] },
  goodNight: { triggers: ['boa noite'], responses: ['Boa noite! 🌙 Última pescaria antes de dormir?', 'Boa noite! 🌙 Já pegou a recompensa semanal?', 'Boa noite! Que você sonhe com moedas 💰😄'] },
  thanks: { triggers: ['obrigado', 'obrigada', 'valeu', 'vlw', 'thanks', 'brigado'], responses: ['De nada! 😊 Tô aqui sempre!', 'Imagina! Qualquer coisa é só chamar 👋', 'Por nada! Boa sorte nas aventuras! 🗡️'] },
  help: { triggers: ['ajuda', 'help', 'comandos', 'o que você faz', 'como funciona'], responses: ['Claro! Use `/ajuda` pra ver todos os comandos 📚', 'Tem bastante coisa! Dá uma olhada no `/ajuda` 😄'] },
  money: { triggers: ['dinheiro', 'moedas', 'rico', 'pobre', 'quanto tenho', 'meu saldo'], responses: ['Use `/perfil` pra ver seu saldo! 💰', 'Vai pescar, caçar ou plantar pra ganhar moedas! 🎣', 'Quer ficar rico? Tente a sorte no `/cassino`! 🎰'] },
  fish: { triggers: ['pescar', 'pesca', 'peixe', 'vara'], responses: ['Use `/pescar` e tente sua sorte! 🎣', 'Tem peixe Deus que vale 10k moedas! 🐟✨', 'Pesca é vida! Use `/pescar` agora! 🎣'] },
  hunt: { triggers: ['caçar', 'caça', 'caçada', 'floresta'], responses: ['Use `/cacar` pra entrar na floresta! 🏹', 'Se der sorte você pega um Dragão que vale 15k! 🐲', 'A floresta te espera! Use `/cacar`! 🌲'] },
  rob: { triggers: ['roubar', 'roubo', 'ladrão', 'ladrao', 'furtar'], responses: ['Use `/roubar @usuario` pra tentar a sorte! 🦹', 'Cuidado pra não ir pra cadeia! 🚔😂', 'Tem 4 métodos de roubo, do mais fácil ao épico! 💎'] },
  casino: { triggers: ['cassino', 'apostar', 'slot', 'roleta', 'moeda', 'jogo'], responses: ['Use `/cassino slot`, `/cassino moeda` ou `/cassino roleta`! 🎰', 'O slot pode dar 5x! Tente a sorte! 🍒', 'Apostador viciado né? 😂 Use `/cassino`!'] },
  farm: { triggers: ['fazenda', 'plantar', 'colher', 'planta', 'semente'], responses: ['Use `/fazenda plantar` pra começar! 🌱', 'Lembra que as plantas apodrecem em 5 minutos após ficar prontas! ⚠️', 'Na estação certa as plantas valem 30% a mais! 🌸'] },
  pvp: { triggers: ['pvp', 'batalha', 'lutar', 'duelo', 'desafio'], responses: ['Use `/pvp @usuario` pra desafiar alguém! ⚔️', 'Quem tem mais aura tem vantagem no PvP! ✨', 'Ganhe 2000 moedas e +50 aura na vitória! 🏆'] },
  pet: { triggers: ['pet', 'animal', 'bichinho', 'gato', 'cachorro', 'dragão'], responses: ['Use `/loja pets` pra ver os pets disponíveis! 🐾', 'O Dragão é o pet mais raro e dá bônus de raridade! 🐲', 'O pet Fênix protege sua aura 1x por dia! 🔥'] },
  level: { triggers: ['nivel', 'nível', 'xp', 'experiência', 'exp'], responses: ['Use `/nivel` pra ver seu XP e progresso! ⭐', 'Você ganha XP pescando, caçando, roubando e muito mais!', 'A cada nível você ganha bônus e moedas extras! 🎁'] },
  love: { triggers: ['te amo', 'gosto de você', 'você é incrível', 'você é legal'], responses: ['Aww 😊 obrigado! Você também é incrível!', 'Que fofo! 😄 Agora vai jogar haha', 'Haha obrigado! ❤️'] },
  insult: { triggers: ['idiota', 'burro', 'lixo', 'inútil', 'horrível'], responses: ['Ei, sem grosseria! 😅', 'Fui eu que ofendi você? rsrs 😂', 'Calma! Tô só tentando ajudar 😊'] },
  bored: { triggers: ['tédio', 'entediado', 'chato', 'sem graça', 'enjoado'], responses: ['Vai pescar! Nunca fica chato 🎣', 'Desafie alguém pra um PvP! ⚔️', 'Tenta o cassino! Adrenalina garantida 🎰'] },
};

function getAIResponse(message) {
  const content = message.toLowerCase().trim();
  for (const [key, data] of Object.entries(RESPONSES)) {
    if (data.triggers.some(t => content.includes(t))) {
      return data.responses[Math.floor(Math.random() * data.responses.length)];
    }
  }
  // Smart fallback responses
  const fallbacks = [
    `Hmm, não entendi muito bem 😅 Mas tô aqui! Precisa de algo específico?`,
    `Pode falar melhor? 😄 Ou use \`/ajuda\` pra ver o que posso fazer!`,
    `Interessante isso que você disse! Mas não sei exatamente como responder 😂`,
    `Boa pergunta! Só que não sei responder isso ainda 😅`,
    `Tô aqui! Pode usar os comandos ou me falar o que precisa 😊`,
    `Não entendi, mas tô disponível! Use \`/ajuda\` pra ver tudo que faço 😄`,
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

// Auto farm/fish/hunt/rob for slave mode
async function runSlaveAction(client, userId, action) {
  const user = getUser(userId);
  const now = Date.now();
  
  try {
    if (action === 'pescar') {
      if (user.fish_last && now - user.fish_last < 30000) return null;
      const fish = rollFish(user.pet === 'dragon');
      const value = Math.floor(fish.value * (user.job === 'fisherman' ? 1.2 : 1));
      user.coins = (user.coins || 0) + value;
      user.fish_last = now;
      user.total_fish = (user.total_fish || 0) + 1;
      user.missions.fish = (user.missions.fish || 0) + 1;
      addXP(user, 20);
      saveUser(userId, user);
      return `🎣 Pesquei um **${fish.name}** ${fish.emoji} e vendi por **${value.toLocaleString('pt-BR')} moedas**! Total: ${user.coins.toLocaleString('pt-BR')} 💰`;
    }
    
    if (action === 'cacar') {
      if (user.hunt_last && now - user.hunt_last < 60000) return null;
      const animal = rollHunt(user.pet === 'wolf', user.job === 'hunter');
      user.coins = (user.coins || 0) + animal.coins;
      user.hunt_last = now;
      user.total_hunts = (user.total_hunts || 0) + 1;
      addXP(user, 30);
      saveUser(userId, user);
      return `🏹 Caçei um **${animal.name}** ${animal.emoji} e ganhei **${animal.coins.toLocaleString('pt-BR')} moedas**! Total: ${user.coins.toLocaleString('pt-BR')} 💰`;
    }
    
    if (action === 'plantar') {
      user.farm_plots = user.farm_plots || [];
      const now2 = Date.now();
      // Collect ready plants first
      let earned = 0;
      const season = getCurrentSeason();
      user.farm_plots = user.farm_plots.filter(p => {
        if (now2 >= p.ready_at && now2 <= p.ready_at + 5 * 60 * 1000) {
          let coins = p.coins;
          if (p.season === season) coins = Math.floor(coins * 1.3);
          if (user.job === 'farmer') coins = Math.floor(coins * 1.25);
          earned += coins;
          return false;
        }
        if (now2 > p.ready_at + 5 * 60 * 1000) return false;
        return true;
      });
      // Plant new ones
      let planted = 0;
      while (user.farm_plots.length < 5) {
        const season = getCurrentSeason();
        const seasonPlants = FARM_PLANTS.filter(p => p.season === season);
        const plant = seasonPlants[Math.floor(Math.random() * seasonPlants.length)] || FARM_PLANTS[0];
        let growTime = plant.time;
        if (user.pet === 'cow') growTime = Math.floor(growTime * 0.8);
        user.farm_plots.push({ name: plant.name, emoji: plant.emoji, coins: plant.coins, season: plant.season, planted_at: now2, ready_at: now2 + growTime });
        planted++;
      }
      if (earned > 0) user.coins = (user.coins || 0) + earned;
      addXP(user, planted * 15);
      saveUser(userId, user);
      if (earned > 0) return `🌾 Colhi plantas e ganhei **${earned.toLocaleString('pt-BR')} moedas**! Plantei mais ${planted} plantas 🌱 Total: ${user.coins.toLocaleString('pt-BR')} 💰`;
      if (planted > 0) return `🌱 Plantei **${planted}** novas plantas! Aguardando crescer... 🌿`;
      return null;
    }
  } catch (err) {
    console.error('Slave action error:', err);
  }
  return null;
}

module.exports = { getAIResponse, runSlaveAction };
