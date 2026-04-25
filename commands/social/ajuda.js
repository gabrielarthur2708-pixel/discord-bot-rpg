const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ajuda')
    .setDescription('📚 Lista todos os comandos'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('📚 Comandos do Bot RPG')
      .setDescription('Bem-vindo ao Bot RPG! Aqui estão todos os comandos disponíveis:')
      .addFields(
        {
          name: '💰 Economia & Aventura',
          value: [
            '`/pescar` — 🎣 Pescar e ganhar moedas',
            '`/cacar` — 🏹 Caçar animais na floresta',
            '`/fazenda plantar/ver/colher` — 🌾 Gerenciar sua fazenda',
            '`/cassino slot/moeda/roleta` — 🎰 Jogar no cassino',
            '`/recompensa diaria/semanal` — 🎁 Coletar recompensas',
            '`/loja pets/trabalhos/comprar_pet/escolher_trabalho` — 🛒 Loja',
          ].join('\n')
        },
        {
          name: '⚔️ PvP & Social',
          value: [
            '`/pvp @usuario` — ⚔️ Desafiar alguém para duelo',
            '`/interacao abracar/beijar/rir/bater/dormir` — 💬 Interações',
          ].join('\n')
        },
        {
          name: '📊 Perfil & Rankings',
          value: [
            '`/perfil [@usuario]` — 📊 Ver perfil',
            '`/ranking coins/aura` — 🏆 Ver rankings',
          ].join('\n')
        },
        {
          name: '👑 Admin',
          value: [
            '`/mod ban/kick/mute/avisar/avisos` — 🛡️ Moderação',
            '`/sorteio criar` — 🎉 Criar sorteio',
            '`/admin dar_moedas/remover_moedas/resetar` — 💰 Controle de economia',
          ].join('\n')
        }
      )
      .setFooter({ text: 'Bot RPG • Use os comandos para jogar!' });

    return interaction.reply({ embeds: [embed] });
  }
};
