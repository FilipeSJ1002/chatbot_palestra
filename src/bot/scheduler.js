const schedule = require('node-schedule');
const Event = require('../models/event');

function scheduleEvent(bot, evento, agendamentos) {
  const job = schedule.scheduleJob(evento.date, () => {
    bot.sendMessage(evento.chatId, `🔔 Lembrete: ${evento.message}`);
    agendamentos.delete(evento._id.toString());
  });

  agendamentos.set(evento._id.toString(), job);
}

async function restoreScheduledEvents(bot, agendamentos) {
  const eventos = await Event.find({ date: { $gte: new Date() } });
  eventos.forEach(evento => scheduleEvent(bot, evento, agendamentos));
  console.log(`🔁 Restaurados ${eventos.length} eventos`);
}

function cancelScheduledEvent(id, agendamentos) {
  const job = agendamentos.get(id);
  if (job) {
    job.cancel();
    agendamentos.delete(id);
  }
}

module.exports = {
  scheduleEvent,
  restoreScheduledEvents,
  cancelScheduledEvent
};
