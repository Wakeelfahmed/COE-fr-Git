const mongoose = require('mongoose');

const competitionSchema = new mongoose.Schema({
  organizer: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  participants: {
    type: String,
    required: true,
    trim: true
  },
  scope: {
    type: String,
    required: true,
    enum: ['National', 'Regional', 'International', 'Other']
  },
  scopeOther: {
    type: String,
    trim: true
  },
  participantsFromBU: {
    type: String,
    required: true,
    trim: true
  },
  prizeMoney: {
    type: Number,
    min: 0
  },
  details: {
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

module.exports = mongoose.model('Competition', competitionSchema);
