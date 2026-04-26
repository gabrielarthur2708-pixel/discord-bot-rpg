const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUser, saveUser } = require('../../utils/database');
const { rollFish, cooldownLeft, formatTime, randomChance, addXP } = require('../../utils/helpers');

const FISH_COOLDOWN = 30 * 60 * 1000;

module.exports = {
  data: new SlashCommandBuilder().setName('pescar').setDescription('🎣 Lance sua vara de pesca!'),

  async execute(interaction) {
    const user = getUser(interaction.user.id);
    const cd = cooldownLeft(user.fish_last, FISH_COOLDOWN);
    if (cd > 0) return interaction.reply({
      embeds: [new EmbedBuilder().setColor('#e74c3c')
        .setTitle('⏳ Você está cansado!')
        .setDescription(`Descanse um pouco antes de pescar novamente.\n\n⏱️ **Próxima pesca disponível em ${formatTime(cd)}**`)
        .setFooter({ text: `🎣 Lúmen • Pesca` })
      ], ephemeral: true
    });

    await interaction.reply({
      embeds: [new EmbedBuilder().setColor('#0099ff')
        .setTitle('🎣 Pescando...')
        .setDescription('Você lançou a vara na água...\n\n🌊 *A linha está na água...*\n🎣 *Você sente algo puxar...*')
        .setFooter({ text: '🎣 Lúmen • Pesca' })
      ]
    });
    await new Promise(r => setTimeout(r, 2500));

    if (randomChance(20)) {
      user.fish_last = Date.now();
      saveUser(interaction.user.id, user);
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor('#e74c3c')
          .setTitle('🎣 O peixe escapou!')
          .setDescription('Que pena! O peixe foi mais esperto dessa vez!\n\n😤 Tente novamente mais tarde!')
          .setFooter({ text: `🎣 Lúmen • Pesca | Próxima em ${formatTime(FISH_COOLDOWN)}` })
        ]
      });
    }

    const fish = rollFish(user.pet === 'dragon');
    if (user.job === 'fisherman') fish.value = Math.floor(fish.value * 1.15);

    user.missions.fish = (user.missions.fish || 0) + 1;
    user.total_fish = (user.total_fish || 0) + 1;
    user.fish_last = Date.now();
    user._pending_fish = { fish, timestamp: Date.now() };

    let missionBonus = '';
    if (!user.missions_claimed.fish && user.missions.fish >= 10) {
      user.coins = (user.coins || 0) + 2000;
      user.missions_claimed.fish = true;
      missionBonus = '\n\n🎯 **Missão Completa!** +2.000 moedas!';
    }

    const lv = addXP(user, 15);
    saveUser(interaction.user.id, user);

    const rarityColors = { 'Comum':'#95a5a6','Incomum':'#3498db','Raro':'#9b59b6','Épico':'#f39c12','Lendário':'#e74c3c' };
    const rarityLabel = { 'Comum':'⚪ Comum','Incomum':'🔵 Incomum','Raro':'🟣 Raro','Épico':'🟡 Épico','Lendário':'🔴 Lendário' };
    const celebrate = fish.name === 'Lendário' ? '\n\n🎊 **PEIXE LENDÁRIO! INCRÍVEL!** 🎊' : fish.name === 'Épico' ? '\n\n✨ **Que pescaria incrível!**' : '';

    const embed = new EmbedBuilder()
      .setColor(rarityColors[fish.name] || '#0099ff')
      .setTitle('🎣 Pescou algo!')
      .setThumbnail(interaction.user.displayAvatarURL())
      .addFields(
        { name: '🎯 Captura', value: `${fish.emoji} **${fish.name}**`, inline: true },
        { name: '⭐ Raridade', value: rarityLabel[fish.name] || fish.name, inline: true },
        { name: '💰 Valor de Venda', value: `${fish.value.toLocaleString('pt-BR')} 🪙`, inline: true },
        { name: '✨ Aura Ganha', value: `+${fish.name === 'Lendário' ? 25 : fish.name === 'Épico' ? 15 : fish.name === 'Raro' ? 8 : 3} ✨`, inline: true },
        { name: '🎣 Total Pescado', value: `${user.total_fish} peixes`, inline: true },
        { name: '📋 Missão', value: `${user.missions.fish}/10 ${user.missions_claimed.fish ? '✅' : ''}`, inline: true },
      )
      .setDescription(`${celebrate}${missionBonus}`)
      .setFooter({ text: `🎣 Lúmen • Pesca | Próxima em ${formatTime(FISH_COOLDOWN)}${lv ? ` | ⬆️ Level ${lv}!` : ''}` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`fish_sell:${interaction.user.id}`).setLabel('💰 Vender Agora').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`fish_keep:${interaction.user.id}`).setLabel('🎒 Guardar no Inventário').setStyle(ButtonStyle.Secondary),
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  }
};
