const TelegramBot = require('node-telegram-bot-api');
const connectToDatabase = require('../db/connect');
const setupHandlers = require('../bot/handler');
const { restoreScheduledEvents } = require('../bot/scheduler');

const token = process.env.TELEGRAM_TOKEN;
if (!token) throw new Error('❌ TELEGRAM_TOKEN não definido no .env');

const bot = new TelegramBot(token, { polling: true });
const agendamentos = new Map();

(async () => {
  await connectToDatabase();
  await restoreScheduledEvents(bot, agendamentos);
  setupHandlers(bot, agendamentos);
})();
