const mongoose = require('mongoose');

const collaborationSchema = new mongoose.Schema({
  memberOfCoE: {
    type: String,
    required: true,
    trim: true
  },
  collaboratingForeignResearcher: {
    type: String,
    required: true,
    trim: true
  },
  foreignCollaboratingInstitute: {
    type: String,
    required: true,
    trim: true
  },
  collaboratingCountry: {
    type: String,
    required: true,
    trim: true
  },
  typeOfCollaboration: {
    type: String,
    required: true,
    enum: [
      'Joint Publication',
      'Funded Research Project',
      'Research Grant Proposal',
      'Technology Development / Prototype',
      'Exchange / Fellowship / Visiting Position',
      'Joint Supervision (PhD/MS)',
      'Other'
    ]
  },
  durationStart: {
    type: Date,
    required: true
  },
  durationEnd: {
    type: Date,
    required: false
  },
  currentStatus: {
    type: String,
    required: true,
    enum: ['Ongoing', 'Completed', 'Submitted', 'Under Review']
  },
  keyOutcomes: {
    type: String,
    required: true,
    trim: true
  },
  detailsOfOutcome: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const Collaboration = mongoose.model('Collaboration', collaborationSchema);

module.exports = Collaboration;
