// models/Internship.js
const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema({
  year: Number,
  duration: String,
  certificateNumber: String,
  applicantName: String,
  officialEmail: String,
  contactNumber: String,
  affiliation: String,
  centerName: String,
  supervisor: String,
  tasksCompleted: String,
  fileLink: String,
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

const Internship = mongoose.model('Internship', internshipSchema);

module.exports = Internship;