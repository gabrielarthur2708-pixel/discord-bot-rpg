const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('ajuda').setDescription('📚 Lista todos os comandos'),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('📚 Lista de Comandos')
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .addFields(
        { name: '💰 Economia', value: '`/pescar` 🎣 Pescar (30min)\n`/cacar` 🏹 Caçar (30min)\n`/fazenda` 🌾 Fazenda\n`/cassino` 🎰 Apostar\n`/recompensa` 🎁 Daily/Semanal\n`/roubar` 🦹 Roubar\n`/pix` 💸 Transferir moedas' },
        { name: '📊 Perfil', value: '`/perfil` 📊 Perfil completo\n`/saldo` 💰 Moedas e aura\n`/aura` ✨ Aura e título\n`/nivel` ⭐ XP e nível\n`/inventario` 🎒 Inventário\n`/ranking` 🏆 Top 10' },
        { name: '🛒 Loja', value: '`/loja pets` 🐾 Ver pets\n`/loja comprar_pet` 💳 Comprar pet\n`/loja trabalhos` 💼 Ver trabalhos\n`/loja escolher_trabalho` ✅ Escolher' },
        { name: '⚔️ PvP & Social', value: '`/pvp` ⚔️ Duelar\n`/interacao` 💬 Abraçar, beijar...\n`/sorteio` 🎉 Sorteios' },
        { name: '👑 Admin', value: '`/adm [senha]` 👑 Painel admin\n`/mod` 🛡️ Moderação' },
        { name: '🤖 IA', value: 'Mencione **@Lúmen** para conversar!\n`@Lúmen oi` `@Lúmen piada` `@Lúmen receita`\n`@Lúmen faz tudo pra mim` *(modo escravo)*\n`@Lúmen pare` *(para automático)*' },
      )
      .setFooter({ text: '📚 Lúmen • Sistema de Economia' });
    return interaction.reply({ embeds: [embed] });
  }
};
