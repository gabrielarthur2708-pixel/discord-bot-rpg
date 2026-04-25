const { getUser, saveUser } = require('./database');
const { addXP, rollFish, rollHunt, FARM_PLANTS, getCurrentSeason, formatTime } = require('./helpers');

// Full AI conversation system
async function getAIResponse(content, userId, client) {
  const lower = content.toLowerCase().trim();
  
  // Check for command creation request
  if (lower.includes('crie um comando') || lower.includes('criar comando') || lower.includes('cria um comando')) {
    return { type: 'create_command', text: content };
  }

  // Recipes
  if (lower.includes('receita') || lower.includes('como fazer') || lower.includes('como cozinhar')) {
    const recipes = [
      '🍳 **Omelete Simples:**\n2 ovos, sal, manteiga. Bata os ovos, aqueça a frigideira com manteiga, despeje e dobre ao meio. Pronto em 5 min!',
      '🍝 **Macarrão ao Alho e Óleo:**\nCozinhe o macarrão, refogue alho no azeite, misture tudo com sal e pimenta. Simples e delicioso!',
      '🥗 **Salada Caprese:**\nTomate, mussarela, manjericão, azeite e sal. Fácil, bonito e gostoso!',
      '🍰 **Bolo de Caneca:**\n4 colheres de farinha, 4 de açúcar, 2 de chocolate, 1 ovo, 3 de leite, 2 de óleo. Micro-ondas por 3 min!',
    ];
    return { type: 'text', text: recipes[Math.floor(Math.random() * recipes.length)] };
  }

  // Math
  const mathMatch = lower.match(/quanto é (\d+)\s*([+\-*/x×÷])\s*(\d+)/);
  if (mathMatch) {
    const a = parseFloat(mathMatch[1]), op = mathMatch[2], b = parseFloat(mathMatch[3]);
    let result;
    if (op === '+') result = a + b;
    else if (op === '-') result = a - b;
    else if (op === '*' || op === 'x' || op === '×') result = a * b;
    else if (op === '/' || op === '÷') result = b !== 0 ? a / b : 'impossível (divisão por zero)';
    return { type: 'text', text: `🧮 ${a} ${op} ${b} = **${result}**` };
  }

  // Questions about the bot
  if (lower.includes('quantos comandos') || lower.includes('o que você faz') || lower.includes('quais comandos')) {
    return { type: 'text', text: 'Tenho **24+ comandos**! 🎮 Use `/ajuda` para ver todos. Posso pescar, caçar, gerenciar fazenda, jogar cassino, fazer PvP, roubar, fazer Pix e muito mais!' };
  }

  // Jokes
  if (lower.includes('piada') || lower.includes('me faça rir') || lower.includes('conta uma piada')) {
    const jokes = [
      '😂 Por que o peixe não usa computador? Porque tem medo de pegar vírus!',
      '😂 O que o zero disse para o oito? Que cinto bonito!',
      '😂 Por que o jogador de futebol levou isqueiro pro jogo? Porque perdeu os fósforos!',
      '😂 Qual é o animal mais antigo? A zebra, porque é em preto e branco!',
    ];
    return { type: 'text', text: jokes[Math.floor(Math.random() * jokes.length)] };
  }

  // Curiosities
  if (lower.includes('curiosidade') || lower.includes('me conta algo') || lower.includes('sabia que')) {
    const facts = [
      '🌟 Sabia que os polvos têm 3 corações e sangue azul?',
      '🌟 A Torre Eiffel cresce 15 cm no verão por causa da dilatação térmica!',
      '🌟 Os flamingos são brancos, ficam rosa pela alimentação!',
      '🌟 Uma colher de chá de estrela de nêutrons pesaria 1 bilhão de toneladas!',
    ];
    return { type: 'text', text: facts[Math.floor(Math.random() * facts.length)] };
  }

  // Greetings
  if (['oi','olá','oie','hey','salve','eai','e aí'].some(t => lower.includes(t))) {
    const greets = ['Oi! 😊 Como posso te ajudar?', 'Eai! Tô aqui! 👋', 'Salve! 😄 O que você precisa?', 'Oi oi! Pronto pra jogar? 🎮'];
    return { type: 'text', text: greets[Math.floor(Math.random() * greets.length)] };
  }

  if (lower.includes('tudo bem') || lower.includes('como vai') || lower.includes('td bem')) {
    return { type: 'text', text: ['Tô ótimo! 😄 E você?', 'Tudo bem sim! Pronto pra uma aventura! 🗡️', 'Tô bem demais! Você? 😊'][Math.floor(Math.random() * 3)] };
  }

  if (lower.includes('obrigado') || lower.includes('valeu') || lower.includes('brigado')) {
    return { type: 'text', text: ['De nada! 😊', 'Imagina! Sempre aqui!', 'Por nada! 🤗'][Math.floor(Math.random() * 3)] };
  }

  // Compliments
  if (lower.includes('você é incrível') || lower.includes('te amo') || lower.includes('você é legal')) {
    return { type: 'text', text: ['Aww obrigado! ❤️ Você também é incrível!', 'Que fofo! 😊 Agora vai jogar haha', 'Haha obrigado! ❤️'][Math.floor(Math.random() * 3)] };
  }

  // Game help
  if (lower.includes('como ganhar') || lower.includes('dica') || lower.includes('como jogar')) {
    return { type: 'text', text: '💡 **Dicas para ganhar moedas:**\n🎣 Pesque regularmente\n🏹 Caçe a cada 30 min\n🌾 Plante e colha\n🎰 Aposte com cuidado\n🦹 Roube outros jogadores\n💸 Faça missões!' };
  }

  // Default smart responses
  const defaults = [
    `Hmm, interessante! Pode falar mais sobre isso? 😄`,
    `Não entendi muito bem, mas tô aqui! Use \`/ajuda\` se precisar de comandos 😊`,
    `Boa pergunta! Não sei responder isso ainda 😅 Mas posso ajudar com o jogo!`,
    `Haha que isso! Pode me perguntar sobre o jogo, receitas, piadas, curiosidades... 😄`,
    `Tô aqui! Me faz uma pergunta ou usa os comandos do jogo 🎮`,
  ];
  return { type: 'text', text: defaults[Math.floor(Math.random() * defaults.length)] };
}

