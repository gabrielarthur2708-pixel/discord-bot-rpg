const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Bot online como ${client.user.tag}`);
    client.user.setActivity('🎮 /ajuda | Bot RPG', { type: 3 });

    // Register slash commands
    const commands = [];
    const commandsPath = path.join(__dirname, '..', 'commands');
    const commandFolders = fs.readdirSync(commandsPath);
    for (const folder of commandFolders) {
      const folderPath = path.join(commandsPath, folder);
      const commandFiles = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));
      for (const file of commandFiles) {
        const command = require(path.join(folderPath, file));
        if (command.data) commands.push(command.data.toJSON());
      }
    }

    const rest = new REST().setToken(process.env.DISCORD_TOKEN);
    try {
      if (process.env.GUILD_ID) {
        await rest.put(
          Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID),
          { body: commands }
        );
        console.log(`✅ ${commands.length} comandos registrados no servidor ${process.env.GUILD_ID} (instantâneo)`);
      } else {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log(`✅ ${commands.length} comandos registrados globalmente (pode demorar até 1h para aparecer)`);
      }
    } catch (err) {
      console.error('Erro ao registrar comandos:', err);
    }
  }
};
