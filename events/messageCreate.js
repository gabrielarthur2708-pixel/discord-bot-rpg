const AUTO_RESPONSES = [
  { triggers: ['oi', 'olá', 'oie', 'hello', 'ola'], response: 'Oi! Tudo certo 😄 e com você? Use `/ajuda` para ver os comandos!' },
  { triggers: ['tudo bem', 'tudo bom', 'como vai', 'como você está'], response: 'Tudo ótimo por aqui! 😊 Pronto para jogar?' },
  { triggers: ['bom dia'], response: 'Bom dia! ☀️ Que hoje seja incrível!' },
  { triggers: ['boa tarde'], response: 'Boa tarde! 🌤️ Vamos jogar um pouco?' },
  { triggers: ['boa noite'], response: 'Boa noite! 🌙 Hora de pescar, caçar ou apostar!' },
  { triggers: ['ajuda', 'help', 'comandos'], response: 'Use `/ajuda` para ver todos os comandos disponíveis! 📚' },
  { triggers: ['obrigado', 'valeu', 'thanks'], response: 'De nada! 😊 Sempre aqui para ajudar!' },
  { triggers: ['quanto vale', 'preço', 'custo'], response: 'Use `/loja` para ver os preços dos itens! 🛒' },
];

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;

    // Respond when mentioned
    if (message.mentions.has(client.user)) {
      const content = message.content.toLowerCase();
      
      for (const ar of AUTO_RESPONSES) {
        if (ar.triggers.some(t => content.includes(t))) {
          return message.reply({ content: ar.response });
        }
      }

      // Default response
      return message.reply({
        content: `👋 Oi, **${message.author.username}**! Me chame com \`/ajuda\` para ver todos os comandos disponíveis. Vamos jogar? 🎮`
      });
    }
  }
};
