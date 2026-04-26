const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, getAllUsers } = require('../../utils/database');
const { PETS, JOBS, getCurrentSeason, SEASON_INFO, xpForLevel } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder().setName('perfil').setDescription('📊 Veja seu perfil completo!')
    .addUserOption(o => o.setName('usuario').setDescription('Ver perfil de outro jogador').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario') || interaction.user;
    const user = getUser(target.id);
    const pet = PETS.find(p=>p.id===user.pet);
    const job = JOBS.find(j=>j.id===user.job);
    const season = getCurrentSeason();
    const allUsers = getAllUsers();
    const rank = Object.entries(allUsers).sort((a,b)=>(b[1].coins||0)-(a[1].coins||0)).findIndex(([id])=>id===target.id)+1;
    const level = user.level||1;
    const xp = user.xp||0;
    const xpNeeded = xpForLevel(level);
    const prog = Math.floor((xp/xpNeeded)*10);
    const bar = '█'.repeat(prog)+'░'.repeat(10-prog);

    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle(`📊 Perfil de ${target.username}`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: '💰 Moedas', value: `${(user.coins||0).toLocaleString('pt-BR')} 🪙`, inline: true },
        { name: '✨ Aura', value: `${(user.aura||0).toLocaleString('pt-BR')} ✨`, inline: true },
        { name: '🏆 Ranking', value: `#${rank}`, inline: true },
        { name: '⭐ Nível', value: `${level}`, inline: true },
        { name: `📊 XP`, value: `\`${bar}\` ${xp}/${xpNeeded}`, inline: true },
        { name: '🌾 Estação', value: SEASON_INFO[season].name, inline: true },
        { name: '🐾 Pet', value: pet?`${pet.emoji} **${pet.name}**\n${pet.desc}`:'❌ Sem pet', inline: true },
        { name: '💼 Trabalho', value: job?`${job.emoji} **${job.name}**\n${job.desc}`:'❌ Sem trabalho', inline: true },
        { name: '📈 Estatísticas', value: `🎣 ${user.total_fish||0} peixes\n🏹 ${user.total_hunts||0} caças\n🌾 ${user.total_plants||0} plantas`, inline: true },
        { name: '🎯 Missões', value: `🎣 Pesca: ${user.missions?.fish||0}/10 ${user.missions_claimed?.fish?'✅':''}\n🌾 Fazenda: ${user.missions?.plant||0}/5 ${user.missions_claimed?.plant?'✅':''}\n🏹 Caça: ${user.missions?.hunt||0}/3 ${user.missions_claimed?.hunt?'✅':''}`, inline: false },
      )
      .setFooter({ text: `📊 Lúmen • Sistema de Economia | Membro desde ${user.created_at?new Date(user.created_at).toLocaleDateString('pt-BR'):'N/A'}` });

    return interaction.reply({ embeds: [embed] });
  }
};
