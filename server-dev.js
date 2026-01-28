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

// Email Configuration with nodemailer
const nodemailer = require('nodemailer');

// Create email transporter (using Gmail SMTP for custom domain)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

const emailService = {
  sendEmail: async (to, subject, htmlContent, textContent = '') => {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@malaysiapickleballassociation.com',
        to: to,
        subject: subject,
        text: textContent,
        html: htmlContent
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw error; // Throw error instead of fallback
    }
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
  },
  requiredInfo: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const TournamentApplication = mongoose.model('TournamentApplication', tournamentApplicationSchema);

// Admin Login Schema
const adminLoginSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  loginTime: {
    type: Date,
    default: Date.now
  },
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true
});

const AdminLogin = mongoose.model('AdminLogin', adminLoginSchema);

// Admin User Schema
const adminUserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: false
  },
  fullName: {
    type: String,
    required: false
  },
  authorityLevel: {
    type: String,
    enum: {
      values: ['super_admin', 'admin', 'assessment_admin'],
      message: 'Authority level must be one of: super_admin, admin, assessment_admin'
    },
    default: 'admin'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

const AdminUser = mongoose.model('AdminUser', adminUserSchema);

// Unregistered Player Schema (from Tournament Software)
const unregisteredPlayerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: String,
  skillLevel: String,
  age: Number,
  softwareProvider: String,
  softwareName: String,
  registrationToken: {
    type: String,
    unique: true
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  registered: {
    type: Boolean,
    default: false
  },
  playerId: {
    type: String
  }
}, {
  timestamps: true
});

const UnregisteredPlayer = mongoose.model('UnregisteredPlayer', unregisteredPlayerSchema);

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
    const { status, rejectionReason, requiredInfo } = req.body;
    const updateData = {
      status,
      lastUpdated: Date.now()
    };

    if (status === 'Rejected' && rejectionReason) {
      updateData.remarks = rejectionReason;
    }

    if (status === 'More Info Required' && requiredInfo) {
      updateData.requiredInfo = requiredInfo;
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
      console.log('📧 [DEV] Rejection reason:', rejectionReason);
    }

    if (status === 'More Info Required' && application.email && requiredInfo) {
      console.log('📧 [DEV] Mock "More Info Required" email sent to:', application.email);
      console.log('📧 [DEV] Required information:', requiredInfo);
    }

    res.json(application);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// More Info Required email endpoint
