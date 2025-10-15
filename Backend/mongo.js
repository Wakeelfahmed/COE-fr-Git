const mongoose = require('mongoose');
require('dotenv').config(); // If you're using environment variables

async function removeEmployeeIdIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const User = mongoose.model('User');
    await User.collection.dropIndex('employeeId_1');
    console.log('Successfully removed employeeId index');
  } catch (error) {
    console.error('Error removing index:', error);
  } finally {
    await mongoose.disconnect();
  }
}

removeEmployeeIdIndex();