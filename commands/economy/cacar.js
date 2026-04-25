const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, saveUser } = require('../../utils/database');
const { rollHunt, cooldownLeft, formatTime, randomChance } = require('../../utils/helpers');

const HUNT_COOLDOWN = 60 * 1000; // 1 minute

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cacar')
    .setDescription('🏹 Saia para caçar!'),

  async execute(interaction) {
    const user = getUser(interaction.user.id);

    const cd = cooldownLeft(user.hunt_last, HUNT_COOLDOWN);
    if (cd > 0) {
      return interaction.reply({
        content: `⏳ Aguarde **${formatTime(cd)}** para caçar novamente!`,
        ephemeral: true
      });
    }

    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor('#8b4513')
        .setTitle('🏹 Caçando...')
        .setDescription('Você entrou na floresta... procurando um alvo...\n\n🌲 *Pisadas na lama...*')
      ]
    });

    await new Promise(r => setTimeout(r, 2000));

    // 15% fail chance
    if (randomChance(15)) {
      user.hunt_last = Date.now();
      saveUser(interaction.user.id, user);
      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor('#ff6b6b')
          .setTitle('🏹 Caçada Frustrada!')
          .setDescription('Nenhum animal encontrado... a floresta estava silenciosa.')
        ]
      });
    }

    const hasWolfPet = user.pet === 'wolf';
    const isHunter = user.job === 'hunter';
    const animal = rollHunt(hasWolfPet, isHunter);

    user.coins = (user.coins || 0) + animal.coins;
    user.missions.hunt = (user.missions.hunt || 0) + 1;
    user.total_hunts = (user.total_hunts || 0) + 1;
    user.hunt_last = Date.now();

    let missionMsg = '';
    if (!user.missions_claimed.hunt && user.missions.hunt >= 3) {
      user.coins += 1800;
      user.missions_claimed.hunt = true;
      missionMsg = '\n\n🎯 **Missão Completa!** Caçou 3x → +1800 moedas!';
    }

    saveUser(interaction.user.id, user);

    const rarityColors = { 'Coelho': '#95a5a6', 'Cervo': '#27ae60', 'Lobo': '#8e44ad', 'Urso': '#e67e22', 'Dragão': '#e74c3c' };

    await interaction.editReply({
      embeds: [new EmbedBuilder()
        .setColor(rarityColors[animal.name] || '#8b4513')
        .setTitle(`${animal.emoji} Caçada Bem-sucedida!`)
        .setDescription(`Você caçou um **${animal.name}** ${animal.emoji}${missionMsg}`)
        .addFields(
          { name: '💰 Recompensa', value: `${animal.coins.toLocaleString('pt-BR')} moedas`, inline: true },
          { name: '💵 Saldo', value: `${user.coins.toLocaleString('pt-BR')} moedas`, inline: true },
          { name: '🏹 Missão', value: `${user.missions.hunt}/3 caças`, inline: true }
        )
      ]
    });
  }
};
