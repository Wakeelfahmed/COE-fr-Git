const mongoose = require('mongoose');
require('dotenv').config();

async function checkModels() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check Collaboration model
    const Collaboration = require('./models/Collaboration');
    console.log('Collaboration model collection name:', Collaboration.collection.name);

    // Check LocalCollaboration model
    const LocalCollaboration = require('./models/LocalCollaboration');
    console.log('LocalCollaboration model collection name:', LocalCollaboration.collection.name);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

checkModels();
