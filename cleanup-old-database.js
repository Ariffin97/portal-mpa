/**
 * Database Cleanup Script
 * Safely removes old malaysia-pickleball database from MongoDB Atlas
 * KEEPS your malaysia-pickleball-portal database intact
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function cleanupOldDatabase() {
  console.log('🧹 Starting database cleanup...\n');
  
  try {
    // Connect to MongoDB Atlas
    const atlasUri = process.env.MONGODB_URI.replace('/malaysia-pickleball-portal', '');
    console.log('📡 Connecting to MongoDB Atlas...');
    
    const connection = await mongoose.createConnection(atlasUri);
    console.log('✅ Connected to Atlas\n');
    
    // List all databases
    console.log('📋 Current databases:');
    const admin = connection.db.admin();
    const result = await admin.listDatabases();
    
    result.databases.forEach(db => {
      console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    // Check if old database exists
    const oldDbExists = result.databases.some(db => db.name === 'malaysia-pickleball');
    
    if (!oldDbExists) {
      console.log('\n✅ Old database "malaysia-pickleball" not found. Nothing to clean up!');
      await connection.close();
      return;
    }
    
    console.log('\n🎯 Found old database: malaysia-pickleball');
    console.log('⚠️  This will PERMANENTLY DELETE the old database!');
    console.log('✅ Your portal database "malaysia-pickleball-portal" will remain safe.\n');
    
    // Safety check
    console.log('🔒 Safety Check:');
    console.log('   ✅ Portal database: malaysia-pickleball-portal (WILL KEEP)');
    console.log('   🗑️  Old database: malaysia-pickleball (WILL DELETE)');
    
    // Uncomment the next lines to actually delete (for safety, it's commented out)
    /*
    console.log('\n🗑️  Deleting old database...');
    const oldDb = connection.useDb('malaysia-pickleball');
    await oldDb.dropDatabase();
    console.log('✅ Old database deleted successfully!');
    */
    
    console.log('\n⚠️  TO ACTUALLY DELETE: Uncomment lines 47-51 in this script');
    console.log('   This safety measure prevents accidental deletion');
    
    await connection.close();
    console.log('\n🎉 Cleanup script completed');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  }
}

// Run the cleanup
cleanupOldDatabase();