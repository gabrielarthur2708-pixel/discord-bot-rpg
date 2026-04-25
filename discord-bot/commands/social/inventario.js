const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUser, saveUser } = require('../../utils/database');
const { PETS, JOBS } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventario')
    .setDescription('🎒 Veja seu inventário completo!')
    .addUserOption(o => o.setName('usuario').setDescription('Ver inventário de outro jogador').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario') || interaction.user;
    const user = getUser(target.id);
    const pet = PETS.find(p => p.id === user.pet);
    const job = JOBS.find(j => j.id === user.job);

    // Fish inventory
    const fishInv = user.fish_inventory || [];
    const fishText = fishInv.length > 0
      ? fishInv.slice(-10).map(f => `${f.emoji} **${f.name}** — ${f.value.toLocaleString('pt-BR')} moedas`).join('\n')
      : '*Nenhum peixe guardado*';

    // Farm plots
    const plots = user.farm_plots || [];
    const plotText = plots.length > 0
      ? plots.map(p => `${p.emoji} **${p.name}**`).join(', ')
      : '*Nenhuma planta no momento*';

    const totalFishValue = fishInv.reduce((a, f) => a + (f.value || 0), 0);

    const embed = new EmbedBuilder()
      .setColor('#e67e22')
      .setTitle(`🎒 Inventário de ${target.username}`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        {
          name: '💰 Economia',
          value: [
            `> 💵 **Moedas:** ${(user.coins || 0).toLocaleString('pt-BR')}`,
            `> ✨ **Aura:** ${(user.aura || 0).toLocaleString('pt-BR')}`,
            `> ⭐ **Nível:** ${user.level || 1} | XP: ${user.xp || 0}`,
          ].join('\n'),
          inline: false
        },
        {
          name: `🐟 Peixes Guardados (${fishInv.length})`,
          value: fishText + (fishInv.length > 0 ? `\n\n💰 Valor total: **${totalFishValue.toLocaleString('pt-BR')}** moedas` : ''),
          inline: false
        },
        {
          name: '🌾 Fazenda',
          value: `> Parcelas ativas: **${plots.length}/5**\n> ${plotText}`,
          inline: false
        },
        {
          name: '🐾 Pet & Trabalho',
          value: [
            `> ${pet ? `${pet.emoji} **${pet.name}** — ${pet.desc}` : '🚫 Sem pet'}`,
            `> ${job ? `${job.emoji} **${job.name}** — ${job.desc}` : '🚫 Sem trabalho'}`,
          ].join('\n'),
          inline: false
        },
        {
          name: '📊 Estatísticas',
          value: [
            `> 🎣 Peixes capturados: **${user.total_fish || 0}**`,
            `> 🏹 Caçadas: **${user.total_hunts || 0}**`,
            `> 🌾 Plantas colhidas: **${user.total_plants || 0}**`,
            `> 🦹 Total roubado: **${(user.total_robbed || 0).toLocaleString('pt-BR')}** moedas`,
          ].join('\n'),
          inline: false
        },
      )
      .setFooter({ text: `Use /pix para transferir moedas • /loja para comprar pets` });

    // Sell all fish button (only for own inventory)
    const components = [];
    if (target.id === interaction.user.id && fishInv.length > 0) {
      components.push(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`inv_sell_all:${interaction.user.id}`)
          .setLabel(`💰 Vender Todos os Peixes (+${totalFishValue.toLocaleString('pt-BR')} moedas)`)
          .setStyle(ButtonStyle.Success)
      ));
    }

    return interaction.reply({ embeds: [embed], components });
  }
};
