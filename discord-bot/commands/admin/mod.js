const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getUser, saveUser, loadDB, saveDB } = require('../../utils/database');

async function sendLog(guild, embed) {
  const logChannel = guild.channels.cache.find(c => c.name === 'logs' || c.name === 'mod-logs' || c.name === 'registros');
  if (logChannel) await logChannel.send({ embeds: [embed] }).catch(() => {});
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mod')
    .setDescription('🛡️ Moderação (apenas ADM)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s => s.setName('ban').setDescription('🔨 Banir membro')
      .addUserOption(o => o.setName('usuario').setDescription('Membro').setRequired(true))
      .addStringOption(o => o.setName('motivo').setDescription('Motivo')))
    .addSubcommand(s => s.setName('kick').setDescription('👢 Expulsar membro')
      .addUserOption(o => o.setName('usuario').setDescription('Membro').setRequired(true))
      .addStringOption(o => o.setName('motivo').setDescription('Motivo')))
    .addSubcommand(s => s.setName('mute').setDescription('🔇 Mutar membro')
      .addUserOption(o => o.setName('usuario').setDescription('Membro').setRequired(true))
      .addIntegerOption(o => o.setName('minutos').setDescription('Duração em minutos').setRequired(true).setMinValue(1).setMaxValue(1440)))
    .addSubcommand(s => s.setName('avisar').setDescription('⚠️ Dar aviso')
      .addUserOption(o => o.setName('usuario').setDescription('Membro').setRequired(true))
      .addStringOption(o => o.setName('motivo').setDescription('Motivo').setRequired(true)))
    .addSubcommand(s => s.setName('avisos').setDescription('📋 Ver avisos de um membro')
      .addUserOption(o => o.setName('usuario').setDescription('Membro').setRequired(true))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getUser('usuario');
    const motivo = interaction.options.getString('motivo') || 'Sem motivo especificado';

    if (sub === 'ban') {
      const member = await interaction.guild.members.fetch(target.id).catch(() => null);
      if (!member) return interaction.reply({ content: '❌ Membro não encontrado!', ephemeral: true });
      
      await member.ban({ reason: motivo });
      const embed = new EmbedBuilder().setColor('#e74c3c').setTitle('🔨 Membro Banido')
        .addFields({ name: 'Usuário', value: `${target.tag}`, inline: true }, { name: 'Motivo', value: motivo, inline: true }, { name: 'Por', value: interaction.user.tag, inline: true })
        .setTimestamp();
      await sendLog(interaction.guild, embed);
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'kick') {
      const member = await interaction.guild.members.fetch(target.id).catch(() => null);
      if (!member) return interaction.reply({ content: '❌ Membro não encontrado!', ephemeral: true });
      
      await member.kick(motivo);
      const embed = new EmbedBuilder().setColor('#e67e22').setTitle('👢 Membro Expulso')
        .addFields({ name: 'Usuário', value: `${target.tag}`, inline: true }, { name: 'Motivo', value: motivo, inline: true }, { name: 'Por', value: interaction.user.tag, inline: true })
        .setTimestamp();
      await sendLog(interaction.guild, embed);
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'mute') {
      const member = await interaction.guild.members.fetch(target.id).catch(() => null);
      if (!member) return interaction.reply({ content: '❌ Membro não encontrado!', ephemeral: true });
      
      const minutos = interaction.options.getInteger('minutos');
      await member.timeout(minutos * 60 * 1000, motivo);
      const embed = new EmbedBuilder().setColor('#f39c12').setTitle('🔇 Membro Mutado')
        .addFields({ name: 'Usuário', value: `${target.tag}`, inline: true }, { name: 'Duração', value: `${minutos} minutos`, inline: true }, { name: 'Por', value: interaction.user.tag, inline: true })
        .setTimestamp();
      await sendLog(interaction.guild, embed);
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'avisar') {
      const userData = getUser(target.id);
      userData.warnings = userData.warnings || [];
      userData.warnings.push({ motivo, by: interaction.user.id, date: Date.now() });
      saveUser(target.id, userData);

      const embed = new EmbedBuilder().setColor('#f1c40f').setTitle('⚠️ Aviso Dado')
        .addFields(
          { name: 'Usuário', value: `${target.tag}`, inline: true },
          { name: 'Avisos totais', value: `${userData.warnings.length}`, inline: true },
          { name: 'Motivo', value: motivo },
          { name: 'Por', value: interaction.user.tag, inline: true }
        ).setTimestamp();
      await sendLog(interaction.guild, embed);
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'avisos') {
      const userData = getUser(target.id);
      const warnings = userData.warnings || [];
      const warnList = warnings.length
        ? warnings.map((w, i) => `**${i+1}.** ${w.motivo} — ${new Date(w.date).toLocaleDateString('pt-BR')}`).join('\n')
        : 'Nenhum aviso.';

      return interaction.reply({
        embeds: [new EmbedBuilder().setColor('#f1c40f').setTitle(`⚠️ Avisos de ${target.username}`)
          .setDescription(warnList).setFooter({ text: `Total: ${warnings.length}` })]
      });
    }
  }
};
