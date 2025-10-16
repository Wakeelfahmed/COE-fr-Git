const mongoose = require('mongoose');

const fundingProposalSchema = new mongoose.Schema({
  sNo: Number,
  projectTitle: String,
  pi: String,
  researchTeam: String,
  dateOfSubmission: Date,
  fundingSource: String,
  pkr: Number,
  team: String,
  status: String,
  amountPkr: Number,
  targetSDG: {
    type: [String],
    required: false,
    trim: true
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

const FundingProposal = mongoose.model('FundingProposal', fundingProposalSchema);

module.exports = FundingProposal;
