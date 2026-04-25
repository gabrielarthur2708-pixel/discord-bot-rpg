const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { getUser, saveUser, loadDB, saveDB, getAllUsers } = require('../../utils/database');
const { PETS, JOBS, FISH_RARITIES, HUNT_ANIMALS, addXP } = require('../../utils/helpers');

const SENHA = 'adm202539';
const authSessions = new Map();

function isAuthed(userId) {
  const session = authSessions.get(userId);
  if (!session) return false;
  if (Date.now() - session > 10 * 60 * 1000) { authSessions.delete(userId); return false; }
  return true;
}

function getMainMenu() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('adm_menu:coins').setLabel('💰 Moedas').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('adm_menu:items').setLabel('🎁 Itens & Pets').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('adm_menu:user').setLabel('👤 Usuário').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('adm_menu:slave').setLabel('🤖 Escravo').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('adm_menu:server').setLabel('📊 Servidor').setStyle(ButtonStyle.Secondary),
    )
  ];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('adm')
    .setDescription('👑 Painel Administrativo')
    .addStringOption(o => o.setName('senha').setDescription('Senha de acesso').setRequired(true)),

  async execute(interaction) {
    const senha = interaction.options.getString('senha');
    if (senha !== SENHA) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor('#e74c3c').setTitle('❌ Acesso Negado').setDescription('Senha incorreta!')], ephemeral: true });
    }
    authSessions.set(interaction.user.id, Date.now());
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor('#f1c40f').setTitle('👑 Painel Administrativo').setDescription('Bem-vindo! Escolha uma categoria:').setFooter({ text: 'Sessão válida por 10 minutos' })],
      components: getMainMenu(), ephemeral: true
    });
  }
};

async function handleAdmButton(interaction) {
  const userId = interaction.user.id;
  if (!isAuthed(userId)) return interaction.reply({ content: '❌ Sessão expirada! Use `/adm` novamente.', ephemeral: true });
  const [, action] = interaction.customId.split(':');

  if (action === 'coins') {
    return interaction.update({ embeds: [new EmbedBuilder().setColor('#f1c40f').setTitle('💰 Moedas').setDescription('Escolha:')], components: [new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('adm_action:dar_coins').setLabel('➕ Dar').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('adm_action:tirar_coins').setLabel('➖ Tirar').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('adm_action:definir_coins').setLabel('🔢 Definir').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('adm_action:dar_coins_todos').setLabel('🌍 Dar a Todos').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('adm_menu:back').setLabel('◀️ Voltar').setStyle(ButtonStyle.Secondary),
    )] });
  }
  if (action === 'items') {
    return interaction.update({ embeds: [new EmbedBuilder().setColor('#9b59b6').setTitle('🎁 Itens').setDescription('Escolha:')], components: [new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('adm_action:dar_pet').setLabel('🐾 Pet').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('adm_action:dar_trabalho').setLabel('💼 Trabalho').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('adm_action:dar_peixe').setLabel('🐟 Peixe').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('adm_action:dar_xp').setLabel('⭐ XP').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('adm_menu:back').setLabel('◀️ Voltar').setStyle(ButtonStyle.Secondary),
    )] });
  }
  if (action === 'user') {
    return interaction.update({ embeds: [new EmbedBuilder().setColor('#3498db').setTitle('👤 Usuário').setDescription('Escolha:')], components: [new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('adm_action:ver_usuario').setLabel('🔍 Ver').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('adm_action:resetar').setLabel('🔄 Resetar').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('adm_action:soltar_preso').setLabel('🔓 Soltar').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('adm_action:dar_nivel').setLabel('🏆 Nível').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('adm_menu:back').setLabel('◀️ Voltar').setStyle(ButtonStyle.Secondary),
    )] });
  }
  if (action === 'slave') {
    return interaction.update({ embeds: [new EmbedBuilder().setColor('#e74c3c').setTitle('🤖 Escravo').setDescription('Escolha:')], components: [new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('adm_action:escravo_ativar').setLabel('✅ Ativar').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('adm_action:escravo_desativar').setLabel('❌ Desativar').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('adm_menu:back').setLabel('◀️ Voltar').setStyle(ButtonStyle.Secondary),
    )] });
  }
  if (action === 'server') {
    await interaction.deferUpdate();
    const users = Object.values(getAllUsers());
    const total = users.reduce((a, u) => a + (u.coins || 0), 0);
    return interaction.editReply({ embeds: [new EmbedBuilder().setColor('#f1c40f').setTitle('📊 Servidor').addFields(
      { name: '👥 Jogadores', value: `${users.length}`, inline: true },
      { name: '💰 Total', value: total.toLocaleString('pt-BR'), inline: true },
      { name: '💵 Média', value: Math.floor(total / (users.length || 1)).toLocaleString('pt-BR'), inline: true },
    )], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('adm_menu:back').setLabel('◀️ Voltar').setStyle(ButtonStyle.Secondary))] });
  }
  if (action === 'back') {
    return interaction.update({ embeds: [new EmbedBuilder().setColor('#f1c40f').setTitle('👑 Painel Admin').setDescription('Escolha uma categoria:')], components: getMainMenu() });
  }
}