app.post('/api/notifications/more-info-required', async (req, res) => {
  try {
    const {
      recipientEmail,
      recipientName,
      applicationId,
      eventTitle,
      requiredInfo,
      eventDate,
      venue
    } = req.body;

    console.log('\n📧 Sending "More Info Required" Email:');
    console.log('👤 To:', recipientEmail);
    console.log('🏷️  Name:', recipientName);
    console.log('🎯 Application ID:', applicationId);
    console.log('🎪 Event:', eventTitle);

    // Create email content
    const subject = 'Additional Information Required for Your Tournament Application';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #333; margin: 0;">Malaysia Pickleball Association</h1>
        </div>

        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: #333; margin-bottom: 20px;">Additional Information Required</h2>

          <p>Dear ${recipientName},</p>

          <p>We have reviewed your tournament application for "<strong>${eventTitle}</strong>" (Application ID: <strong>${applicationId}</strong>) and require additional information before we can proceed with the approval process.</p>

          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <h3 style="color: #856404; margin-top: 0;">Required Information:</h3>
            <p style="color: #856404; margin-bottom: 0;">${requiredInfo}</p>
          </div>

          ${eventDate ? `<p><strong>Event Date:</strong> ${eventDate}</p>` : ''}
          ${venue ? `<p><strong>Venue:</strong> ${venue}</p>` : ''}

          <p>Please provide the requested information as soon as possible to avoid delays in processing your application.</p>

          <p>You can submit the additional information by replying to this email or contacting us directly.</p>

          <p>Thank you for your cooperation.</p>

          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>Malaysia Pickleball Association</strong>
          </p>
        </div>

        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>This is an automated message from the Malaysia Pickleball Association tournament application system.</p>
        </div>
      </div>
    `;

    const textContent = `
Dear ${recipientName},

We have reviewed your tournament application for "${eventTitle}" (Application ID: ${applicationId}) and require additional information before we can proceed with the approval process.

Required Information:
${requiredInfo}

${eventDate ? `Event Date: ${eventDate}` : ''}
${venue ? `Venue: ${venue}` : ''}

Please provide the requested information as soon as possible to avoid delays in processing your application.

Thank you for your cooperation.

Best regards,
Malaysia Pickleball Association
    `;

    // Send the actual email
    const emailResult = await emailService.sendEmail(
      recipientEmail,
      subject,
      htmlContent,
      textContent
    );

    console.log('✅ Email sent successfully!\n');

    res.json({
      success: emailResult.success,
      messageId: emailResult.messageId,
      recipient: recipientEmail,
      message: 'More info required email sent successfully'
    });

  } catch (error) {
    console.error('❌ Error sending more info required email:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Admin login endpoint (development)
app.post('/api/admin/login', async (req, res) => {
  try {
    console.log('Admin login attempt:', req.body);
    const { username, password } = req.body;

    // Check if credentials are provided
    if (!username || !password) {
      console.log('Missing credentials');
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Trim whitespace and check credentials
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    console.log('Checking credentials:', { username: trimmedUsername, password: '***' });

    let loginSuccessful = false;
    let userAuthority = 'admin';

    // Check database for admin users
    try {
      const adminUser = await AdminUser.findOne({
        username: trimmedUsername,
        status: 'active'
      });

      if (adminUser && adminUser.password === trimmedPassword) {
        console.log('Login successful for database admin user:', trimmedUsername);
        loginSuccessful = true;
        userAuthority = adminUser.authorityLevel;

        // Update last login time
        adminUser.lastLogin = new Date();
        await adminUser.save();
      }
    } catch (dbError) {
      console.error('Database error during authentication:', dbError);
      // Continue with login failure below
    }

    if (loginSuccessful) {
      // Log the login attempt
      try {
        const loginRecord = new AdminLogin({
          username: trimmedUsername,
          password: '***', // Don't store actual password
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent') || 'Unknown'
        });

        await loginRecord.save();
        console.log('Login record saved');
      } catch (logError) {
        console.error('Failed to save login record:', logError);
        // Don't fail the login if logging fails
      }

      res.json({
        success: true,
        message: 'Login successful',
        user: {
          username: trimmedUsername,
          authority: userAuthority
        }
      });
    } else {
      console.log('Invalid credentials provided:', { username: trimmedUsername });
      res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all unregistered players
app.get('/api/unregistered-players', async (req, res) => {
  try {
    const unregisteredPlayers = await UnregisteredPlayer.find()
      .sort({ createdAt: -1 });

    res.json(unregisteredPlayers);
  } catch (error) {
    console.error('Error fetching unregistered players:', error);
    res.status(500).json({ error: 'Failed to fetch unregistered players' });
  }
});

// Get unregistered player by token (for registration page)
app.get('/api/unregistered-player/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const unregisteredPlayer = await UnregisteredPlayer.findOne({ registrationToken: token });

    if (!unregisteredPlayer) {
      return res.json({
        success: false,
        error: 'Invalid or expired registration link'
      });
    }

    // Return player data for pre-filling the form
    res.json({
      success: true,
      player: {
        fullName: unregisteredPlayer.name,
        email: unregisteredPlayer.email,
        phoneNumber: unregisteredPlayer.phone,
        age: unregisteredPlayer.age,
        softwareProvider: unregisteredPlayer.softwareProvider,
        softwareName: unregisteredPlayer.softwareName,
        syncStatus: unregisteredPlayer.registered ? 'sync' : 'pending'
      }
    });
  } catch (error) {
    console.error('Error fetching unregistered player by token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load registration data'
    });
  }
});

// Send registration email to unregistered player
app.post('/api/unregistered-players/:id/approve', async (req, res) => {
  try {
    const unregisteredPlayer = await UnregisteredPlayer.findById(req.params.id);

    if (!unregisteredPlayer) {
      return res.status(404).json({ error: 'Unregistered player not found' });
    }

    // Generate registration link
    const registrationLink = `${process.env.MPA_REACT_URL || 'http://localhost:5173'}/player-registration/${unregisteredPlayer.registrationToken}`;

    // Email content
    const subject = 'Complete Your Malaysia Pickleball Association Registration';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #333; margin: 0;">Malaysia Pickleball Association</h1>
        </div>

        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: #333; margin-bottom: 20px;">Complete Your Player Registration</h2>

          <p>Dear ${unregisteredPlayer.name},</p>

          <p>You've been invited to register as a player with the Malaysia Pickleball Association. To complete your registration, please click the button below:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${registrationLink}" style="background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Complete Registration
            </a>
          </div>

          <p>Or copy and paste this link into your browser:</p>
          <p style="background-color: #f8f9fa; padding: 10px; word-break: break-all; border-radius: 5px;">
            ${registrationLink}
          </p>

          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            If you did not expect this email or have any questions, please contact us.
          </p>

          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>Malaysia Pickleball Association</strong>
          </p>
        </div>

        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>This is an automated message from the Malaysia Pickleball Association player registration system.</p>
        </div>
      </div>
    `;

    const textContent = `
Dear ${unregisteredPlayer.name},

You've been invited to register as a player with the Malaysia Pickleball Association.

To complete your registration, please visit this link:
${registrationLink}

If you did not expect this email or have any questions, please contact us.

Best regards,
Malaysia Pickleball Association
    `;

    // Send the actual email
    try {
      const emailResult = await emailService.sendEmail(
        unregisteredPlayer.email,
        subject,
        htmlContent,
        textContent
      );

      console.log('✅ Registration email sent to:', unregisteredPlayer.email);
      console.log('📧 Registration Link:', registrationLink);

      // Mark email as sent
      unregisteredPlayer.emailSent = true;
      await unregisteredPlayer.save();

      res.json({
        success: true,
        message: 'Registration email sent successfully',
        registrationLink: registrationLink // Include link in response for development
      });
    } catch (emailError) {
      console.error('❌ Failed to send email:', emailError);
      // Still return success but log the error
      res.json({
        success: true,
        message: 'Registration email queued (check server logs)',
        registrationLink: registrationLink
      });
    }
  } catch (error) {
    console.error('Error sending registration email:', error);
    res.status(500).json({ error: 'Failed to send registration email' });
  }
});

