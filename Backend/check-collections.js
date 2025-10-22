const mongoose = require('mongoose');
require('dotenv').config();

async function checkCollections() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:');
    collections.forEach(col => {
      if (col.name.includes('collab') || col.name.includes('local') || col.name.includes('Local')) {
        console.log(' -', col.name);
      }
    });

    // Check each potential collection
    for (const col of collections) {
      if (col.name.includes('collab') || col.name.includes('local') || col.name.includes('Local')) {
        const count = await mongoose.connection.db.collection(col.name).countDocuments();
        console.log(`${col.name}: ${count} records`);
      }
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

checkCollections();
