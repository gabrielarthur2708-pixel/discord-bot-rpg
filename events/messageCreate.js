const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getUser, saveUser, loadDB, saveDB } = require('../utils/database');
const { getAIResponse, runSlaveAction } = require('../utils/aiResponses');

const slaveIntervals = new Map();

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    try {
    if (message.author.bot) return;

    if (!message.mentions.has(client.user)) return;
    
    const content = message.content
      .replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '')
      .trim();
    const lower = content.toLowerCase();
    const user = getUser(message.author.id);

    // ── SLAVE MODE ──
    if (user.slave_mode) {
      if (['pare', 'para', 'stop', 'chega', 'pode parar'].some(w => lower.includes(w))) {
        if (slaveIntervals.has(message.author.id)) {
          clearInterval(slaveIntervals.get(message.author.id));
          slaveIntervals.delete(message.author.id);
        }
        return message.reply({ embeds: [new EmbedBuilder().setColor('#95a5a6').setTitle('⏹️ Parei tudo!').setDescription('Ok! Parei todas as ações automáticas 😊')] });
      }

      const wantsFish = lower.includes('pescar') || lower.includes('pesc') || lower.includes('peixe');
      const wantsHunt = lower.includes('caçar') || lower.includes('caça') || lower.includes('caca');
      const wantsFarm = lower.includes('plantar') || lower.includes('fazenda') || lower.includes('colher');
      const wantsAll = lower.includes('tudo');

      if (wantsFish || wantsHunt || wantsFarm || wantsAll) {
        let actions = wantsAll ? ['pescar', 'cacar', 'plantar'] : [];
        if (!wantsAll) {
          if (wantsFish) actions.push('pescar');
          if (wantsHunt) actions.push('cacar');
          if (wantsFarm) actions.push('plantar');
        }

        await message.reply({ embeds: [new EmbedBuilder().setColor('#e74c3c').setTitle('🤖 Modo Automático Ativado!').setDescription(`Iniciando **${actions.join(', ')}** automaticamente!\n\nPara parar: mencione e diga **"pare"** 😊`)] });

        if (slaveIntervals.has(message.author.id)) clearInterval(slaveIntervals.get(message.author.id));

        // Run immediately
        for (const action of actions) {
          const result = await runSlaveAction(client, message.author.id, action);
          if (result) { await message.channel.send(`<@${message.author.id}> ${result}`); await new Promise(r => setTimeout(r, 1500)); }
        }

        // Loop every 2 minutes
        const interval = setInterval(async () => {
          try {
            const fresh = getUser(message.author.id);
            if (!fresh.slave_mode) { clearInterval(interval); slaveIntervals.delete(message.author.id); return; }
            for (const action of actions) {
              const result = await runSlaveAction(client, message.author.id, action);
              if (result) { await message.channel.send(`<@${message.author.id}> ${result}`); await new Promise(r => setTimeout(r, 1500)); }
            }
          } catch (err) { console.error('Slave interval:', err); }
        }, 2 * 60 * 1000);

        slaveIntervals.set(message.author.id, interval);
        return;
      }
    }

    // ── ADMIN AI CHAT ──
    const isAdmin = message.member?.permissions?.has(PermissionFlagsBits.Administrator);
    if (isAdmin && (lower.includes('o que tem no') || lower.includes('me fale sobre o código') || lower.includes('analise') || lower.includes('quantos arquivos') || lower.includes('conversar'))) {
      await message.channel.sendTyping();
      await new Promise(r => setTimeout(r, 1000));
      const { getAllUsers } = require('../utils/database');
      const users = Object.keys(getAllUsers()).length;
      return message.reply({ embeds: [new EmbedBuilder().setColor('#9b59b6').setTitle('🤖 Lúmen — Análise do Bot').setDescription(`Aqui está um resumo do meu sistema:\n\n📁 **Arquivos:** commands, events, handlers, utils\n👥 **Jogadores registrados:** ${users}\n🎮 **Comandos ativos:** 24+\n💾 **Banco de dados:** JSON local\n\nMe pergunte algo específico sobre o bot! 😄`)] });
    }

    // ── COMMAND CREATION VIA MENTION ──
    if (lower.includes('crie um comando') || lower.includes('criar comando') || lower.includes('cria um comando')) {
      if (!isAdmin) return message.reply('❌ Apenas administradores podem criar comandos!');
      
      await message.channel.sendTyping();
      await new Promise(r => setTimeout(r, 1500));
      
      return message.reply({ embeds: [new EmbedBuilder().setColor('#f39c12').setTitle('⚙️ Criar Comando').setDescription(`Para criar um comando personalizado, use:\n\n\`/adm [senha]\` → depois selecione a opção de criar comando!\n\nOu me descreva melhor o que o comando deve fazer e eu vejo o que posso fazer! 😄`)] });
    }

    // ── AI RESPONSE ──
    await message.channel.sendTyping();
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));

    const response = await getAIResponse(content, message.author.id, client);
    
    if (response && response.type === 'text') {
      return message.reply({ embeds: [new EmbedBuilder().setColor('#3498db').setDescription(response.text).setFooter({ text: 'Lúmen • Sempre aqui pra ajudar!' })] });
    }

    // Fallback: always reply something so the bot never seems mute
    return message.reply({ embeds: [new EmbedBuilder().setColor('#3498db').setDescription('Oi! 😊 Estou aqui! Use `/ajuda` para ver meus comandos.').setFooter({ text: 'Lúmen • Sempre aqui pra ajudar!' })] });
    } catch (err) {
      console.error('messageCreate error:', err);
      try {
        await message.reply({ content: '😅 Tive um probleminha pra processar isso. Tenta de novo?' });
      } catch {}
    }
  }
};