async function handleAdmAction(interaction) {
  if (!isAuthed(interaction.user.id)) return interaction.reply({ content: '❌ Sessão expirada!', ephemeral: true });
  const [, action] = interaction.customId.split(':');
  const titles = { dar_coins: '💰 Dar Moedas', tirar_coins: '💸 Tirar Moedas', definir_coins: '💵 Definir Moedas', dar_coins_todos: '🌍 Dar a Todos', dar_xp: '⭐ XP', dar_nivel: '🏆 Nível', dar_pet: '🐾 Pet', dar_trabalho: '💼 Trabalho', dar_peixe: '🐟 Peixe', resetar: '🔄 Resetar', ver_usuario: '🔍 Ver', soltar_preso: '🔓 Soltar', escravo_ativar: '🤖 Ativar', escravo_desativar: '🔓 Desativar' };
  const modal = new ModalBuilder().setCustomId(`adm_modal:${action}`).setTitle(titles[action] || 'Admin');
  const components = [];
  if (action !== 'dar_coins_todos') components.push(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('user_id').setLabel('ID do usuário').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('123456789012345678')));
  if (['dar_coins','tirar_coins','definir_coins','dar_coins_todos','dar_xp','dar_nivel','dar_pet','dar_trabalho','dar_peixe'].includes(action)) components.push(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('value').setLabel('Valor').setStyle(TextInputStyle.Short).setRequired(true)));
  if (components.length === 0) components.push(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('user_id').setLabel('ID do usuário').setStyle(TextInputStyle.Short).setRequired(true)));
  modal.addComponents(...components);
  return interaction.showModal(modal);
}

