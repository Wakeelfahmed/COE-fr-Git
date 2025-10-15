const mongoose = require('mongoose');

const fundingSchema = new mongoose.Schema({
  sNo: Number,
  projectTitle: String,
  pi: String,
  researchTeam: String,
  dateOfSubmission: Date,
  dateOfApproval: Date,
  fundingSource: String,
  pkr: Number,
  team: String,
  status: String,
  closingDate: Date,
  amountPkr: Number,
  fileLink: String  
});

const Funding = mongoose.model('Funding', fundingSchema);

module.exports = Funding;