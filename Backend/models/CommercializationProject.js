const mongoose = require('mongoose');

const commercializationProjectSchema = new mongoose.Schema({
  projectTitle: String,
  teamLead: String,
  rndTeam: [String],
  clientCompany: String,
  dateOfContractSign: Date,
  dateOfDeploymentAsPerContract: Date,
  amountInPKRM: Number,
  advPaymentPercentage: Number,
  dateOfReceivingAdvancePayment: Date,
  actualDateOfDeployment: Date,
  dateOfReceivingCompletePayment: Date,
  taxPaidBy: {
    type: String,
    enum: ['BU', 'Client'],
    required: true
  },
  targetSDG: {
    type: [String],
    required: false,
    trim: true
  },
  remarks: String,
  createdBy: String,
  fileLink: String  // New field for storing the PDF file link
});

module.exports = mongoose.model('CommercializationProject', commercializationProjectSchema);