async function handleAdmModal(interaction) {
  if (!isAuthed(interaction.user.id)) return interaction.reply({ content: '❌ Sessão expirada!', ephemeral: true });
  const [, action] = interaction.customId.split(':');
  let targetId = null, value = null;
  try { targetId = interaction.fields.getTextInputValue('user_id').replace(/[<@!>]/g, '').trim(); } catch {}
  try { value = interaction.fields.getTextInputValue('value').trim(); } catch {}
  await interaction.deferReply({ ephemeral: true });
  try {
    if (action === 'dar_coins') { const u = getUser(targetId); u.coins = (u.coins||0)+parseInt(value); saveUser(targetId,u); return interaction.editReply(`✅ +${parseInt(value).toLocaleString('pt-BR')} moedas! Saldo: ${u.coins.toLocaleString('pt-BR')}`); }
    if (action === 'tirar_coins') { const u = getUser(targetId); u.coins = Math.max(0,(u.coins||0)-parseInt(value)); saveUser(targetId,u); return interaction.editReply(`✅ -${parseInt(value).toLocaleString('pt-BR')} moedas! Saldo: ${u.coins.toLocaleString('pt-BR')}`); }
    if (action === 'definir_coins') { const u = getUser(targetId); u.coins = parseInt(value); saveUser(targetId,u); return interaction.editReply(`✅ Saldo definido: ${parseInt(value).toLocaleString('pt-BR')}`); }
    if (action === 'dar_coins_todos') { const db=loadDB('users'); let c=0; for(const id in db){db[id].coins=(db[id].coins||0)+parseInt(value);c++;} saveDB('users',db); return interaction.editReply(`✅ +${parseInt(value).toLocaleString('pt-BR')} para ${c} jogadores!`); }
    if (action === 'dar_xp') { const u = getUser(targetId); const lv = addXP(u, parseInt(value)); saveUser(targetId,u); return interaction.editReply(`✅ +${value} XP!${lv?` Nível ${u.level}!`:''}`); }
    if (action === 'dar_nivel') { const u = getUser(targetId); u.level=parseInt(value);u.xp=0; saveUser(targetId,u); return interaction.editReply(`✅ Nível ${value}!`); }
    if (action === 'dar_pet') { const pet=PETS.find(p=>p.id===value||p.name.toLowerCase()===value.toLowerCase()); if(!pet) return interaction.editReply(`❌ Pets: ${PETS.map(p=>p.id).join(', ')}`); const u=getUser(targetId);u.pet=pet.id;saveUser(targetId,u); return interaction.editReply(`✅ ${pet.emoji} ${pet.name} dado!`); }
    if (action === 'dar_trabalho') { const job=JOBS.find(j=>j.id===value||j.name.toLowerCase()===value.toLowerCase()); if(!job) return interaction.editReply(`❌ Trabalhos: ${JOBS.map(j=>j.id).join(', ')}`); const u=getUser(targetId);u.job=job.id;saveUser(targetId,u); return interaction.editReply(`✅ ${job.emoji} ${job.name} dado!`); }
    if (action === 'dar_peixe') { const f=FISH_RARITIES.find(f=>f.name.toLowerCase()===value.toLowerCase()); if(!f) return interaction.editReply(`❌ Raridades: ${FISH_RARITIES.map(f=>f.name).join(', ')}`); const u=getUser(targetId);u.fish_inventory=u.fish_inventory||[];u.fish_inventory.push({name:f.name,emoji:f.emoji,value:f.max,timestamp:Date.now()});saveUser(targetId,u); return interaction.editReply(`✅ ${f.emoji} ${f.name} dado!`); }
    if (action === 'resetar') { const db=loadDB('users');delete db[targetId];saveDB('users',db); return interaction.editReply('✅ Usuário resetado!'); }
    if (action === 'ver_usuario') { const u=getUser(targetId);const pet=PETS.find(p=>p.id===u.pet);const job=JOBS.find(j=>j.id===u.job); return interaction.editReply({embeds:[new EmbedBuilder().setColor('#f39c12').setTitle('🔍 Dados').addFields({name:'💰',value:`${(u.coins||0).toLocaleString('pt-BR')}`,inline:true},{name:'⭐',value:`Nv${u.level||1}`,inline:true},{name:'🐾',value:pet?`${pet.emoji}${pet.name}`:'Nenhum',inline:true},{name:'💼',value:job?job.name:'Nenhum',inline:true},{name:'🤖',value:u.slave_mode?'✅':'❌',inline:true})]}); }
    if (action === 'soltar_preso') { const u=getUser(targetId);u.jail_until=null;saveUser(targetId,u); return interaction.editReply('✅ Solto!'); }
    if (action === 'escravo_ativar') { const u=getUser(targetId);u.slave_mode=true;saveUser(targetId,u); try{const t=await interaction.client.users.fetch(targetId);await t.send('🤖 Modo especial ativado! Me mencione e peça ações automáticas! Ex: `@Lúmen faz tudo pra mim`').catch(()=>{});}catch{} return interaction.editReply('✅ Escravo ativado!'); }
    if (action === 'escravo_desativar') { const u=getUser(targetId);u.slave_mode=false;saveUser(targetId,u); return interaction.editReply('✅ Escravo desativado!'); }
  } catch(err) { return interaction.editReply('❌ Erro! Verifique o ID do usuário.'); }
}

module.exports.handleAdmButton = handleAdmButton;
module.exports.handleAdmAction = handleAdmAction;
module.exports.handleAdmModal = handleAdmModal;
