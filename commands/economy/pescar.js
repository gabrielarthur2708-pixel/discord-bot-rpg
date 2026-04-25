const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUser, saveUser } = require('../../utils/database');
const { rollFish, cooldownLeft, formatTime, randomChance, addXP } = require('../../utils/helpers');

const FISH_COOLDOWN = 30 * 60 * 1000;

module.exports = {
  data: new SlashCommandBuilder().setName('pescar').setDescription('🎣 Lance sua vara de pesca!'),

  async execute(interaction) {
    const user = getUser(interaction.user.id);
    const cd = cooldownLeft(user.fish_last, FISH_COOLDOWN);
    if (cd > 0) return interaction.reply({ content: `⏳ Aguarde **${formatTime(cd)}** para pescar novamente!`, ephemeral: true });

    await interaction.reply({ embeds: [new EmbedBuilder().setColor('#0099ff').setTitle('🎣 Pescando...').setDescription('Você lançou a vara... aguardando...\n\n🌊 *A linha está na água...*\n🎣 *Você sente algo puxar...*')] });
    await new Promise(r => setTimeout(r, 2500));

    if (randomChance(20)) {
      user.fish_last = Date.now();
      saveUser(interaction.user.id, user);
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor('#ff6b6b').setTitle('🎣 O peixe escapou!').setDescription('Que pena... o peixe foi mais esperto dessa vez! 😤\nTente novamente!').setFooter({ text: `Cooldown: ${formatTime(FISH_COOLDOWN)}` })] });
    }

    const fish = rollFish(user.pet === 'dragon');
    if (user.job === 'fisherman') fish.value = Math.floor(fish.value * 1.2);

    user.missions.fish = (user.missions.fish || 0) + 1;
    user.total_fish = (user.total_fish || 0) + 1;
    user.fish_last = Date.now();
    user._pending_fish = { fish, timestamp: Date.now() };

    let missionMsg = '';
    if (!user.missions_claimed.fish && user.missions.fish >= 10) {
      user.coins = (user.coins || 0) + 2000;
      user.missions_claimed.fish = true;
      missionMsg = '\n🎯 **Missão Completa!** +2000 moedas!';
    }

    const lv = addXP(user, 15);
    saveUser(interaction.user.id, user);

    const colors = { 'Gigante':'#95a5a6','Anjo':'#3498db','Arcanjo':'#9b59b6','Semideus':'#f39c12','Deus':'#e74c3c' };
    const celebrate = fish.name === 'Deus' ? '\n\n🎊 **INCRÍVEL! PEIXE LENDÁRIO!** 🎊' : fish.name === 'Semideus' ? '\n\n✨ **Que pescaria incrível!**' : '';

    const embed = new EmbedBuilder()
      .setColor(colors[fish.name] || '#0099ff')
      .setTitle(`${fish.emoji} Peixe Capturado!`)
      .setDescription(`Você pescou um **${fish.name}** ${fish.emoji}${celebrate}${missionMsg}`)
      .addFields(
        { name: '⭐ Raridade', value: fish.name, inline: true },
        { name: '💰 Valor', value: `${fish.value.toLocaleString('pt-BR')} moedas`, inline: true },
        { name: '🎣 Total', value: `${user.total_fish} peixes`, inline: true },
      )
      .setFooter({ text: `Missão: ${user.missions.fish}/10${lv ? ` | ⬆️ Level ${lv}!` : ''}` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`fish_keep:${interaction.user.id}`).setLabel('📦 Guardar').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`fish_sell:${interaction.user.id}`).setLabel('💰 Vender').setStyle(ButtonStyle.Success)
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  }
};
