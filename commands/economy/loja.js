const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUser, saveUser } = require('../../utils/database');
const { PETS, JOBS } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loja')
    .setDescription('🛒 Loja de pets e trabalhos!')
    .addSubcommand(s => s.setName('pets').setDescription('🐾 Comprar/ver pets'))
    .addSubcommand(s => s.setName('trabalhos').setDescription('💼 Ver e escolher trabalhos'))
    .addSubcommand(s => s.setName('comprar_pet').setDescription('🐾 Comprar um pet')
      .addStringOption(o => o.setName('pet').setDescription('ID do pet').setRequired(true)
        .addChoices(...PETS.map(p => ({ name: `${p.emoji} ${p.name} - ${p.price.toLocaleString('pt-BR')} moedas`, value: p.id })))))
    .addSubcommand(s => s.setName('escolher_trabalho').setDescription('💼 Escolher um trabalho')
      .addStringOption(o => o.setName('trabalho').setDescription('ID do trabalho').setRequired(true)
        .addChoices(...JOBS.map(j => ({ name: `${j.emoji} ${j.name} - ${j.desc}`, value: j.id }))))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const user = getUser(interaction.user.id);

    if (sub === 'pets') {
      const petList = PETS.map(p => `${p.emoji} **${p.name}** — ${p.desc}\n💰 Preço: ${p.price.toLocaleString('pt-BR')} moedas`).join('\n\n');
      const embed = new EmbedBuilder()
        .setColor('#e91e63')
        .setTitle('🐾 Loja de Pets')
        .setDescription(petList)
        .setFooter({ text: `Seu saldo: ${(user.coins || 0).toLocaleString('pt-BR')} moedas | Use /loja comprar_pet` });
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'trabalhos') {
      const jobList = JOBS.map(j => `${j.emoji} **${j.name}** — ${j.desc}`).join('\n\n');
      const embed = new EmbedBuilder()
        .setColor('#2196f3')
        .setTitle('💼 Trabalhos Disponíveis')
        .setDescription(jobList + '\n\n✅ Trabalhos são gratuitos! Use /loja escolher_trabalho')
        .setFooter({ text: `Trabalho atual: ${user.job || 'Nenhum'}` });
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'comprar_pet') {
      const petId = interaction.options.getString('pet');
      const pet = PETS.find(p => p.id === petId);
      if (!pet) return interaction.reply({ content: '❌ Pet inválido!', ephemeral: true });

      if (user.pet === petId) return interaction.reply({ content: '❌ Você já tem esse pet!', ephemeral: true });

      const discount = user.pet === 'dog' ? 0.9 : 1;
      const price = Math.floor(pet.price * discount);

      if (user.coins < price) {
        return interaction.reply({ content: `❌ Saldo insuficiente! Você precisa de **${price.toLocaleString('pt-BR')}** moedas.`, ephemeral: true });
      }

      user.coins -= price;
      user.pet = petId;
      saveUser(interaction.user.id, user);

      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#4caf50')
          .setTitle('🐾 Pet Adquirido!')
          .setDescription(`Você comprou o ${pet.emoji} **${pet.name}**!\n✨ Bônus: ${pet.desc}`)
          .addFields({ name: '💰 Saldo Restante', value: `${user.coins.toLocaleString('pt-BR')} moedas`, inline: true })
        ]
      });
    }

    if (sub === 'escolher_trabalho') {
      const jobId = interaction.options.getString('trabalho');
      const job = JOBS.find(j => j.id === jobId);
      if (!job) return interaction.reply({ content: '❌ Trabalho inválido!', ephemeral: true });

      user.job = jobId;
      saveUser(interaction.user.id, user);

      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#2196f3')
          .setTitle('💼 Trabalho Escolhido!')
          .setDescription(`Você agora é um ${job.emoji} **${job.name}**!\n✨ Bônus: ${job.desc}`)
        ]
      });
    }
  }
};
