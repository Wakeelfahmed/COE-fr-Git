const mongoose = require('mongoose');

const CustomReportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sourceType: {
    type: String,
    required: true,
    enum: ['Publications', 'Events', 'CommercializationProjects', 'Fundings', 'Internships', 'Patents', 'Trainings']
  },
  filterCriteria: {
    type: Object,
    required: true
  },
  reportData: {
    type: [mongoose.Schema.Types.Mixed],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CustomReport', CustomReportSchema);