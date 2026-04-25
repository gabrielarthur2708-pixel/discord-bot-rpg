const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, getAllUsers } = require('../../utils/database');
const { xpForLevel } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nivel')
    .setDescription('⭐ Veja seu nível e XP!')
    .addUserOption(o => o.setName('usuario').setDescription('Usuário').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario') || interaction.user;
    const user = getUser(target.id);

    const level = user.level || 1;
    const xp = user.xp || 0;
    const xpNeeded = xpForLevel(level);
    const progress = Math.floor((xp / xpNeeded) * 20);
    const bar = '█'.repeat(progress) + '░'.repeat(20 - progress);

    // Level perks
    const PERKS = {
      5: '🎣 +5% chance de peixe raro',
      10: '💰 +100 moedas no daily',
      15: '🏹 +5% dano no PvP',
      20: '🎰 -5% perda no cassino',
      25: '🦹 +5% chance de roubo',
      30: '✨ +10% aura em tudo',
      50: '👑 Título especial: Lenda',
    };

    const nextPerk = Object.entries(PERKS).find(([l]) => parseInt(l) > level);

    const embed = new EmbedBuilder()
      .setColor('#9b59b6')
      .setTitle(`⭐ Nível de ${target.username}`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: '🏆 Nível Atual', value: `**${level}**`, inline: true },
        { name: '✨ XP', value: `${xp}/${xpNeeded}`, inline: true },
        { name: '📊 Progresso', value: `\`${bar}\` ${Math.floor(xp/xpNeeded*100)}%`, inline: false },
        { name: '🦹 Roubos', value: `Total: ${user.total_robbed?.toLocaleString('pt-BR') || 0} moedas roubadas`, inline: true },
        { name: '😢 Roubado', value: `${user.robbed_count || 0}x`, inline: true },
      );

    if (nextPerk) {
      embed.addFields({ name: `🎯 Próxima recompensa (Nível ${nextPerk[0]})`, value: nextPerk[1], inline: false });
    }

    embed.setFooter({ text: `XP é ganho jogando, pescando, caçando, roubando e mais!` });

    return interaction.reply({ embeds: [embed] });
  }
};
