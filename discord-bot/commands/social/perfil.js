const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, getAllUsers } = require('../../utils/database');
const { PETS, JOBS, getCurrentSeason, SEASON_INFO } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('perfil')
    .setDescription('📊 Veja seu perfil ou de outro usuário')
    .addUserOption(o => o.setName('usuario').setDescription('Usuário para ver').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario') || interaction.user;
    const user = getUser(target.id);
    const pet = PETS.find(p => p.id === user.pet);
    const job = JOBS.find(j => j.id === user.job);
    const season = getCurrentSeason();

    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle(`📊 Perfil de ${target.username}`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: '💰 Moedas', value: `${(user.coins || 0).toLocaleString('pt-BR')}`, inline: true },
        { name: '✨ Aura', value: `${(user.aura || 0).toLocaleString('pt-BR')}`, inline: true },
        { name: '🌾 Estação', value: SEASON_INFO[season].name, inline: true },
        { name: '🐾 Pet', value: pet ? `${pet.emoji} ${pet.name} (${pet.desc})` : 'Nenhum', inline: true },
        { name: '💼 Trabalho', value: job ? `${job.emoji} ${job.name} (${job.desc})` : 'Nenhum', inline: true },
        { name: '📦 Inventário', value: `${(user.inventory || []).length + (user.fish_inventory || []).length} itens`, inline: true },
        { name: '🎯 Missões', value: `🎣 ${user.missions?.fish || 0}/10 | 🌾 ${user.missions?.plant || 0}/5 | 🏹 ${user.missions?.hunt || 0}/3`, inline: false },
        { name: '📈 Estatísticas', value: `Peixes: ${user.total_fish || 0} | Caças: ${user.total_hunts || 0} | Plantas: ${user.total_plants || 0}`, inline: false },
      )
      .setFooter({ text: `Conta criada em ${user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A'}` });

    return interaction.reply({ embeds: [embed] });
  }
};
