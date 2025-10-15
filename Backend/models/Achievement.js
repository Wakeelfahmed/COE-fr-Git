const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Award',
      'Recognition',
      'Milestone',
      'Competition Win',
      'Grant Received',
      'Publication Milestone',
      'Technology Transfer',
      'Other'
    ]
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  achievedBy: {
    type: String,
    required: true,
    trim: true
  },
  dateAchieved: {
    type: Date,
    required: true
  },
  awardingBody: {
    type: String,
    required: false,
    trim: true
  },
  significance: {
    type: String,
    required: false,
    enum: ['International', 'National', 'Regional', 'Institutional', '']
  },
  fileLink: {
    type: String,
    required: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const Achievement = mongoose.model('Achievement', achievementSchema);

module.exports = Achievement;
