const mongoose = require('mongoose');
require('dotenv').config();

// Tournament Application Schema (same as in server.js)
const tournamentApplicationSchema = new mongoose.Schema({
  applicationId: {
    type: String,
    required: true,
    unique: true
  },
  // Organiser Information
  organiserName: {
    type: String,
    required: true
  },
  registrationNo: {
    type: String,
    required: true
  },
  telContact: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  organisingPartner: {
    type: String,
    default: ''
  },
  // Event Details
  eventTitle: {
    type: String,
    required: true
  },
  eventStartDate: {
    type: Date,
    required: true
  },
  eventEndDate: {
    type: Date,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  venue: {
    type: String,
    required: true
  },
  classification: {
    type: String,
    required: true,
    enum: ['District', 'Divisional', 'State', 'National', 'International']
  },
  expectedParticipants: {
    type: Number,
    required: true
  },
  eventSummary: {
    type: String,
    required: true
  },
  // Tournament Settings
  scoringFormat: {
    type: String,
    default: 'traditional'
  },
  // Consent
  dataConsent: {
    type: Boolean,
    required: true
  },
  termsConsent: {
    type: Boolean,
    required: true
  },
  // Application Metadata
  status: {
    type: String,
    default: 'Pending Review',
    enum: ['Pending Review', 'Under Review', 'Approved', 'Rejected', 'More Info Required']
  },
  submissionDate: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  // Admin remarks/rejection reason
  remarks: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

function generateApplicationId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return 'MPA' + result;
}

function mapTypeToClassification(type) {
  switch (type?.toLowerCase()) {
    case 'local':
      return 'District';
    case 'state':
    case 'sarawak':
      return 'State';
    case 'national':
      return 'National';
    case 'wmalaysia':
      return 'Divisional';
    default:
      return 'District';
  }
}

function mapTypeToState(type) {
  switch (type?.toLowerCase()) {
    case 'sarawak':
      return 'Sarawak';
    case 'wmalaysia':
      return 'Kuala Lumpur';
    case 'national':
      return 'Kuala Lumpur';
    default:
      return 'Sarawak'; // Default fallback
  }
}

function estimateParticipants(classification, name) {
  // Estimate based on classification and tournament name
  if (classification === 'National') return 300;
  if (classification === 'State') return 200;
  if (classification === 'International') return 400;
  if (name.toLowerCase().includes('open')) return 250;
  if (name.toLowerCase().includes('championship')) return 180;
  return 100; // Default
}

async function migrateTournaments() {
  try {
    console.log('🚀 Starting tournament migration...\n');
    
    // Connect to old database
    const oldDbUri = process.env.MONGODB_URI.replace('/malaysia-pickleball-portal', '/malaysia-pickleball');
    console.log('🔗 Connecting to old database...');
    await mongoose.connect(oldDbUri);
    console.log('✅ Connected to old database: malaysia-pickleball');
    
    // Get old tournaments
    const oldTournaments = await mongoose.connection.db.collection('tournaments').find({}).toArray();
    console.log(`📋 Found ${oldTournaments.length} tournaments to migrate\n`);
    
    // Close old connection and connect to new database
    await mongoose.disconnect();
    
    const newDbUri = process.env.MONGODB_URI;
    console.log('🔗 Connecting to new database...');
    await mongoose.connect(newDbUri);
    console.log('✅ Connected to new database: malaysia-pickleball-portal');
    
    // Create TournamentApplication model for new database
    const TournamentApplication = mongoose.model('TournamentApplication', tournamentApplicationSchema);
    
    // Check existing applications to avoid duplicates
    const existingApps = await TournamentApplication.find({});
    const existingNames = new Set(existingApps.map(app => app.eventTitle));
    console.log(`📝 Found ${existingApps.length} existing applications in new database\n`);
    
    let migrated = 0;
    let skipped = 0;
    const errors = [];
    
    for (const oldTournament of oldTournaments) {
      try {
        // Skip if already exists
        if (existingNames.has(oldTournament.name)) {
          console.log(`⏭️  Skipping existing tournament: ${oldTournament.name}`);
          skipped++;
          continue;
        }
        
        // Map old tournament to new application format
        const classification = mapTypeToClassification(oldTournament.type);
        const state = mapTypeToState(oldTournament.type);
        const expectedParticipants = estimateParticipants(classification, oldTournament.name);
        
        // Generate unique application ID
        let applicationId;
        let isUnique = false;
        while (!isUnique) {
          applicationId = generateApplicationId();
          const existing = await TournamentApplication.findOne({ applicationId });
          if (!existing) {
            isUnique = true;
          }
        }
        
        const newApplication = {
          applicationId,
          // Organiser Information (defaults for migrated tournaments)
          organiserName: oldTournament.organizer || 'Malaysia Pickleball Association',
          registrationNo: 'MIG-' + oldTournament._id.toString().slice(-6).toUpperCase(),
          telContact: oldTournament.phoneNumber || '+60-11-1234567',
          email: 'tournaments@malaysiapickleballassociation.org',
          organisingPartner: oldTournament.personInCharge || '',
          
          // Event Details
          eventTitle: oldTournament.name,
          eventStartDate: new Date(oldTournament.startDate),
          eventEndDate: new Date(oldTournament.endDate),
          state: state,
          city: oldTournament.city || (state === 'Sarawak' ? 'Kuching' : 'Kuala Lumpur'),
          venue: oldTournament.venue || 'Venue TBA',
          classification: classification,
          expectedParticipants: expectedParticipants,
          eventSummary: `Migrated tournament from legacy system. Original type: ${oldTournament.type}. This tournament has been pre-approved as it was part of the existing tournament calendar.`,
          
          // Tournament Settings
          scoringFormat: 'traditional',
          
          // Consent (auto-approved for migrated tournaments)
          dataConsent: true,
          termsConsent: true,
          
          // Application Metadata - SET AS APPROVED since these are existing sanctioned tournaments
          status: 'Approved',
          submissionDate: oldTournament.createdAt || new Date(),
          lastUpdated: new Date(),
          remarks: 'Migrated from legacy tournament system and pre-approved'
        };
        
        // Save to new database
        const savedApplication = await TournamentApplication.create(newApplication);
        
        console.log(`✅ Migrated: ${oldTournament.name} -> ${applicationId} (${classification})`);
        migrated++;
        
      } catch (error) {
        console.error(`❌ Error migrating ${oldTournament.name}:`, error.message);
        errors.push({ tournament: oldTournament.name, error: error.message });
      }
    }
    
    // Summary
    console.log(`\n🎉 Migration completed!`);
    console.log(`✅ Successfully migrated: ${migrated} tournaments`);
    console.log(`⏭️  Skipped (already exists): ${skipped} tournaments`);
    console.log(`❌ Errors: ${errors.length} tournaments`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach(err => {
        console.log(`   - ${err.tournament}: ${err.error}`);
      });
    }
    
    // Close connection
    await mongoose.disconnect();
    
    console.log('\n🔐 Database connection closed.');
    console.log('🏆 All migrated tournaments are set to "Approved" status and will appear in the Approved Tournaments folder!');
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
  }
}

// Run migration
migrateTournaments();