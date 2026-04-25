const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, saveUser } = require('../../utils/database');
const { rollHunt, cooldownLeft, formatTime, randomChance, addXP } = require('../../utils/helpers');

const HUNT_COOLDOWN = 30 * 60 * 1000;

module.exports = {
  data: new SlashCommandBuilder().setName('cacar').setDescription('🏹 Saia para caçar!'),

  async execute(interaction) {
    const user = getUser(interaction.user.id);
    const cd = cooldownLeft(user.hunt_last, HUNT_COOLDOWN);
    if (cd > 0) return interaction.reply({ content: `⏳ Aguarde **${formatTime(cd)}** para caçar novamente!`, ephemeral: true });

    await interaction.reply({ embeds: [new EmbedBuilder().setColor('#8b4513').setTitle('🏹 Caçando...').setDescription('Você entrou na floresta...\n\n🌲 *Pisadas na lama...*\n👁️ *Você vê algo se mexendo...*')] });
    await new Promise(r => setTimeout(r, 2500));

    if (randomChance(15)) {
      user.hunt_last = Date.now();
      saveUser(interaction.user.id, user);
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor('#ff6b6b').setTitle('🏹 Caçada Frustrada!').setDescription('A presa fugiu antes de você chegar! 😤\nA floresta estava silenciosa...')] });
    }

    const animal = rollHunt(user.pet === 'wolf', user.job === 'hunter');
    user.coins = (user.coins || 0) + animal.coins;
    user.missions.hunt = (user.missions.hunt || 0) + 1;
    user.total_hunts = (user.total_hunts || 0) + 1;
    user.hunt_last = Date.now();

    let missionMsg = '';
    if (!user.missions_claimed.hunt && user.missions.hunt >= 3) {
      user.coins += 1800;
      user.missions_claimed.hunt = true;
      missionMsg = '\n🎯 **Missão Completa!** +1800 moedas!';
    }

    const celebrate = animal.name === 'Dragão' ? '\n\n🐲 **DRAGÃO ABATIDO! LENDA!** 🐲' : animal.name === 'Urso' ? '\n\n🐻 **Que caçada épica!**' : '';
    const lv = addXP(user, 25);
    saveUser(interaction.user.id, user);

    const colors = { 'Coelho':'#95a5a6','Cervo':'#27ae60','Lobo':'#8e44ad','Urso':'#e67e22','Dragão':'#e74c3c' };

    await interaction.editReply({ embeds: [new EmbedBuilder()
      .setColor(colors[animal.name] || '#8b4513')
      .setTitle(`${animal.emoji} Caçada Bem-sucedida!`)
      .setDescription(`Você caçou um **${animal.name}** ${animal.emoji}${celebrate}${missionMsg}`)
      .addFields(
        { name: '💰 Recompensa', value: `${animal.coins.toLocaleString('pt-BR')} moedas`, inline: true },
        { name: '💵 Saldo', value: `${user.coins.toLocaleString('pt-BR')} moedas`, inline: true },
        { name: '🏹 Missão', value: `${user.missions.hunt}/3`, inline: true },
      )
      .setFooter({ text: `Total de caças: ${user.total_hunts}${lv ? ` | ⬆️ Level ${lv}!` : ''}` })
    ] });
  }
};
