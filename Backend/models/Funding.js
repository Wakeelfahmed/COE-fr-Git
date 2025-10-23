const mongoose = require('mongoose');

const fundingSchema = new mongoose.Schema({
  sNo: Number,
  projectTitle: String,
  pi: String,
  coPI: String,
  dateOfSubmission: Date,
  dateOfApproval: Date,
  fundingSource: String,
  pkr: Number,
  team: String,
  status: String,
  closingDate: Date,
  amountPkr: Number,
  targetSDG: {
    type: [String],
    required: false,
    trim: true
  },
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

const Funding = mongoose.model('Funding', fundingSchema);

module.exports = Funding;