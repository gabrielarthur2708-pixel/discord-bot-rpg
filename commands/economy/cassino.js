const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, saveUser } = require('../../utils/database');
const { randomBetween } = require('../../utils/helpers');

const SLOT_SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣'];

function spinSlot() {
  return [0, 1, 2].map(() => SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]);
}

function getSlotMultiplier(reels) {
  if (reels[0] === reels[1] && reels[1] === reels[2]) {
    if (reels[0] === '💎') return 5;
    if (reels[0] === '7️⃣') return 4;
    if (reels[0] === '⭐') return 3;
    return 2;
  }
  if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) return 0.5;
  return 0;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cassino')
    .setDescription('🎰 Aposte no cassino!')
    .addSubcommand(s => s.setName('slot').setDescription('🎰 Jogar slot machine')
      .addIntegerOption(o => o.setName('aposta').setDescription('Valor da aposta').setRequired(true).setMinValue(50)))
    .addSubcommand(s => s.setName('moeda').setDescription('🪙 Cara ou coroa (2x)')
      .addIntegerOption(o => o.setName('aposta').setDescription('Valor da aposta').setRequired(true).setMinValue(50))
      .addStringOption(o => o.setName('escolha').setDescription('Cara ou coroa?').setRequired(true)
        .addChoices({ name: '👑 Cara', value: 'cara' }, { name: '🦅 Coroa', value: 'coroa' })))
    .addSubcommand(s => s.setName('roleta').setDescription('🎡 Roleta (até 5x)')
      .addIntegerOption(o => o.setName('aposta').setDescription('Valor da aposta').setRequired(true).setMinValue(50))
      .addStringOption(o => o.setName('aposta_tipo').setDescription('Tipo de aposta').setRequired(true)
        .addChoices(
          { name: '🔴 Vermelho (2x)', value: 'vermelho' },
          { name: '⚫ Preto (2x)', value: 'preto' },
          { name: '🟢 Verde (5x)', value: 'verde' },
          { name: '🔢 Par (2x)', value: 'par' },
          { name: '🔢 Ímpar (2x)', value: 'impar' }
        ))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const aposta = interaction.options.getInteger('aposta');
    const user = getUser(interaction.user.id);

    if (user.coins < aposta) {
      return interaction.reply({ content: `❌ Você não tem moedas suficientes! Saldo: **${user.coins.toLocaleString('pt-BR')}**`, ephemeral: true });
    }

    const isGambler = user.job === 'gambler';
    const bonusMult = isGambler ? 1.1 : 1;

    if (sub === 'slot') {
      const reels = spinSlot();
      const mult = getSlotMultiplier(reels) * bonusMult;
      const ganho = Math.floor(aposta * mult);
      user.coins -= aposta;
      user.coins += ganho;
      saveUser(interaction.user.id, user);

      const won = ganho > 0;
      const embed = new EmbedBuilder()
        .setColor(won ? '#f1c40f' : '#e74c3c')
        .setTitle('🎰 Slot Machine')
        .setDescription(`**${reels.join(' | ')}**\n\n${won ? `🎉 **Ganhou ${ganho.toLocaleString('pt-BR')} moedas!** (${mult}x)` : '😞 **Perdeu!**'}`)
        .addFields({ name: '💰 Aposta', value: `${aposta.toLocaleString('pt-BR')}`, inline: true }, { name: '💵 Saldo', value: `${user.coins.toLocaleString('pt-BR')}`, inline: true });

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'moeda') {
      const escolha = interaction.options.getString('escolha');
      const result = Math.random() < 0.5 ? 'cara' : 'coroa';
      const won = escolha === result;
      const ganho = won ? Math.floor(aposta * 2 * bonusMult) : 0;
      user.coins -= aposta;
      user.coins += ganho;
      saveUser(interaction.user.id, user);

      const resultEmoji = result === 'cara' ? '👑' : '🦅';
      const embed = new EmbedBuilder()
        .setColor(won ? '#f1c40f' : '#e74c3c')
        .setTitle('🪙 Cara ou Coroa')
        .setDescription(`Resultado: **${resultEmoji} ${result.toUpperCase()}**\n\n${won ? `🎉 **Ganhou ${ganho.toLocaleString('pt-BR')} moedas!**` : '😞 **Perdeu!**'}`)
        .addFields({ name: '💰 Aposta', value: `${aposta.toLocaleString('pt-BR')}`, inline: true }, { name: '💵 Saldo', value: `${user.coins.toLocaleString('pt-BR')}`, inline: true });

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'roleta') {
      const apostatipo = interaction.options.getString('aposta_tipo');
      const number = randomBetween(0, 36);
      const redNums = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
      const isRed = redNums.includes(number);
      const isBlack = number > 0 && !isRed;
      const isGreen = number === 0;
      const isEven = number > 0 && number % 2 === 0;
      const isOdd = number > 0 && number % 2 !== 0;

      let won = false;
      let mult = 0;
      if (apostatipo === 'vermelho' && isRed) { won = true; mult = 2; }
      else if (apostatipo === 'preto' && isBlack) { won = true; mult = 2; }
      else if (apostatipo === 'verde' && isGreen) { won = true; mult = 5; }
      else if (apostatipo === 'par' && isEven) { won = true; mult = 2; }
      else if (apostatipo === 'impar' && isOdd) { won = true; mult = 2; }

      const realMult = mult * bonusMult;
      const ganho = won ? Math.floor(aposta * realMult) : 0;
      user.coins -= aposta;
      user.coins += ganho;
      saveUser(interaction.user.id, user);

      const colorEmoji = isGreen ? '🟢' : isRed ? '🔴' : '⚫';
      const embed = new EmbedBuilder()
        .setColor(won ? '#f1c40f' : '#e74c3c')
        .setTitle('🎡 Roleta')
        .setDescription(`Bola caiu em: **${colorEmoji} ${number}**\n\n${won ? `🎉 **Ganhou ${ganho.toLocaleString('pt-BR')} moedas!** (${realMult}x)` : '😞 **Perdeu!**'}`)
        .addFields({ name: '💰 Aposta', value: `${aposta.toLocaleString('pt-BR')}`, inline: true }, { name: '💵 Saldo', value: `${user.coins.toLocaleString('pt-BR')}`, inline: true });

      return interaction.reply({ embeds: [embed] });
    }
  }
};
