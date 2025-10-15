const mongoose = require('mongoose');

const commercializationProjectSchema = new mongoose.Schema({
  projectTitle: String,
  supervisor: String,
  rndTeam: [String],
  clientCompany: String,
  dateOfContractSign: Date,
  dateOfDeploymentAsPerContract: Date,
  amountInPKRM: Number,
  advPaymentPercentage: Number,
  advPaymentAmount: Number,
  dateOfReceivingAdvancePayment: Date,
  actualDateOfDeployment: Date,
  dateOfReceivingCompletePayment: Date,
  remarks: String,
  createdBy: String,
  fileLink: String  // New field for storing the PDF file link
});

module.exports = mongoose.model('CommercializationProject', commercializationProjectSchema);