/**
 * Local Database Cleanup Script
 * Safely removes old databases from LOCAL MongoDB
 * KEEPS your malaysia-pickleball-portal databases intact
 */

const mongoose = require('mongoose');

async function cleanupLocalDatabases() {
  console.log('🧹 Starting LOCAL database cleanup...\n');
  
  try {
    // Connect to local MongoDB
    console.log('📡 Connecting to local MongoDB...');
    const connection = await mongoose.createConnection('mongodb://localhost:27017');
    console.log('✅ Connected to local MongoDB\n');
    
    // List all databases
    console.log('📋 Current LOCAL databases:');
    const admin = connection.db.admin();
    const result = await admin.listDatabases();
    
    result.databases.forEach(db => {
      const sizeGB = (db.sizeOnDisk / 1024 / 1024 / 1024).toFixed(3);
      console.log(`  - ${db.name} (${sizeGB} GB)`);
    });
    
    // Check for databases to clean up
    const databasesToDelete = result.databases.filter(db => 
      db.name === 'malaysia-pickleball' ||
      db.name === 'malaysia-pickleball-dev' ||
      db.name.includes('malaysia-pickleball') && !db.name.includes('portal')
    );
    
    const databasesToKeep = result.databases.filter(db =>
      db.name === 'malaysia-pickleball-portal' ||
      db.name === 'malaysia-pickleball-portal-dev'
    );
    
    console.log('\n🎯 Cleanup Plan:');
    console.log('✅ KEEPING these databases:');
    if (databasesToKeep.length === 0) {
      console.log('   (No portal databases found yet - they will be created when needed)');
    } else {
      databasesToKeep.forEach(db => console.log(`   - ${db.name}`));
    }
    
    console.log('\n🗑️  DELETING these databases:');
    if (databasesToDelete.length === 0) {
      console.log('   (No old databases found to delete)');
    } else {
      databasesToDelete.forEach(db => console.log(`   - ${db.name}`));
    }
    
    if (databasesToDelete.length === 0) {
      console.log('\n✅ No cleanup needed! Your local MongoDB is already clean.');
      await connection.close();
      return;
    }
    
    // Delete old databases
    console.log('\n🗑️  Deleting old databases...');
    for (const dbInfo of databasesToDelete) {
      console.log(`   Deleting: ${dbInfo.name}`);
      const dbToDelete = connection.useDb(dbInfo.name);
      await dbToDelete.dropDatabase();
      console.log(`   ✅ Deleted: ${dbInfo.name}`);
    }
    
    // Show final state
    console.log('\n📋 Final database state:');
    const finalResult = await admin.listDatabases();
    finalResult.databases.forEach(db => {
      const sizeGB = (db.sizeOnDisk / 1024 / 1024 / 1024).toFixed(3);
      console.log(`  - ${db.name} (${sizeGB} GB)`);
    });
    
    await connection.close();
    console.log('\n🎉 Local database cleanup completed!');
    console.log('✅ Your portal will create fresh, clean databases when it starts.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 Make sure MongoDB is running: sudo systemctl start mongod');
    }
    process.exit(1);
  }
}

// Run the cleanup
cleanupLocalDatabases();