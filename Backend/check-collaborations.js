const mongoose = require('mongoose');
require('dotenv').config();

async function checkCollaborations() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const collaborations = await mongoose.connection.db.collection('collaborations').find({}).limit(3).toArray();
    console.log('Sample records from collaborations collection:');
    collaborations.forEach((record, index) => {
      console.log(`Record ${index + 1}:`, {
        title: record.title || record.projectTitle || record.name,
        createdBy: record.createdBy,
        createdAt: record.createdAt
      });
    });

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

checkCollaborations();
