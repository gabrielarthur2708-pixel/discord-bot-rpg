# 🤖 Bot RPG Discord — Guia Completo

## ⚠️ IMPORTANTE: Reset seu Token!
Você compartilhou seu token publicamente. **Resete-o imediatamente:**
1. Acesse https://discord.com/developers/applications
2. Selecione seu bot → "Bot" → "Reset Token"
3. Copie o novo token

---

## 📁 Estrutura do Projeto

```
discord-bot/
├── index.js                    # Arquivo principal
├── package.json
├── .env.example                # Template do .env
├── commands/
│   ├── economy/
│   │   ├── pescar.js           # 🎣 Pesca
│   │   ├── cacar.js            # 🏹 Caça
│   │   ├── fazenda.js          # 🌾 Fazenda
│   │   ├── cassino.js          # 🎰 Cassino
│   │   ├── recompensa.js       # 🎁 Daily/Weekly
│   │   └── loja.js             # 🛒 Pets & Trabalhos
│   ├── pvp/
│   │   └── pvp.js              # ⚔️ PvP
│   ├── social/
│   │   ├── perfil.js           # 📊 Perfil
│   │   ├── ranking.js          # 🏆 Rankings
│   │   ├── interacao.js        # 💬 Interações sociais
│   │   └── ajuda.js            # 📚 Ajuda
│   └── admin/
│       ├── mod.js              # 🛡️ Moderação
│       ├── sorteio.js          # 🎉 Sorteios
│       └── admin.js            # 👑 Admin economia
├── events/
│   ├── ready.js
│   ├── interactionCreate.js
│   └── messageCreate.js
├── handlers/
│   ├── fishHandler.js
│   ├── farmHandler.js
│   ├── pvpHandler.js
│   └── giveawayHandler.js
└── utils/
    ├── database.js
    └── helpers.js
```

---

## 🚀 Como Rodar Localmente

### 1. Instalar Node.js
- Baixe em: https://nodejs.org (versão 18+)

### 2. Instalar dependências
```bash
cd discord-bot
npm install
```

### 3. Configurar o .env
```bash
# Crie o arquivo .env na pasta do bot
DISCORD_TOKEN=SEU_TOKEN_AQUI
```

### 4. Rodar o bot
```bash
npm start
```

---

## ☁️ Como Manter Online 24/7

### Opção 1: Railway (Recomendado — Gratuito)
1. Acesse https://railway.app
2. Crie conta → "New Project" → "Deploy from GitHub"
3. Faça upload do código (ou conecte o GitHub)
4. Em "Variables", adicione: `DISCORD_TOKEN = seu_token`
5. Deploy automático!

### Opção 2: Render (Gratuito)
1. Acesse https://render.com
2. "New" → "Web Service"
3. Conecte seu repositório GitHub
4. Build Command: `npm install`
5. Start Command: `node index.js`
6. Adicione a variável `DISCORD_TOKEN`

### Opção 3: VPS (Mais estável)
```bash
# Instale PM2 para manter rodando
npm install -g pm2
pm2 start index.js --name "discord-bot"
pm2 save
pm2 startup
```

### Opção 4: Replit
1. Acesse https://replit.com
2. Crie um novo Repl → "Import from GitHub" ou cole o código
3. Adicione `DISCORD_TOKEN` nos Secrets
4. Use UptimeRobot para manter o bot online

---

## 🔧 Configurações no Discord Developer Portal

### Intents necessárias:
- ✅ SERVER MEMBERS INTENT
- ✅ MESSAGE CONTENT INTENT
- ✅ PRESENCE INTENT

### Permissões do bot:
- Administrator (para todas as funções funcionarem)

### URL de convite:
```
https://discord.com/api/oauth2/authorize?client_id=SEU_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

---

## 🎮 Lista de Comandos

| Comando | Descrição |
|---------|-----------|
| `/pescar` | 🎣 Pescar peixes de 5 raridades |
| `/cacar` | 🏹 Caçar animais na floresta |
| `/fazenda plantar` | 🌱 Plantar culturas |
| `/fazenda ver` | 👀 Ver suas plantas |
| `/fazenda colher` | 🌾 Colher plantas prontas |
| `/cassino slot` | 🎰 Slot machine |
| `/cassino moeda` | 🪙 Cara ou coroa |
| `/cassino roleta` | 🎡 Roleta |
| `/recompensa diaria` | 📅 +1000 moedas/dia |
| `/recompensa semanal` | 📆 +5000 moedas/semana |
| `/loja pets` | 🐾 Ver pets disponíveis |
| `/loja comprar_pet` | 💳 Comprar um pet |
| `/loja trabalhos` | 💼 Ver trabalhos |
| `/loja escolher_trabalho` | ✅ Escolher trabalho |
| `/pvp @usuario` | ⚔️ Desafiar para duelo |
| `/perfil` | 📊 Ver perfil |
| `/ranking` | 🏆 Ver ranking |
| `/interacao abracar/beijar/rir/bater/dormir` | 💬 Interações |
| `/mod ban/kick/mute/avisar/avisos` | 🛡️ Moderação (ADM) |
| `/sorteio criar` | 🎉 Criar sorteio (ADM) |
| `/admin dar_moedas` | 💰 Dar moedas (ADM) |
| `/ajuda` | 📚 Lista de comandos |

---

## 🐾 Pets & Bônus

| Pet | Preço | Bônus |
|-----|-------|-------|
| 🐱 Gato | 5.000 | +10% aura |
| 🐶 Cachorro | 4.000 | -10% preço loja |
| 🐺 Lobo | 8.000 | +15% caça |
| 🐄 Vaca | 6.000 | -20% tempo fazenda |
| 🐔 Galinha | 3.000 | +10% itens extras |
| 🐲 Dragão | 50.000 | +5% raridade pesca |
| 🔥 Fênix | 30.000 | Protege aura 1x/dia |

---

## 💼 Trabalhos & Bônus

| Trabalho | Bônus |
|----------|-------|
| 🎣 Pescador | +20% valor peixes |
| 🌾 Fazendeiro | +25% valor colheita |
| 🏹 Caçador | +20% valor caça |
| 💼 Comerciante | +15% vendas |
| 🎲 Apostador | +10% ganhos cassino |

---

## 🌸 Estações da Fazenda

As estações mudam automaticamente a cada 2 dias:
- 🌸 Primavera → Bônus: morango, alface
- ☀️ Verão → Bônus: milho, tomate, melancia
- 🍂 Outono → Bônus: abóbora, uva
- ❄️ Inverno → Bônus: cogumelo, batata

Plantas da estação atual dão **+30% de valor** na colheita!

---

## 📊 Raridades de Pesca

| Raridade | Chance | Valor |
|----------|--------|-------|
| 🐟 Gigante | 60% | 100-300 |
| 🐠 Anjo | 25% | 400-700 |
| 🦈 Arcanjo | 10% | 800-1.500 |
| 🐉 Semideus | 4% | 2.000-4.000 |
| ✨ Deus | 1% | 5.000-10.000 |

---

## ❓ Suporte

Se precisar de ajuda, abra uma issue ou entre em contato!
