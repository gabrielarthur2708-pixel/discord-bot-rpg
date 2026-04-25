const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // Slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction, client);
      } catch (err) {
        console.error(`Erro no comando ${interaction.commandName}:`, err);
        const reply = { content: '❌ Ocorreu um erro ao executar esse comando!', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply).catch(() => {});
        } else {
          await interaction.reply(reply).catch(() => {});
        }
      }
    }

    // Select menu interactions
    if (interaction.isStringSelectMenu()) {
      const [action, ...args] = interaction.customId.split(':');
      try {
        if (action === 'farm_plant') {
          const farmHandler = require('../handlers/farmHandler');
          await farmHandler.handleSelect(interaction, args);
        }
      } catch (err) {
        console.error('Erro no select handler:', err);
        await interaction.reply({ content: '❌ Erro ao processar seleção!', ephemeral: true }).catch(() => {});
      }
      return;
    }

    // Button interactions
    if (interaction.isButton()) {
      const [action, ...args] = interaction.customId.split(':');
      
      try {
        if (action === 'fish_keep' || action === 'fish_sell') {
          const fishHandler = require('../handlers/fishHandler');
          await fishHandler.handleButton(interaction, action, args);
        } else if (action === 'pvp_accept' || action === 'pvp_decline') {
          const pvpHandler = require('../handlers/pvpHandler');
          await pvpHandler.handleButton(interaction, action, args);
        } else if (action === 'giveaway_join') {
          const giveawayHandler = require('../handlers/giveawayHandler');
          await giveawayHandler.handleButton(interaction, action, args);
        } else if (action === 'farm_collect') {
          const farmHandler = require('../handlers/farmHandler');
          await farmHandler.handleButton(interaction, action, args);
        }
      } catch (err) {
        console.error('Erro no button handler:', err);
        await interaction.reply({ content: '❌ Erro ao processar ação!', ephemeral: true }).catch(() => {});
      }
    }
  }
};