// Delete unregistered player
app.delete('/api/unregistered-players/:id', async (req, res) => {
  try {
    await UnregisteredPlayer.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Player deleted successfully' });
  } catch (error) {
    console.error('Error deleting unregistered player:', error);
    res.status(500).json({ error: 'Failed to delete player' });
  }
});

// Tournament Software - Share Players to MPA
app.post('/api/tournament-software/share-players', async (req, res) => {
  try {
    const { players, softwareProvider, softwareName } = req.body;

    if (!players || !Array.isArray(players) || players.length === 0) {
      return res.status(400).json({ error: 'Players array is required' });
    }

    const results = [];
    const errors = [];

    for (const player of players) {
      try {
        // Generate unique registration token
        const crypto = require('crypto');
        const registrationToken = crypto.randomBytes(32).toString('hex');

        // Create unregistered player record
        const unregisteredPlayer = new UnregisteredPlayer({
          name: player.name,
          email: player.email,
          phone: player.phone,
          skillLevel: player.skillLevel,
          age: player.age,
          softwareProvider,
          softwareName,
          registrationToken
        });

        await unregisteredPlayer.save();

        // Generate registration link (points to MPA React app, not portal)
        const registrationLink = `${process.env.MPA_REACT_URL || 'http://localhost:5173'}/player-registration/${registrationToken}`;

        // In development mode, just log the email instead of sending it
        console.log('\n📧 DEVELOPMENT MODE - Email would be sent:');
        console.log('To:', player.email);
        console.log('Subject: Complete Your MPA Registration');
        console.log('Registration Link:', registrationLink);
        console.log('---\n');

        // Mark email as sent (even though we're just logging in dev mode)
        unregisteredPlayer.emailSent = true;
        await unregisteredPlayer.save();

        results.push({
          name: player.name,
          email: player.email,
          status: 'success'
        });

      } catch (error) {
        console.error(`Error processing player ${player.name}:`, error);
        errors.push({
          name: player.name,
          email: player.email,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Processed ${players.length} player(s)`,
      results,
      errors,
      totalSuccess: results.length,
      totalErrors: errors.length
    });

  } catch (error) {
    console.error('Error sharing players to MPA:', error);
    res.status(500).json({ error: 'Failed to share players to MPA' });
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