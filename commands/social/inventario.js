const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUser, saveUser } = require('../../utils/database');
const { PETS, JOBS } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder().setName('inventario').setDescription('🎒 Veja seu inventário completo!')
    .addUserOption(o => o.setName('usuario').setDescription('Ver inventário de outro jogador').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario') || interaction.user;
    const user = getUser(target.id);
    const pet = PETS.find(p=>p.id===user.pet);
    const job = JOBS.find(j=>j.id===user.job);

    const fishInv = user.fish_inventory || [];
    const huntInv = user.hunt_inventory || [];
    const totalFishValue = fishInv.reduce((a,f)=>a+(f.value||0),0);
    const totalHuntValue = huntInv.reduce((a,h)=>a+(h.value||0),0);

    const fishText = fishInv.length > 0
      ? fishInv.slice(-5).map(f=>`${f.emoji} **${f.name}** — ${f.value.toLocaleString('pt-BR')} 🪙`).join('\n') + (fishInv.length>5?`\n*...e mais ${fishInv.length-5}*`:'')
      : '❌ Nenhum peixe guardado';

    const huntText = huntInv.length > 0
      ? huntInv.slice(-5).map(h=>`${h.emoji} **${h.name}** — ${h.value.toLocaleString('pt-BR')} 🪙`).join('\n') + (huntInv.length>5?`\n*...e mais ${huntInv.length-5}*`:'')
      : '❌ Nenhum animal guardado';

    const embed = new EmbedBuilder()
      .setColor('#e67e22')
      .setTitle(`🎒 Inventário de ${target.username}`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: '💰 Moedas', value: `${(user.coins||0).toLocaleString('pt-BR')} 🪙`, inline: true },
        { name: '✨ Aura', value: `${(user.aura||0).toLocaleString('pt-BR')} ✨`, inline: true },
        { name: '⭐ Nível', value: `${user.level||1}`, inline: true },
        { name: `🐟 Peixes (${fishInv.length}) — Valor: ${totalFishValue.toLocaleString('pt-BR')} 🪙`, value: fishText, inline: false },
        { name: `🦌 Animais (${huntInv.length}) — Valor: ${totalHuntValue.toLocaleString('pt-BR')} 🪙`, value: huntText, inline: false },
        { name: '🐾 Pet Equipado', value: pet?`${pet.emoji} **${pet.name}** — ${pet.desc}`:'❌ Sem pet', inline: true },
        { name: '💼 Trabalho', value: job?`${job.emoji} **${job.name}** — ${job.desc}`:'❌ Sem trabalho', inline: true },
        { name: '📈 Estatísticas', value: `🎣 ${user.total_fish||0} peixes capturados\n🏹 ${user.total_hunts||0} animais caçados\n🌾 ${user.total_plants||0} plantas colhidas\n🦹 ${(user.total_robbed||0).toLocaleString('pt-BR')} moedas roubadas`, inline: false },
      )
      .setFooter({ text: '🎒 Lúmen • Sistema de Economia' });

    const components = [];
    if (target.id === interaction.user.id && (fishInv.length > 0 || huntInv.length > 0)) {
      const row = new ActionRowBuilder();
      if (fishInv.length > 0) row.addComponents(new ButtonBuilder().setCustomId(`inv_sell_all:${interaction.user.id}`).setLabel(`💰 Vender Peixes (+${totalFishValue.toLocaleString('pt-BR')} 🪙)`).setStyle(ButtonStyle.Success));
      if (huntInv.length > 0) row.addComponents(new ButtonBuilder().setCustomId(`inv_sell_hunt:${interaction.user.id}`).setLabel(`💰 Vender Animais (+${totalHuntValue.toLocaleString('pt-BR')} 🪙)`).setStyle(ButtonStyle.Primary));
      components.push(row);
    }

    return interaction.reply({ embeds: [embed], components });
  }
};
