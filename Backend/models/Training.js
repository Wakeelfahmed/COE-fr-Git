// models/Training.js
const mongoose = require('mongoose');

const trainingSchema = new mongoose.Schema({
  title: String,
  trainer: String,
  startDate: Date,
  endDate: Date,
  participants: [String],
  description: String,
  fileLink: String  
});

module.exports = mongoose.model('Training', trainingSchema);
