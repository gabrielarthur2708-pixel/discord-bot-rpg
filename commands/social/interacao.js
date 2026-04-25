const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const INTERACTION_GIFS = {
  abracar: ['https://media.giphy.com/media/l2QDM9Jnim1YVILXa/giphy.gif', 'https://media.giphy.com/media/3bqtLDeiDtwhq/giphy.gif'],
  beijar: ['https://media.giphy.com/media/G3va31oEEnIkM/giphy.gif', 'https://media.giphy.com/media/bGm9FuBCGg4SY/giphy.gif'],
  rir: ['https://media.giphy.com/media/5xaOcLDE9JQKX5JVCKS/giphy.gif', 'https://media.giphy.com/media/3o7abGQa0aRFXqU69i/giphy.gif'],
  bater: ['https://media.giphy.com/media/xUO4t2gkziBtki2qoE/giphy.gif', 'https://media.giphy.com/media/62PP2yEIAZF6g/giphy.gif'],
  dormir: ['https://media.giphy.com/media/yoJC2GnSClbPOkV0eA/giphy.gif'],
};

const MESSAGES = {
  abracar: (a, b) => `🤗 **${a}** deu um abraço caloroso em **${b}**!`,
  beijar: (a, b) => `❤️ **${a}** beijou **${b}**! 😘`,
  rir: (a, b) => `😂 **${a}** riu muito de **${b}**!`,
  bater: (a, b) => `😡 **${a}** bateu em **${b}**! Ai!`,
  dormir: (a) => `😴 **${a}** foi dormir... Boa noite! 🌙`,
};

const COLORS = { abracar: '#ff9f43', beijar: '#ff6b9d', rir: '#f1c40f', bater: '#e74c3c', dormir: '#9b59b6' };

module.exports = {
  data: new SlashCommandBuilder()
    .setName('interacao')
    .setDescription('💬 Interaja com outros membros!')
    .addSubcommand(s => s.setName('abracar').setDescription('🤗 Abrace alguém!').addUserOption(o => o.setName('usuario').setDescription('Quem?').setRequired(true)))
    .addSubcommand(s => s.setName('beijar').setDescription('❤️ Beije alguém!').addUserOption(o => o.setName('usuario').setDescription('Quem?').setRequired(true)))
    .addSubcommand(s => s.setName('rir').setDescription('😂 Ria de alguém!').addUserOption(o => o.setName('usuario').setDescription('Quem?').setRequired(true)))
    .addSubcommand(s => s.setName('bater').setDescription('😡 Bata em alguém!').addUserOption(o => o.setName('usuario').setDescription('Quem?').setRequired(true)))
    .addSubcommand(s => s.setName('dormir').setDescription('😴 Durma...')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const author = interaction.user.username;
    let target = null;

    if (sub !== 'dormir') {
      target = interaction.options.getUser('usuario');
      if (target.bot && sub !== 'rir') {
        return interaction.reply({ content: '❌ Você não pode fazer isso com um bot!', ephemeral: true });
      }
    }

    const gifs = INTERACTION_GIFS[sub];
    const gif = gifs[Math.floor(Math.random() * gifs.length)];
    const msg = sub === 'dormir' ? MESSAGES[sub](author) : MESSAGES[sub](author, target.username);

    const embed = new EmbedBuilder()
      .setColor(COLORS[sub])
      .setDescription(msg)
      .setImage(gif);

    return interaction.reply({ embeds: [embed] });
  }
};
