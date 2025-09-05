/**
 * Copy Production Data to Local Development Database
 * This script safely copies your production data to localhost for testing
 */

const mongoose = require('mongoose');
const { displayEnvironmentInfo } = require('./config/database');

// Load production environment variables
require('dotenv').config();

const tournamentApplicationSchema = new mongoose.Schema({}, { strict: false });

async function copyProductionToLocal() {
  console.log('🔄 Starting production data copy to local development database...\n');

  try {
    // Step 1: Connect to production database (READ ONLY)
    console.log('📡 Connecting to PRODUCTION database (read-only)...');
    const productionUri = process.env.MONGODB_URI;
    const productionConnection = await mongoose.createConnection(productionUri);
    console.log('✅ Connected to production database');

    // Step 2: Connect to local database
    console.log('🏠 Connecting to LOCAL development database...');
    const localUri = 'mongodb://localhost:27017/malaysia-pickleball-portal-dev';
    const localConnection = await mongoose.createConnection(localUri);
    console.log('✅ Connected to local development database');

    // Step 3: Get production data
    console.log('\n📋 Reading production tournament applications...');
    const ProductionModel = productionConnection.model('TournamentApplication', tournamentApplicationSchema);
    const productionData = await ProductionModel.find({});
    console.log(`📊 Found ${productionData.length} tournament applications in production`);

    if (productionData.length === 0) {
      console.log('⚠️  No data to copy. Production database appears empty.');
      await productionConnection.close();
      await localConnection.close();
      return;
    }

    // Step 4: Clear local database (optional)
    console.log('\n🧹 Clearing local development database...');
    const LocalModel = localConnection.model('TournamentApplication', tournamentApplicationSchema);
    await LocalModel.deleteMany({});
    console.log('✅ Local database cleared');

    // Step 5: Copy data to local database
    console.log('\n📥 Copying data to local development database...');
    
    let copiedCount = 0;
    for (const item of productionData) {
      try {
        // Convert to plain object and remove _id to avoid conflicts
        const itemData = item.toObject();
        delete itemData._id;
        
        // Add development prefix to application ID if it doesn't have one
        if (itemData.applicationId && !itemData.applicationId.startsWith('DEV')) {
          itemData.applicationId = 'DEV' + itemData.applicationId;
        }
        
        await LocalModel.create(itemData);
        copiedCount++;
        
        if (copiedCount % 5 === 0) {
          console.log(`   📦 Copied ${copiedCount}/${productionData.length} applications...`);
        }
      } catch (error) {
        console.log(`   ⚠️  Skipped 1 item due to error: ${error.message}`);
      }
    }

    console.log(`\n✅ Successfully copied ${copiedCount} tournament applications to local database`);

    // Step 6: Verify local data
    console.log('\n🔍 Verifying local database...');
    const localCount = await LocalModel.countDocuments({});
    const approvedCount = await LocalModel.countDocuments({ status: 'Approved' });
    
    console.log(`📊 Local database now contains:`);
    console.log(`   - Total applications: ${localCount}`);
    console.log(`   - Approved tournaments: ${approvedCount}`);
    console.log(`   - Pending/Other: ${localCount - approvedCount}`);

    // Step 7: Show sample data
    if (localCount > 0) {
      console.log('\n📄 Sample local tournament application:');
      const sample = await LocalModel.findOne();
      console.log(`   - ID: ${sample.applicationId}`);
      console.log(`   - Title: ${sample.eventTitle}`);
      console.log(`   - Status: ${sample.status}`);
      console.log(`   - Date: ${sample.eventStartDate?.toDateString()}`);
    }

    // Step 8: Close connections
    await productionConnection.close();
    await localConnection.close();
    
    console.log('\n🎉 Data copy completed successfully!');
    console.log('🧪 Your local development database is now ready for testing');
    console.log('🛡️  Production database was not modified (read-only access)');
    console.log('\n💡 Next steps:');
    console.log('   1. Start development server: npm run dev');
    console.log('   2. Access: http://localhost:5001');
    console.log('   3. Test without affecting production data');

  } catch (error) {
    console.error('❌ Error copying data:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   - Check MongoDB is running locally: mongod --version');
    console.log('   - Check production database connection in .env');
    console.log('   - Ensure local MongoDB service is started');
  }
}

// Run the copy operation
copyProductionToLocal();