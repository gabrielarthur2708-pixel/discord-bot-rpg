module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try { await command.execute(interaction, client); }
      catch (err) {
        console.error(`Erro ${interaction.commandName}:`, err);
        const r = { content: '❌ Erro ao executar!', ephemeral: true };
        if (interaction.replied || interaction.deferred) await interaction.followUp(r).catch(()=>{});
        else await interaction.reply(r).catch(()=>{});
      }
      return;
    }
    if (interaction.isStringSelectMenu()) {
      const [action,...args] = interaction.customId.split(':');
      try {
        if (action==='farm_plant') { const h=require('../handlers/farmHandler'); await h.handleSelect(interaction,args); }
      } catch(err) { await interaction.reply({content:'❌ Erro!',ephemeral:true}).catch(()=>{}); }
      return;
    }
    if (interaction.isButton()) {
      const [action,...args] = interaction.customId.split(':');
      try {
        if (action==='fish_keep'||action==='fish_sell') { const h=require('../handlers/fishHandler'); await h.handleButton(interaction,action,args); }
        else if (action==='pvp_accept'||action==='pvp_decline') { const h=require('../handlers/pvpHandler'); await h.handleButton(interaction,action,args); }
        else if (action==='giveaway_join') { const h=require('../handlers/giveawayHandler'); await h.handleButton(interaction,action,args); }
        else if (action==='inv_sell_all') { const h=require('../handlers/fishHandler'); await h.handleSellAll(interaction,args); }
        else if (action==='adm_menu') { const {handleAdmButton}=require('../commands/admin/adm'); await handleAdmButton(interaction); }
        else if (action==='adm_action') { const {handleAdmAction}=require('../commands/admin/adm'); await handleAdmAction(interaction); }
      } catch(err) { console.error('Button:',err); await interaction.reply({content:'❌ Erro!',ephemeral:true}).catch(()=>{}); }
      return;
    }
    if (interaction.isModalSubmit()) {
      const [action] = interaction.customId.split(':');
      try {
        if (action==='adm_modal') { const {handleAdmModal}=require('../commands/admin/adm'); await handleAdmModal(interaction); }
      } catch(err) { console.error('Modal:',err); await interaction.reply({content:'❌ Erro!',ephemeral:true}).catch(()=>{}); }
      return;
    }
  }
};
