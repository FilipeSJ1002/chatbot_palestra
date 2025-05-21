const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  chatId: Number,
  message: String,
  date: Date
});

module.exports = mongoose.model('Event', eventSchema);
