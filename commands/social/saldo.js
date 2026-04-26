const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, getAllUsers } = require('../../utils/database');
const { xpForLevel, PETS, JOBS } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder().setName('saldo').setDescription('💰 Veja seu saldo completo!')
    .addUserOption(o => o.setName('usuario').setDescription('Ver saldo de outro jogador').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario') || interaction.user;
    const user = getUser(target.id);
    const allUsers = getAllUsers();
    const rankCoins = Object.entries(allUsers).sort((a,b)=>(b[1].coins||0)-(a[1].coins||0)).findIndex(([id])=>id===target.id)+1;
    const rankAura = Object.entries(allUsers).sort((a,b)=>(b[1].aura||0)-(a[1].aura||0)).findIndex(([id])=>id===target.id)+1;

    const level = user.level || 1;
    const xp = user.xp || 0;
    const xpNeeded = xpForLevel(level);
    const prog = Math.floor((xp/xpNeeded)*10);
    const bar = '█'.repeat(prog)+'░'.repeat(10-prog);

    const pet = PETS.find(p=>p.id===user.pet);
    const job = JOBS.find(j=>j.id===user.job);

    // Aura title
    const aura = user.aura || 0;
    let titulo = aura>=10000?'👑 Deus':aura>=5000?'💎 Lenda':aura>=2000?'🔥 Mestre':aura>=1000?'⚡ Guerreiro':aura>=500?'🌟 Aventureiro':aura>=100?'🌱 Iniciante':'🌿 Novato';

    const embed = new EmbedBuilder()
      .setColor('#f1c40f')
      .setTitle(`💰 Saldo de ${target.username}`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: '👜 Carteira', value: `${(user.coins||0).toLocaleString('pt-BR')} 🪙`, inline: true },
        { name: '✨ Aura', value: `${aura.toLocaleString('pt-BR')} ✨`, inline: true },
        { name: '👑 Título', value: titulo, inline: true },
        { name: '🏆 Ranking Moedas', value: `#${rankCoins}`, inline: true },
        { name: '🏆 Ranking Aura', value: `#${rankAura}`, inline: true },
        { name: '⭐ Nível', value: `${level}`, inline: true },
        { name: `📊 XP (${xp}/${xpNeeded})`, value: `\`${bar}\` ${Math.floor(xp/xpNeeded*100)}%`, inline: false },
        { name: '🐾 Pet', value: pet ? `${pet.emoji} ${pet.name}` : '❌ Sem pet', inline: true },
        { name: '💼 Trabalho', value: job ? `${job.emoji} ${job.name}` : '❌ Sem trabalho', inline: true },
        { name: '🎯 Missões', value: `🎣 ${user.missions?.fish||0}/10 | 🌾 ${user.missions?.plant||0}/5 | 🏹 ${user.missions?.hunt||0}/3`, inline: false },
      )
      .setFooter({ text: '💰 Lúmen • Sistema de Economia' });

    return interaction.reply({ embeds: [embed] });
  }
};
