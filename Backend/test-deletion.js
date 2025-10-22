const mongoose = require('mongoose');
require('dotenv').config();

async function testDeletion() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Import the LocalCollaboration model
    const LocalCollaboration = require('./models/LocalCollaboration');
    console.log('LocalCollaboration model loaded:', LocalCollaboration);

    // Count records
    const count = await LocalCollaboration.countDocuments();
    console.log('Records in LocalCollaboration collection:', count);

    if (count > 0) {
      console.log('Attempting to delete all records...');
      const deleteResult = await LocalCollaboration.deleteMany({});
      console.log('Delete result:', deleteResult);

      // Verify deletion
      const newCount = await LocalCollaboration.countDocuments();
      console.log('Records after deletion:', newCount);

      if (newCount === 0) {
        console.log('✅ Deletion successful!');
      } else {
        console.log('❌ Deletion failed!');
      }
    } else {
      console.log('No records to delete');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testDeletion();
