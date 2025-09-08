const mongoose = require('mongoose');

async function checkCurrentDuplicates() {
  try {
    // Check portal database for recent duplicates
    console.log('=== Current Portal Database State ===');
    await mongoose.connect('mongodb://localhost:27017/malaysia-pickleball-portal-dev');
    const TournamentApplication = mongoose.model('TournamentApplication', new mongoose.Schema({}, { strict: false }));
    
    const portalTournaments = await TournamentApplication.find({}, 'applicationId eventTitle status createdAt updatedAt').sort({ createdAt: -1 });
    
    console.log(`Total tournaments in portal: ${portalTournaments.length}`);
    
    // List all tournaments with timestamps
    console.log('\n📋 All Portal Tournaments:');
    portalTournaments.forEach((t, i) => {
      console.log(`${i+1}. ${t.applicationId}: ${t.eventTitle}`);
      console.log(`   Created: ${t.createdAt} | Updated: ${t.updatedAt}`);
    });
    
    // Group by base name to detect duplicates
    const groups = {};
    portalTournaments.forEach(t => {
      const baseName = t.eventTitle.replace(/ - (UPDATED|NEW).*$/i, '').replace(/ VIA.*$/i, '').trim();
      if (!groups[baseName]) {
        groups[baseName] = [];
      }
      groups[baseName].push(t);
    });
    
    let hasDuplicates = false;
    console.log('\n📊 Duplicate Analysis:');
    Object.keys(groups).forEach(name => {
      const tournaments = groups[name];
      if (tournaments.length > 1) {
        console.log(`\n❌ DUPLICATE: '${name}' (${tournaments.length} entries)`);
        tournaments.forEach((t, i) => {
          console.log(`   ${i+1}. ${t.applicationId}: ${t.eventTitle}`);
          console.log(`      Created: ${t.createdAt} | Updated: ${t.updatedAt}`);
        });
        hasDuplicates = true;
      } else {
        console.log(`✅ ${name}: 1 tournament (ID: ${tournaments[0].applicationId})`);
      }
    });
    
    await mongoose.disconnect();
    
    // Check old database
    console.log('\n=== Old Database State ===');
    await mongoose.connect('mongodb://localhost:27017/malaysia-pickleball-dev');
    const Tournament = mongoose.model('Tournament', new mongoose.Schema({}, { strict: false }));
    
    const oldTournaments = await Tournament.find({}, 'name portalApplicationId createdAt').sort({ createdAt: -1 });
    console.log(`Total tournaments in old database: ${oldTournaments.length}`);
    
    oldTournaments.forEach(t => {
      const status = t.portalApplicationId ? '✅ LINKED' : '❌ UNLINKED';
      console.log(`${status}: ${t.name} -> ${t.portalApplicationId || 'NO PORTAL ID'} (${t.createdAt})`);
    });
    
    await mongoose.disconnect();
    
    console.log(`\n=== VERDICT ===`);
    if (hasDuplicates) {
      console.log('❌ DUPLICATES STILL EXIST - The fix is not working yet');
    } else {
      console.log('✅ No duplicates found - System appears to be working');
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCurrentDuplicates();