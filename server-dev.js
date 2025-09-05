/**
 * Development Server
 * Uses local MongoDB for testing - does not affect production data
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { getDatabaseConfig, displayEnvironmentInfo } = require('./config/database');

// Load development environment variables
require('dotenv').config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'build')));

// Display environment info
displayEnvironmentInfo();

// MongoDB Connection (Local Development)
const dbConfig = getDatabaseConfig();

if (!dbConfig.safe) {
  console.error('🚨 ERROR: Development server trying to connect to production database!');
  console.error('🛡️  Safety check failed. Server will not start.');
  process.exit(1);
}

mongoose.connect(dbConfig.uri)
.then(() => {
  console.log('✅ Connected to LOCAL MongoDB (safe for testing)');
  console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
  console.log('🧪 This will NOT affect production data');
})
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Email Configuration (Disabled for development)
const mockEmailService = {
  sendEmail: async (to, template, attachments = []) => {
    console.log('📧 [MOCK EMAIL] Would send email to:', to);
    console.log('📧 [MOCK EMAIL] Subject:', template.subject);
    console.log('📧 [MOCK EMAIL] Attachments:', attachments.length);
    return { success: true, messageId: 'mock-' + Date.now() };
  }
};

// Import all the existing schemas and routes from server.js
// (You can copy the schemas and routes from server.js here, or require them)

// Tournament Application Schema (same as production)
const tournamentApplicationSchema = new mongoose.Schema({
  applicationId: {
    type: String,
    required: true,
    unique: true
  },
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
  scoringFormat: {
    type: String,
    default: 'traditional'
  },
  dataConsent: {
    type: Boolean,
    required: true
  },
  termsConsent: {
    type: Boolean,
    required: true
  },
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
  remarks: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const TournamentApplication = mongoose.model('TournamentApplication', tournamentApplicationSchema);

// Routes (same as production but with mock email)
// Get all tournament applications
app.get('/api/applications', async (req, res) => {
  try {
    const applications = await TournamentApplication.find().sort({ submissionDate: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get approved tournaments (sanctioned tournaments)
app.get('/api/approved-tournaments', async (req, res) => {
  try {
    const approvedTournaments = await TournamentApplication.find({ 
      status: 'Approved' 
    }).sort({ eventStartDate: 1 });
    res.json(approvedTournaments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit tournament application (with mock email)
app.post('/api/applications', async (req, res) => {
  try {
    const applicationData = req.body;
    
    // Generate unique application ID
    const generateApplicationId = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return 'DEV' + result; // DEV prefix for development
    };

    let applicationId;
    let isUnique = false;
    
    while (!isUnique) {
      applicationId = generateApplicationId();
      const existing = await TournamentApplication.findOne({ applicationId });
      if (!existing) {
        isUnique = true;
      }
    }

    const newApplication = new TournamentApplication({
      applicationId,
      ...applicationData
    });

    const savedApplication = await newApplication.save();
    
    // Mock email sending
    if (savedApplication.email) {
      console.log('📧 [DEV] Mock confirmation email sent to:', savedApplication.email);
    }
    
    res.status(201).json({
      message: 'Application submitted successfully (DEVELOPMENT)',
      application: savedApplication
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update application status (with mock email)
app.patch('/api/applications/:id/status', async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const updateData = { 
      status, 
      lastUpdated: Date.now() 
    };
    
    if (status === 'Rejected' && rejectionReason) {
      updateData.remarks = rejectionReason;
    }
    
    const application = await TournamentApplication.findOneAndUpdate(
      { applicationId: req.params.id },
      updateData,
      { new: true }
    );
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Mock email notifications
    if (status === 'Approved' && application.email) {
      console.log('📧 [DEV] Mock approval email sent to:', application.email);
    }
    
    if (status === 'Rejected' && application.email && rejectionReason) {
      console.log('📧 [DEV] Mock rejection email sent to:', application.email);
    }
    
    res.json(application);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK (DEVELOPMENT)', 
    timestamp: new Date().toISOString(),
    database: 'LOCAL MongoDB (safe)',
    mode: 'development'
  });
});

// Catch-all handler
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 DEVELOPMENT SERVER running on port ${PORT}`);
  console.log('🏠 Using LOCAL database only - production data is safe');
  console.log('🧪 Perfect for testing without affecting live data');
  console.log(`🔗 Access: http://localhost:${PORT}`);
});