async function runSlaveAction(client, userId, action) {
  const user = getUser(userId);
  const now = Date.now();
  try {
    if (action === 'pescar') {
      if (user.fish_last && now - user.fish_last < 30 * 60 * 1000) return null;
      const fish = rollFish(user.pet === 'dragon');
      const value = Math.floor(fish.value * (user.job === 'fisherman' ? 1.15 : 1));
      user.coins = (user.coins || 0) + value;
      user.fish_last = now;
      user.total_fish = (user.total_fish || 0) + 1;
      user.missions.fish = (user.missions.fish || 0) + 1;
      addXP(user, 15);
      saveUser(userId, user);
      return `🎣 Pesquei um **${fish.name}** ${fish.emoji} e vendi por **${value.toLocaleString('pt-BR')} moedas**! 💰 Saldo: ${user.coins.toLocaleString('pt-BR')}`;
    }
    if (action === 'cacar') {
      if (user.hunt_last && now - user.hunt_last < 30 * 60 * 1000) return null;
      const animal = rollHunt(user.pet === 'wolf', user.job === 'hunter');
      user.coins = (user.coins || 0) + animal.coins;
      user.hunt_last = now;
      user.total_hunts = (user.total_hunts || 0) + 1;
      addXP(user, 25);
      saveUser(userId, user);
      return `🏹 Caçei um **${animal.name}** ${animal.emoji} e ganhei **${animal.coins.toLocaleString('pt-BR')} moedas**! 💰 Saldo: ${user.coins.toLocaleString('pt-BR')}`;
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
        user.farm_plots.push({ name: plant.name, emoji: plant.emoji, coins: plant.coins, season: plant.season, time: plant.time, planted_at: now, ready_at: now + growTime });
        planted++;
      }
      if (earned > 0) user.coins = (user.coins || 0) + earned;
      addXP(user, planted * 10);
      saveUser(userId, user);
      if (earned > 0) return `🌾 Colhi e ganhei **${earned.toLocaleString('pt-BR')} moedas**! Plantei mais **${planted}** plantas 🌱 Saldo: ${user.coins.toLocaleString('pt-BR')}`;
      if (planted > 0) return `🌱 Plantei **${planted}** novas plantas! Aguardando crescer...`;
      return null;
    }
  } catch (err) { console.error('Slave error:', err); }
  return null;
}

module.exports = { getAIResponse, runSlaveAction };
