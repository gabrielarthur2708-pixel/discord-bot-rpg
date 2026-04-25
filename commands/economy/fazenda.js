const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { getUser, saveUser } = require('../../utils/database');
const { getCurrentSeason, SEASON_INFO, FARM_PLANTS, formatTime, addXP } = require('../../utils/helpers');

const ROT_TIME = 5 * 60 * 1000;
const MAX_PLOTS = 5;

function buildFarmVisual(plots, season) {
  const now = Date.now();
  const rows = [];
  for (let i = 0; i < MAX_PLOTS; i++) {
    const p = plots[i];
    if (!p) { rows.push(`🟫 **Parcela ${i+1}** — *Vazia, aguardando plantio...*`); continue; }
    const timeLeft = p.ready_at - now;
    const rotLeft = p.ready_at + ROT_TIME - now;
    if (now > p.ready_at + ROT_TIME) { rows.push(`💀 **Parcela ${i+1}** ${p.emoji} ~~${p.name}~~ — **APODRECEU!**`); continue; }
    if (now >= p.ready_at) { rows.push(`✅ **Parcela ${i+1}** ${p.emoji} **${p.name}** — **PRONTO!** *(apodrece em ${formatTime(rotLeft)})*`); continue; }
    const prog = Math.floor(((p.time - timeLeft) / p.time) * 8);
    const bar = '🟩'.repeat(prog) + '⬛'.repeat(8 - prog);
    rows.push(`🌱 **Parcela ${i+1}** ${p.emoji} **${p.name}**\n╰ ${bar} ⏱️ ${formatTime(timeLeft)}`);
  }
  return rows.join('\n\n');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fazenda')
    .setDescription('🌾 Gerencie sua fazenda!')
    .addSubcommand(s => s.setName('ver').setDescription('👀 Ver sua fazenda'))
    .addSubcommand(s => s.setName('plantar').setDescription('🌱 Plantar uma cultura'))
    .addSubcommand(s => s.setName('colher').setDescription('🌾 Colher plantas prontas')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const user = getUser(interaction.user.id);
    const season = getCurrentSeason();
    const seasonInfo = SEASON_INFO[season];
    user.farm_plots = user.farm_plots || [];

    if (sub === 'ver') {
      const visual = buildFarmVisual(user.farm_plots, season);
      const ready = user.farm_plots.filter(p => Date.now() >= p.ready_at && Date.now() <= p.ready_at + ROT_TIME).length;
      return interaction.reply({ embeds: [new EmbedBuilder().setColor('#27ae60').setTitle('🌾 Sua Fazenda')
        .setDescription(visual)
        .addFields({ name: seasonInfo.name, value: `⭐ Bônus: ${seasonInfo.bonus.join(', ')}`, inline: true }, { name: '📦 Parcelas', value: `${user.farm_plots.length}/${MAX_PLOTS}`, inline: true }, { name: '✅ Prontas', value: `${ready}`, inline: true })
        .setFooter({ text: 'Plantas prontas apodrecem em 5 minutos! Colha rápido!' })
      ] });
    }

    if (sub === 'plantar') {
      if (user.farm_plots.length >= MAX_PLOTS) return interaction.reply({ content: '❌ Todas as parcelas estão ocupadas!', ephemeral: true });
      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId(`farm_plant:${interaction.user.id}`).setPlaceholder('🌱 Escolha o que plantar...').addOptions(
          FARM_PLANTS.map(p => ({ label: `${p.emoji} ${p.name.charAt(0).toUpperCase()+p.name.slice(1)}`, description: `⏱️ ${formatTime(p.time)} | 💰 ${p.coins} moedas${p.season===season?' ⭐ BÔNUS +30%!':''}`, value: p.name }))
        )
      );
      return interaction.reply({ embeds: [new EmbedBuilder().setColor('#27ae60').setTitle('🌱 Plantar').setDescription(`**Estação:** ${seasonInfo.name}\n⭐ **Bônus:** ${seasonInfo.bonus.join(', ')}\n🟫 **Parcelas livres:** ${MAX_PLOTS - user.farm_plots.length}`)], components: [row] });
    }

    if (sub === 'colher') {
      const now = Date.now();
      let earned = 0, harvested = 0, rotted = 0;
      const names = [];
      const remaining = user.farm_plots.filter(p => {
        if (now > p.ready_at + ROT_TIME) { rotted++; return false; }
        if (now >= p.ready_at) {
          let coins = p.coins;
          if (user.job==='farmer') coins=Math.floor(coins*1.25);
          if (p.season===season) coins=Math.floor(coins*1.3);
          earned+=coins; harvested++;
          names.push(`${p.emoji} **${p.name}** → ${coins.toLocaleString('pt-BR')} moedas`);
          return false;
        }
        return true;
      });
      if (harvested===0 && rotted===0) return interaction.reply({ content: '⏳ Nenhuma planta pronta!', ephemeral: true });
      user.coins=(user.coins||0)+earned; user.farm_plots=remaining;
      user.missions.plant=(user.missions.plant||0)+harvested;
      user.total_plants=(user.total_plants||0)+harvested;
      let bonus='';
      if (!user.missions_claimed.plant && user.missions.plant>=5) { user.coins+=1500; user.missions_claimed.plant=true; bonus='\n🎯 **Missão!** +1500 moedas!'; }
      const lv = addXP(user, harvested*20);
      saveUser(interaction.user.id, user);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor('#f1c40f').setTitle('🌾 Colheita!')
        .setDescription(names.join('\n') || 'Nada colhido.')
        .addFields({ name:'✅ Colhidas',value:`${harvested}`,inline:true },{ name:'💀 Apodrecidas',value:`${rotted}`,inline:true },{ name:'💰 Ganho',value:`${earned.toLocaleString('pt-BR')} moedas`,inline:true },{ name:'💵 Saldo',value:`${user.coins.toLocaleString('pt-BR')}`,inline:true })
        .setFooter({ text:`${bonus}${lv?` ⬆️ Level ${lv}!`:''}`.trim()||'Boa colheita!' })
      ] });
    }
  }
};
