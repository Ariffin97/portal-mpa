/**
 * Verify Local Development Setup
 * Quick test to ensure everything is configured correctly
 */

const mongoose = require('mongoose');
const { getDatabaseConfig, displayEnvironmentInfo } = require('./config/database');

// Load local environment
require('dotenv').config({ path: '.env.local' });

async function verifySetup() {
  console.log('🔍 Verifying Local Development Setup...\n');
  
  displayEnvironmentInfo();

  try {
    // Test 1: Database Configuration
    console.log('📋 Test 1: Database Configuration');
    const config = getDatabaseConfig();
    
    if (!config.safe) {
      console.log('❌ DANGER: Configuration points to production database!');
      console.log('🛡️  Please check your .env.local file');
      return;
    }
    console.log('✅ Database configuration is safe for local development');

    // Test 2: Local MongoDB Connection
    console.log('\n📋 Test 2: Local MongoDB Connection');
    await mongoose.connect(config.uri);
    console.log('✅ Successfully connected to local MongoDB');
    
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📊 Database name: ${dbName}`);
    
    if (!dbName.includes('dev') && !dbName.includes('local')) {
      console.log('⚠️  Warning: Database name should include "dev" or "local"');
    }

    // Test 3: Tournament Data
    console.log('\n📋 Test 3: Tournament Data Availability');
    const tournamentCount = await mongoose.connection.db.collection('tournamentapplications').countDocuments();
    const approvedCount = await mongoose.connection.db.collection('tournamentapplications').countDocuments({ status: 'Approved' });
    
    console.log(`📊 Total tournament applications: ${tournamentCount}`);
    console.log(`🏆 Approved tournaments: ${approvedCount}`);
    
    if (tournamentCount === 0) {
      console.log('⚠️  No tournament data found. Run: npm run copy-to-local');
    } else {
      console.log('✅ Tournament data is available for testing');
    }

    // Test 4: Application ID Format
    if (tournamentCount > 0) {
      console.log('\n📋 Test 4: Development Application ID Format');
      const sample = await mongoose.connection.db.collection('tournamentapplications').findOne();
      
      if (sample.applicationId.startsWith('DEV')) {
        console.log('✅ Application IDs have DEV prefix (safe)');
        console.log(`   Sample ID: ${sample.applicationId}`);
      } else {
        console.log('⚠️  Application IDs missing DEV prefix');
        console.log(`   Sample ID: ${sample.applicationId}`);
      }
    }

    // Test 5: Environment Variables
    console.log('\n📋 Test 5: Environment Variables');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   USE_LOCAL_DB: ${process.env.USE_LOCAL_DB}`);
    console.log(`   PORT: ${process.env.PORT}`);
    
    if (process.env.NODE_ENV !== 'development') {
      console.log('⚠️  NODE_ENV should be "development"');
    } else {
      console.log('✅ Environment variables configured correctly');
    }

    console.log('\n🎉 Local Development Setup Verification Complete!');
    console.log('\n💡 Next steps:');
    console.log('   1. Start server: npm run server:dev');
    console.log('   2. Access: http://localhost:5002');
    console.log('   3. Test without affecting production');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   - Check if MongoDB is running: mongod --version');
    console.log('   - Verify .env.local file exists and has correct settings');
    console.log('   - Run data copy: npm run copy-to-local');
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔐 Database connection closed');
    }
  }
}

// Run verification
verifySetup();