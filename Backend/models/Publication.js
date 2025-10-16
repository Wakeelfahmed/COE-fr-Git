const mongoose = require('mongoose');

const publicationSchema = new mongoose.Schema({
  author: String,
  publicationDetails: String,
  typeOfPublication: String,
  lastKnownImpactFactor: Number,
  dateOfPublication: Date,
  hecCategory: String,
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

const Publication = mongoose.model('Publication', publicationSchema);

module.exports = Publication;