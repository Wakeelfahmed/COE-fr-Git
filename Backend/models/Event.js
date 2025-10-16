const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  activity: {
    type: String,
    required: true,
    trim: true
  },
  organizer: {
    type: String,
    required: true,
    trim: true
  },
  resourcePerson: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    trim: true
  },
  otherRole: {
    type: String,
    required: false,
    trim: true
  },
  type: {
    type: String,
    required: true,
    trim: true
  },
  participantsOfEvent: {
    type: String,
    required: true,
    trim: true
  },
  nameOfAttendee: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);