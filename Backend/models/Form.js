// models/Form.js
const mongoose = require('mongoose');

const formSchema = new mongoose.Schema({
  name: String,
  category: String,
  lastUpdated: Date,
  downloadLink: String
});

module.exports = mongoose.model('Form', formSchema);