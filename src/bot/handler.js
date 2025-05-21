const Event = require('../models/event');
const { scheduleEvent, cancelScheduledEvent } = require('./scheduler');
const { filtrarEventos } = require('./utils');
const getWeather = require('../utils/weather');

const EVENTS_PER_PAGE = 2;

function setupHandlers(bot, agendamentos) {
  const estados = new Map(); // chatId -> { etapa, dados }

  // /start com botões de ação
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    const texto = `👋 *Olá! Sou seu assistente de lembretes.*\n\nEscolha uma opção abaixo:`;

    bot.sendMessage(chatId, texto, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '➕ Novo Evento', callback_data: 'menu_novo' },
            { text: '📅 Meus Eventos', callback_data: 'menu_eventos' }
          ],
          [{ text: '🌦️ Previsão do Tempo', callback_data: 'menu_tempo' }]
        ]
      }
    });
  });

  // Comando direto para criar evento
  bot.onText(/\/evento (.+)\s\|\s(.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const mensagem = match[1].trim();
    const data = new Date(match[2].trim());

    if (isNaN(data.getTime())) {
      return bot.sendMessage(chatId, '❌ Data inválida. Use: /evento <mensagem> | <AAAA-MM-DD HH:MM>');
    }

    const evento = new Event({ chatId, message: mensagem, date: data });
    await evento.save();
    scheduleEvent(bot, evento, agendamentos);

    bot.sendMessage(chatId, `✅ Evento agendado para ${data.toLocaleString()}`);
  });

  // Comando /meuseventos (abre menu de filtros)
  bot.onText(/\/meuseventos/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, '📅 Ver eventos:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📆 Hoje', callback_data: 'filter_hoje' }],
          [{ text: '📅 Amanhã', callback_data: 'filter_amanha' }],
          [{ text: '📖 Todos', callback_data: 'filter_todos' }]
        ]
      }
    });
  });

  // Callback para botões interativos
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    
    bot.answerCallbackQuery(query.id).catch(() => {});

  if (data === 'menu_tempo') {
    bot.sendMessage(chatId, 'Digite o comando:\n/tempo <nome da cidade>\nEx: /tempo Rio de Janeiro');
  }

    // Navegar pelos menus

    if (data === 'menu_novo') {
      bot.answerCallbackQuery(query.id);
      estados.set(chatId, { etapa: 'descricao' });
      return bot.sendMessage(chatId, '📝 Qual a descrição do evento?');
    }

    // Filtro de eventos + paginação
    if (data.startsWith('filter_') || data.startsWith('nav_')) {
      const [_, filtro, pagina = '1'] = data.split('_');
      const eventos = await Event.find({ chatId, date: { $gte: new Date() } }).sort('date');
      const filtrados = filtrarEventos(eventos, filtro);
      const page = parseInt(pagina);
      const totalPages = Math.ceil(filtrados.length / EVENTS_PER_PAGE);
      const offset = (page - 1) * EVENTS_PER_PAGE;
      const pageData = filtrados.slice(offset, offset + EVENTS_PER_PAGE);

      for (const evento of pageData) {
        const texto = `📅 *Evento:*\n📝 ${evento.message}\n🕒 ${evento.date.toLocaleString()}`;
        await bot.sendMessage(chatId, texto, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '🗑️ Excluir', callback_data: `delete_${evento._id}` }]]
          }
        });
      }

      const nav = [];
      if (page > 1) nav.push({ text: '⬅️', callback_data: `nav_${filtro}_${page - 1}` });
      if (page < totalPages) nav.push({ text: '➡️', callback_data: `nav_${filtro}_${page + 1}` });

      if (totalPages > 1) {
        await bot.sendMessage(chatId, `📖 Página ${page} de ${totalPages}`, {
          reply_markup: { inline_keyboard: [nav] }
        });
      }

      return bot.answerCallbackQuery(query.id);
    }

    // Exclusão de evento
    if (data.startsWith('delete_')) {
      const id = data.replace('delete_', '');
      const evento = await Event.findById(id);

      if (!evento) {
        return bot.answerCallbackQuery(query.id, { text: '❌ Evento já removido.' });
      }

      cancelScheduledEvent(id, agendamentos);
      await Event.deleteOne({ _id: id });

      bot.editMessageText(`🗑️ Evento removido: *${evento.message}*`, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'Markdown'
      });

      return bot.answerCallbackQuery(query.id, { text: '✅ Evento excluído!' });
    }
  });

  // Criação de evento guiada (mensagem comum)
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const estado = estados.get(chatId);
    if (!estado || msg.text.startsWith('/')) return;

    if (estado.etapa === 'descricao') {
      estados.set(chatId, { etapa: 'data', descricao: msg.text });
      return bot.sendMessage(chatId, '📅 Agora me diga a data e hora (ex: 2025-06-01 14:30)');
    }

    if (estado.etapa === 'data') {
      const data = new Date(msg.text);
      if (isNaN(data.getTime())) {
        return bot.sendMessage(chatId, '❌ Data inválida. Tente no formato: 2025-06-01 14:30');
      }

      const evento = new Event({
        chatId,
        message: estado.descricao,
        date: data
      });

      await evento.save();
      scheduleEvent(bot, evento, agendamentos);

      estados.delete(chatId);
      return bot.sendMessage(chatId, `✅ Evento agendado para ${data.toLocaleString()}`);
    }
  });

  // Comando /tempo <cidade>
    bot.onText(/\/tempo (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const cidade = match[1].trim();
      try {
        const getWeather = require('../utils/weather');
        const previsao = await getWeather(cidade);
        bot.sendMessage(chatId, previsao);
      } catch (error) {
        bot.sendMessage(chatId, '❌ Não foi possível obter o tempo. Verifique o nome da cidade.');
      }
    });
}

module.exports = setupHandlers;
