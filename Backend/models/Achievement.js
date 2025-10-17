const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  event: {
    type: String,
    required: true,
    trim: true
  },
  organizer: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  participantOfEvent: {
    type: String,
    required: true,
    trim: true
  },
  participantFromCoEAI: {
    type: String,
    required: true,
    trim: true
  },
  roleOfParticipantFromCoEAI: {
    type: String,
    required: true,
    trim: true
  },
  detailsOfAchievement: {
    type: String,
    required: true,
    trim: true
  },
  fileLink: {
    type: String,
    required: false
  },
  createdBy: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    }
  }
}, {
  timestamps: true
});

const Achievement = mongoose.model('Achievement', achievementSchema);

module.exports = Achievement;
