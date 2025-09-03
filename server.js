const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/malaysia-pickleball-portal';

mongoose.connect(MONGODB_URI)
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));

// Email Configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // Gmail SMTP for custom domain hosted on Google Workspace
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

// Email Templates
const emailTemplates = {
  applicationSubmitted: (applicationData) => ({
    subject: 'Tournament Application Submitted - Malaysia Pickleball Association',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #2c5aa0;">Malaysia Pickleball Association</h2>
          <h3 style="color: #666;">Tournament Application Confirmation</h3>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h4 style="color: #28a745; margin-top: 0;">✓ Application Successfully Submitted</h4>
          <p><strong>Application ID:</strong> ${applicationData.applicationId}</p>
          <p><strong>Event Title:</strong> ${applicationData.eventTitle}</p>
          <p><strong>Organiser:</strong> ${applicationData.organiserName}</p>
          <p><strong>Submission Date:</strong> ${new Date().toLocaleDateString('en-MY')}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4>What happens next?</h4>
          <ul style="line-height: 1.6;">
            <li>Your application is now under review by the Malaysia Pickleball Association</li>
            <li>We will review your submission and may contact you for additional information</li>
            <li>You will receive another email when your application status changes</li>
            <li>You can check your application status anytime using your Application ID: <strong>${applicationData.applicationId}</strong></li>
          </ul>
        </div>
        
        <div style="background-color: #e7f3ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h4 style="color: #0056b3; margin-top: 0;">Important Notes:</h4>
          <ul style="margin-bottom: 0; line-height: 1.6;">
            <li>Please save your Application ID: <strong>${applicationData.applicationId}</strong></li>
            <li>Do not reply to this email - this is an automated message</li>
            <li>For inquiries, please contact us through our official channels</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 14px;">
            Malaysia Pickleball Association<br>
            Email: info@malaysiapickleball.my<br>
            Phone: +6011-16197471
          </p>
        </div>
      </div>
    `
  }),
  
  applicationApproved: (applicationData) => ({
    subject: 'Tournament Application APPROVED - Malaysia Pickleball Association',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #2c5aa0;">Malaysia Pickleball Association</h2>
          <h3 style="color: #666;">Tournament Application Update</h3>
        </div>
        
        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h4 style="color: #155724; margin-top: 0;">🎉 Congratulations! Your Application has been APPROVED</h4>
          <p><strong>Application ID:</strong> ${applicationData.applicationId}</p>
          <p><strong>Event Title:</strong> ${applicationData.eventTitle}</p>
          <p><strong>Organiser:</strong> ${applicationData.organiserName}</p>
          <p><strong>Event Date:</strong> ${new Date(applicationData.eventStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} - ${new Date(applicationData.eventEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          <p><strong>Location:</strong> ${applicationData.city}, ${applicationData.state}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4>Next Steps:</h4>
          <ul style="line-height: 1.6;">
            <li>Your tournament has been officially approved by the Malaysia Pickleball Association</li>
            <li>You may now proceed with your tournament planning and promotion</li>
            <li>Please ensure all endorsement logos (state, national & PJS/KBS) are displayed on event banners and at the venue</li>
            <li>Follow the scoring format requirements as per your application</li>
            <li>Maintain communication with MPA for any updates or changes</li>
          </ul>
        </div>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h4 style="color: #856404; margin-top: 0;">Important Reminders:</h4>
          <ul style="margin-bottom: 0; line-height: 1.6;">
            <li>Venue must have government occupancy permit</li>
            <li>Traditional scoring up to 11 pts or more is required</li>
            <li>Rally Scoring (minimum up to 21 pts) is acceptable for first round-robins only</li>
            <li>Event title should not include National/State Title designations</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 14px;">
            Malaysia Pickleball Association<br>
            Email: info@malaysiapickleball.my<br>
            Phone: +6011-16197471
          </p>
        </div>
      </div>
    `
  })
};

// Email sending function
const sendEmail = async (to, template) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@malaysiapickleball.my',
      to: to,
      subject: template.subject,
      html: template.html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Tournament Application Schema
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

// Routes

// Get all tournament applications (for admin)
app.get('/api/applications', async (req, res) => {
  try {
    const applications = await TournamentApplication.find().sort({ submissionDate: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tournament application by ID
app.get('/api/applications/:id', async (req, res) => {
  try {
    const application = await TournamentApplication.findOne({ applicationId: req.params.id });
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json(application);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit tournament application
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
      return 'MPA' + result;
    };

    let applicationId;
    let isUnique = false;
    
    // Ensure unique application ID
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
    
    // Send confirmation email to the organiser
    if (savedApplication.email) {
      const emailTemplate = emailTemplates.applicationSubmitted(savedApplication);
      const emailResult = await sendEmail(savedApplication.email, emailTemplate);
      
      if (!emailResult.success) {
        console.error('Failed to send confirmation email:', emailResult.error);
        // Still return success for the application, even if email fails
      }
    }
    
    res.status(201).json({
      message: 'Application submitted successfully',
      application: savedApplication
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update tournament application status (admin only)
app.patch('/api/applications/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const application = await TournamentApplication.findOneAndUpdate(
      { applicationId: req.params.id },
      { 
        status, 
        lastUpdated: Date.now() 
      },
      { new: true }
    );
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Send approval email if status is changed to 'Approved'
    if (status === 'Approved' && application.email) {
      const emailTemplate = emailTemplates.applicationApproved(application);
      const emailResult = await sendEmail(application.email, emailTemplate);
      
      if (!emailResult.success) {
        console.error('Failed to send approval email:', emailResult.error);
        // Still return success for the status update, even if email fails
      }
    }
    
    res.json(application);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin login endpoint
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Simple authentication (in production, use proper hashing)
    if (username === 'admin' && password === 'admin123') {
      // Log the login attempt
      const loginRecord = new AdminLogin({
        username,
        password: '***', // Don't store actual password
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      await loginRecord.save();
      
      res.json({
        success: true,
        message: 'Login successful'
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get admin login history
app.get('/api/admin/login-history', async (req, res) => {
  try {
    const loginHistory = await AdminLogin.find().sort({ loginTime: -1 }).limit(50);
    res.json(loginHistory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});