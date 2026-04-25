const { EmbedBuilder } = require('discord.js');
const { getUser, saveUser } = require('../utils/database');
const { getAIResponse, runSlaveAction } = require('../utils/aiResponses');

const slaveIntervals = new Map();

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;

    if (message.mentions.has(client.user)) {
      const content = message.content.replace(`<@${client.user.id}>`, '').trim().toLowerCase();
      const user = getUser(message.author.id);

      // SLAVE MODE
      if (user.slave_mode) {
        if (content.includes('pare') || content.includes('para') || content.includes('stop') || content.includes('chega') || content.includes('pode parar')) {
          if (slaveIntervals.has(message.author.id)) {
            clearInterval(slaveIntervals.get(message.author.id));
            slaveIntervals.delete(message.author.id);
          }
          return message.reply({ embeds: [new EmbedBuilder().setColor('#95a5a6').setTitle('⏹️ Parei!').setDescription('Ok, parei tudo! Me chame quando precisar 😊')] });
        }

        const wantsFish = content.includes('pescar') || content.includes('pesca') || content.includes('peixe');
        const wantsHunt = content.includes('caçar') || content.includes('caca') || content.includes('caça');
        const wantsFarm = content.includes('plantar') || content.includes('fazenda') || content.includes('colher') || content.includes('planta');
        const wantsAll = content.includes('tudo');

        if (wantsFish || wantsHunt || wantsFarm || wantsAll) {
          let actions = [];
          if (wantsAll) actions = ['pescar', 'cacar', 'plantar'];
          else {
            if (wantsFish) actions.push('pescar');
            if (wantsHunt) actions.push('cacar');
            if (wantsFarm) actions.push('plantar');
          }

          await message.reply({ embeds: [new EmbedBuilder().setColor('#e74c3c').setTitle('🤖 Modo Automático Ativado!').setDescription(`Certo! Vou fazer **${actions.join(', ')}** automaticamente para você!\n\nPara parar é só me mencionar e dizer **"pare"** 😊`)] });

          if (slaveIntervals.has(message.author.id)) clearInterval(slaveIntervals.get(message.author.id));

          for (const action of actions) {
            const result = await runSlaveAction(client, message.author.id, action);
            if (result) { await message.channel.send(`<@${message.author.id}> ${result}`); await new Promise(r => setTimeout(r, 1000)); }
          }

          const interval = setInterval(async () => {
            try {
              const freshUser = getUser(message.author.id);
              if (!freshUser.slave_mode) { clearInterval(interval); slaveIntervals.delete(message.author.id); return; }
              for (const action of actions) {
                const result = await runSlaveAction(client, message.author.id, action);
                if (result) { await message.channel.send(`<@${message.author.id}> ${result}`); await new Promise(r => setTimeout(r, 1000)); }
              }
            } catch (err) { console.error('Slave interval error:', err); }
          }, 90000);

          slaveIntervals.set(message.author.id, interval);
          return;
        }
      }

      // AI RESPONSE
      await message.channel.sendTyping();
      await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));
      const response = getAIResponse(content);
      return message.reply(response);
    }
  }
};
