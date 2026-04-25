const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('ajuda').setDescription('📚 Lista todos os comandos'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('📚 Comandos do Bot RPG')
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .addFields(
        { name: '💰 Economia',
          value: '`/pescar` 🎣 Pescar (30min CD)\n`/cacar` 🏹 Caçar (30min CD)\n`/fazenda ver/plantar/colher` 🌾\n`/cassino slot/moeda/roleta` 🎰\n`/recompensa diaria/semanal` 🎁\n`/roubar @user` 🦹\n`/pix @user valor` 💸' },
        { name: '📊 Perfil & Social',
          value: '`/perfil` 📊 Ver perfil completo\n`/saldo` 💰 Ver moedas e aura\n`/aura` ✨ Ver aura e título\n`/nivel` ⭐ Ver XP e nível\n`/inventario` 🎒 Ver inventário\n`/ranking` 🏆 Top 10 jogadores' },
        { name: '🛒 Loja',
          value: '`/loja pets` 🐾 Ver pets\n`/loja comprar_pet` 💳 Comprar pet\n`/loja trabalhos` 💼 Ver trabalhos\n`/loja escolher_trabalho` ✅ Escolher trabalho' },
        { name: '⚔️ PvP & Diversão',
          value: '`/pvp @usuario` ⚔️ Desafiar para duelo\n`/interacao abracar/beijar/rir/bater/dormir` 💬\n`/sorteio criar` 🎉 Criar sorteio\n`/sorteio listar` 📋 Ver sorteios' },
        { name: '👑 Admin',
          value: '`/adm [senha]` 👑 Painel admin\n`/mod ban/kick/mute/avisar/avisos` 🛡️' },
        { name: '🤖 IA',
          value: 'Mencione **@Lúmen** para conversar!\nEx: `@Lúmen oi tudo bem?`\nCom modo escravo ativo:\n`@Lúmen faz tudo pra mim` — automático!\n`@Lúmen pare` — para tudo' },
      )
      .setFooter({ text: 'Bot RPG • Divirta-se! 🎮' });

    return interaction.reply({ embeds: [embed] });
  }
};
