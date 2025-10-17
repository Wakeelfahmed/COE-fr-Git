const mongoose = require('mongoose');

const trainingsConductedSchema = new mongoose.Schema({
  attendees: {
    type: String,
    required: true,
    trim: true
  },
  numberOfAttendees: {
    type: Number,
    required: false,
    min: 0
  },
  organizer: {
    type: String,
    required: true,
    trim: true
  },
  resourcePersons: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  targetSDG: {
    type: [String],
    required: false,
    trim: true
  },
  totalRevenueGenerated: {
    type: Number,
    required: false,
    min: 0
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

module.exports = mongoose.model('TrainingsConducted', trainingsConductedSchema);
