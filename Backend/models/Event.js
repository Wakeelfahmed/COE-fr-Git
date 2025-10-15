const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['Activity', 'Training']
  },
  title: {
    type: String,
    required: true
  },
  participants: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  agenda: String,
  followUpActivity: String,
  resourcePerson: String,
  venue: String,
  totalRevenue: Number,
  createdBy: String,
  fileLink: String  
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);