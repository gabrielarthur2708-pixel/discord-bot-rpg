const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUser, saveUser } = require('../../utils/database');
const { rollFish, cooldownLeft, formatTime, randomChance } = require('../../utils/helpers');

const FISH_COOLDOWN = 30 * 1000; // 30 seconds

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pescar')
    .setDescription('🎣 Lance sua vara de pesca!'),

  async execute(interaction) {
    const user = getUser(interaction.user.id);

    // Cooldown check
    const cd = cooldownLeft(user.fish_last, FISH_COOLDOWN);
    if (cd > 0) {
      return interaction.reply({
        content: `⏳ Aguarde **${formatTime(cd)}** para pescar novamente!`,
        ephemeral: true
      });
    }

    // Fishing animation
    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🎣 Pescando...')
        .setDescription('Você lançou a vara... aguardando...\n\n🌊 *A linha está na água...*')
      ]
    });

    // Simulate wait
    await new Promise(r => setTimeout(r, 2000));

    // 20% fail chance
    if (randomChance(20)) {
      user.fish_last = Date.now();
      saveUser(interaction.user.id, user);
      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor('#ff6b6b')
          .setTitle('🎣 Sem sorte!')
          .setDescription('O peixe escapou... tente novamente em breve!')
          .setFooter({ text: `Cooldown: ${formatTime(FISH_COOLDOWN)}` })
        ]
      });
    }

    const hasDragonPet = user.pet === 'dragon';
    const isFisherman = user.job === 'fisherman';
    const fish = rollFish(hasDragonPet);

    // Apply fisherman job bonus (extra value)
    if (isFisherman) fish.value = Math.floor(fish.value * 1.2);

    // Mission tracking
    user.missions.fish = (user.missions.fish || 0) + 1;
    user.total_fish = (user.total_fish || 0) + 1;
    user.fish_last = Date.now();

    // Store pending fish for button handler
    user._pending_fish = { fish, timestamp: Date.now() };
    saveUser(interaction.user.id, user);

    const rarityColors = {
      'Gigante': '#95a5a6',
      'Anjo': '#3498db',
      'Arcanjo': '#9b59b6',
      'Semideus': '#f39c12',
      'Deus': '#e74c3c',
    };

    const embed = new EmbedBuilder()
      .setColor(rarityColors[fish.name] || '#0099ff')
      .setTitle(`${fish.emoji} Peixe Capturado!`)
      .setDescription(`Você pescou um **${fish.name}** ${fish.emoji}`)
      .addFields(
        { name: '⭐ Raridade', value: fish.name, inline: true },
        { name: '💰 Valor', value: `${fish.value.toLocaleString('pt-BR')} moedas`, inline: true },
        { name: '🎣 Total de Peixes', value: `${user.total_fish}`, inline: true }
      )
      .setFooter({ text: `Missão: ${user.missions.fish}/10 peixes` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`fish_keep:${interaction.user.id}`)
        .setLabel('📦 Guardar')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`fish_sell:${interaction.user.id}`)
        .setLabel('💰 Vender')
        .setStyle(ButtonStyle.Success)
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  }
};
