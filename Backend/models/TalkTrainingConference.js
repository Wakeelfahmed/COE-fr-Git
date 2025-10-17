const mongoose = require('mongoose');

const talkTrainingConferenceSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['Talk', 'Training', 'Conference'],
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  participants: {
    type: String,
    required: true,
    trim: true
  },
  mode: {
    type: String,
    required: true,
    enum: ['Onsite', 'Online'],
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  agenda: {
    type: String,
    required: false,
    trim: true
  },
  followUpActivity: {
    type: String,
    required: false,
    trim: true
  },
  resourcePerson: {
    type: String,
    required: true,
    trim: true
  },
  targetSDG: [{
    type: String,
    required: false
  }],
  fileLink: {
    type: String,
    required: false,
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

module.exports = mongoose.model('TalkTrainingConference', talkTrainingConferenceSchema);
