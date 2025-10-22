const mongoose = require('mongoose');
require('dotenv').config();

async function checkCollaborationData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const collaborations = await mongoose.connection.db.collection('collaborations').find({}).limit(5).toArray();
    console.log('Records in collaborations collection:');

    collaborations.forEach((record, index) => {
      console.log(`\nRecord ${index + 1}:`);
      console.log('  Title:', record.title || record.projectTitle || record.name);
      console.log('  Type:', record.typeOfCollaboration);
      console.log('  Scope:', record.collaborationScope);
      console.log('  Researcher:', record.collaboratingForeignResearcher || record.collaboratingLocalResearcher);
      console.log('  Institute:', record.foreignCollaboratingInstitute || record.localCollaboratingInstitute);
      console.log('  Country:', record.collaboratingCountry);
      console.log('  Created By:', record.createdBy?.name || 'Unknown');
      console.log('  Created At:', record.createdAt);
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

checkCollaborationData();
