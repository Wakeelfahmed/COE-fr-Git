// models/patent.js
const mongoose = require('mongoose');

const patentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  pi: {
    type: String,
    required: true
  },
  team: {
    type: [String],
    required: true
  },
  patentOrg: {
    type: String,
    required: false,
    trim: true
  },
  coPi: {
    type: String,
    required: false,
    trim: true
  },
  affiliationOfCoPi: {
    type: String,
    required: false,
    trim: true
  },
  dateOfSubmission: {
    type: Date,
    required: true
  },
  scope: {
    type: String,
    enum: ['National', 'International'],
    required: true
  },
  directoryNumber: {
    type: String
  },
  patentNumber: {
    type: String
  },
  dateOfApproval: {
    type: Date
  },
  fileLink: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Patent', patentSchema);