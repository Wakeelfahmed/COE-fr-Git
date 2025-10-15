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
    type: String,
    required: true
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
  fileLink: String  
});

module.exports = mongoose.model('Patent', patentSchema);