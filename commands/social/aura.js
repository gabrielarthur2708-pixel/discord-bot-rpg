const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, getAllUsers } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('aura')
    .setDescription('✨ Veja sua aura e ranking!')
    .addUserOption(o => o.setName('usuario').setDescription('Ver aura de outro jogador').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario') || interaction.user;
    const user = getUser(target.id);

    const allUsers = getAllUsers();
    const sorted = Object.entries(allUsers).sort((a, b) => (b[1].aura || 0) - (a[1].aura || 0));
    const rank = sorted.findIndex(([id]) => id === target.id) + 1;

    const aura = user.aura || 0;

    // Aura title based on amount
    let titulo, cor;
    if (aura >= 10000)      { titulo = '👑 Deus da Aura';    cor = '#f1c40f'; }
    else if (aura >= 5000)  { titulo = '💎 Lenda';           cor = '#9b59b6'; }
    else if (aura >= 2000)  { titulo = '🔥 Mestre';          cor = '#e74c3c'; }
    else if (aura >= 1000)  { titulo = '⚡ Guerreiro';       cor = '#e67e22'; }
    else if (aura >= 500)   { titulo = '🌟 Aventureiro';     cor = '#3498db'; }
    else if (aura >= 100)   { titulo = '🌱 Iniciante';       cor = '#27ae60'; }
    else                    { titulo = '👶 Novato';           cor = '#95a5a6'; }

    // Progress to next title
    const milestones = [100, 500, 1000, 2000, 5000, 10000];
    const next = milestones.find(m => m > aura);
    const progressText = next ? `Próximo título em **${(next - aura).toLocaleString('pt-BR')}** aura` : '🏆 Título máximo!';

    const embed = new EmbedBuilder()
      .setColor(cor)
      .setTitle(`✨ Aura de ${target.username}`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: '✨ Aura Total', value: `**${aura.toLocaleString('pt-BR')}**`, inline: true },
        { name: '🏷️ Título',    value: titulo,                                 inline: true },
        { name: '🏆 Ranking',   value: `**#${rank}**`,                         inline: true },
        { name: '📈 Progresso', value: progressText,                           inline: false },
        { name: '⚔️ PvP',
          value: [
            `Vitórias: **${user.pvp_wins || 0}**`,
            `Derrotas: **${user.pvp_losses || 0}**`,
          ].join(' | '),
          inline: false
        },
      )
      .setFooter({ text: 'Ganhe aura vencendo PvPs! • /pvp @usuario para batalhar' });

    return interaction.reply({ embeds: [embed] });
  }
};
