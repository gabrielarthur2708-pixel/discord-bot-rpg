const { REST, Routes, ActivityType, PresenceUpdateStatus } = require('discord.js');
const fs = require('fs');
const path = require('path');

const STATUSES = [
  { name: '✨ /ajuda • RPG mágico', type: ActivityType.Playing },
  { name: '🎣 pescaria com os jogadores', type: ActivityType.Playing },
  { name: '🏹 caçadas épicas na floresta', type: ActivityType.Watching },
  { name: '🌾 a fazenda crescer', type: ActivityType.Watching },
  { name: '🎰 o cassino girar', type: ActivityType.Watching },
  { name: '⚔️ batalhas PvP intensas', type: ActivityType.Competing },
  { name: '💰 milhões de moedas', type: ActivityType.Watching },
  { name: '🐉 lendas do reino', type: ActivityType.Listening },
  { name: '👑 /perfil • mostre seu poder', type: ActivityType.Playing },
  { name: '🌙 sussurros da Lúmen', type: ActivityType.Listening },
];

const BOT_BIO = `✨ Olá! Eu sou a **Lúmen** ✨

🎮 Bot RPG completo com economia, pets, trabalhos, fazenda, pesca, caça, cassino, PvP e muito mais!

💫 Use \`/ajuda\` no servidor para começar sua aventura.
🌙 Sempre por aqui pra ajudar — é só me mencionar!

— Made with ❤️ —`;

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Bot online como ${client.user.tag}`);

    client.user.setStatus(PresenceUpdateStatus.Online);

    let i = 0;
    const rotate = () => {
      const s = STATUSES[i % STATUSES.length];
      client.user.setPresence({
        activities: [{ name: s.name, type: s.type }],
        status: PresenceUpdateStatus.Online,
      });
      i++;
    };
    rotate();
    setInterval(rotate, 45 * 1000);

    try {
      await client.application.fetch();
      if (client.application.description !== BOT_BIO) {
        await client.application.edit({ description: BOT_BIO });
        console.log('✨ Bio do bot atualizada');
      }
    } catch (err) {
      console.error('Não consegui atualizar a bio:', err.message);
    }

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
        console.log(`✅ ${commands.length} comandos registrados globalmente (pode demorar até 1h)`);
      }
    } catch (err) {
      console.error('Erro ao registrar comandos:', err);
    }
  }
};
