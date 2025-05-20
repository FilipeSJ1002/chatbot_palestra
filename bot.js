const TelegramBot = require('node-telegram-bot-api');

// Substitua com o token fornecido pelo BotFather
const token = 'YOUR_TELEGRAM_BOT_TOKEN';

// Cria um bot que usa "polling" para buscar novas mensagens
const bot = new TelegramBot(token, { polling: true });

// Quando o usuário envia "/start"
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Olá! Eu sou um bot do Telegram feito com Node.js!');
});

// Quando o usuário envia qualquer outra mensagem
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Evita duplicar a resposta do comando /start
  if (text !== '/start') {
    bot.sendMessage(chatId, `Você disse: "${text}"`);
  }
});
