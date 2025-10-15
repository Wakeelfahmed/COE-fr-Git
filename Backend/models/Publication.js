const mongoose = require('mongoose');

const publicationSchema = new mongoose.Schema({
  author: String,
  publicationDetails: String,
  typeOfPublication: String,
  lastKnownImpactFactor: Number,
  dateOfPublication: Date,
  hecCategory: String,
  fileLink: String  
});

const Publication = mongoose.model('Publication', publicationSchema);

module.exports = Publication;