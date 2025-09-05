const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'build')));

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
            <li>Your complete application form is attached as a PDF for your records</li>
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
  }),

  applicationRejected: (applicationData, rejectionReason) => ({
    subject: 'Tournament Application REJECTED - Malaysia Pickleball Association',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #2c5aa0;">Malaysia Pickleball Association</h2>
          <h3 style="color: #666;">Tournament Application Update</h3>
        </div>
        
        <div style="background-color: #fee2e2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h4 style="color: #991b1b; margin-top: 0;">❌ Your Application has been REJECTED</h4>
          <p><strong>Application ID:</strong> ${applicationData.applicationId}</p>
          <p><strong>Event Title:</strong> ${applicationData.eventTitle}</p>
          <p><strong>Organiser:</strong> ${applicationData.organiserName}</p>
          <p><strong>Event Date:</strong> ${new Date(applicationData.eventStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} - ${new Date(applicationData.eventEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          <p><strong>Location:</strong> ${applicationData.city}, ${applicationData.state}</p>
        </div>
        
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin-bottom: 20px;">
          <h4 style="color: #dc2626; margin-top: 0;">Rejection Reason:</h4>
          <p style="color: #7f1d1d; line-height: 1.6; margin-bottom: 0;">${rejectionReason}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4>What can you do next?</h4>
          <ul style="line-height: 1.6;">
            <li>Review the rejection reason carefully and address the mentioned concerns</li>
            <li>You may submit a new application after making the necessary changes</li>
            <li>If you need clarification on the rejection reason, please contact us</li>
            <li>Ensure all future applications comply with MPA guidelines and requirements</li>
          </ul>
        </div>
        
        <div style="background-color: #e7f3ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h4 style="color: #0056b3; margin-top: 0;">Important Information:</h4>
          <ul style="margin-bottom: 0; line-height: 1.6;">
            <li>This decision is based on current MPA standards and guidelines</li>
            <li>You are welcome to reapply with a revised submission</li>
            <li>Please review our tournament guidelines before resubmitting</li>
            <li>For assistance, contact our support team using the details below</li>
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

// PDF Generation function with MPA Logo, Full Terms & Conditions
const generateApplicationPDF = async (applicationData) => {
  try {
    console.log('🔄 Generating PDF for application:', applicationData.applicationId);
    
    // Create a new PDFDocument
    const pdfDoc = await PDFDocument.create();
    
    // Get fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Load MPA logo
    let logoImage = null;
    try {
      const logoPath = path.join(__dirname, 'public', 'mpa.png');
      if (fs.existsSync(logoPath)) {
        const logoBytes = fs.readFileSync(logoPath);
        logoImage = await pdfDoc.embedPng(logoBytes);
        console.log('[OK] MPA logo loaded successfully');
      } else {
        console.log('[WARN] MPA logo not found at:', logoPath);
      }
    } catch (logoError) {
      console.log('[WARN] Could not load MPA logo:', logoError.message);
    }
    
    // Colors
    const headerColor = rgb(0, 0.247, 0.498); // #003f7f
    const textColor = rgb(0, 0, 0);
    const labelColor = rgb(0.4, 0.4, 0.4);
    const lightGray = rgb(0.95, 0.95, 0.95);
    
    // Helper function to add a new page with logo background
    const addPageWithLogo = () => {
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
      const { width, height } = page.getSize();
      
      // Add logo as background if available
      if (logoImage) {
        const logoSize = 150;
        page.drawImage(logoImage, {
          x: width / 2 - logoSize / 2,
          y: height / 2 - logoSize / 2,
          width: logoSize,
          height: logoSize,
          opacity: 0.05 // Very light background
        });
      }
      
      return { page, width, height };
    };
    
    // Create first page
    let { page, width, height } = addPageWithLogo();
    let yPosition = height - 50;
    
    // Helper function to add text with word wrapping and newline handling
    const addWrappedText = (text, x, y, maxWidth, options = {}) => {
      const fontSize = options.size || 11;
      const font = options.bold ? helveticaBoldFont : helveticaFont;
      const color = options.color || textColor;
      const lineHeight = fontSize * 1.4;
      
      // Clean text by removing problematic characters and handling newlines
      const cleanText = text
        .replace(/[\r\n]+/g, ' ') // Replace newlines with spaces
        .replace(/[^\x20-\x7E]/g, ' ') // Remove non-ASCII characters
        .replace(/\s+/g, ' ') // Collapse multiple spaces
        .trim();
      
      const words = cleanText.split(' ');
      const lines = [];
      let currentLine = '';
      
      for (const word of words) {
        if (!word) continue; // Skip empty words
        
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        let testWidth;
        
        try {
          testWidth = font.widthOfTextAtSize(testLine, fontSize);
        } catch (error) {
          // If there's an encoding error, skip this word
          console.log('[WARN] Skipping problematic word in PDF:', word);
          continue;
        }
        
        if (testWidth <= maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            // If single word is too long, truncate it
            lines.push(word.substring(0, 30) + '...');
            currentLine = '';
          }
        }
      }
      if (currentLine) lines.push(currentLine);
      
      let currentY = y;
      lines.forEach((line, index) => {
        if (line.trim()) { // Only draw non-empty lines
          try {
            page.drawText(line.trim(), {
              x,
              y: currentY - (index * lineHeight),
              size: fontSize,
              font,
              color
            });
          } catch (error) {
            console.log('[WARN] Could not render line in PDF:', line);
          }
        }
      });
      
      return currentY - (lines.length * lineHeight);
    };
    
    // Helper function to check if new page is needed
    const checkNewPage = (requiredSpace = 100) => {
      if (yPosition < requiredSpace) {
        const newPageData = addPageWithLogo();
        page = newPageData.page;
        yPosition = newPageData.height - 50;
        return true;
      }
      return false;
    };
    
    // HEADER - Page 1
    page.drawText('MALAYSIA PICKLEBALL ASSOCIATION', {
      x: 50,
      y: yPosition,
      size: 20,
      font: helveticaBoldFont,
      color: headerColor
    });
    yPosition -= 25;
    
    page.drawText('Tournament Application Form', {
      x: 50,
      y: yPosition,
      size: 16,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4)
    });
    yPosition -= 20;
    
    page.drawText(`Application ID: ${applicationData.applicationId}`, {
      x: 50,
      y: yPosition,
      size: 11,
      font: helveticaBoldFont,
      color: textColor
    });
    yPosition -= 15;
    
    page.drawText(`Submission Date: ${new Date(applicationData.submissionDate).toLocaleDateString()}`, {
      x: 50,
      y: yPosition,
      size: 11,
      font: helveticaFont,
      color: textColor
    });
    yPosition -= 30;
    
    // Draw line under header
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: width - 50, y: yPosition },
      thickness: 2,
      color: headerColor
    });
    yPosition -= 25;
    
    // Function to add section
    const addSectionContent = (title, items) => {
      checkNewPage(80);
      
      // Section header background
      page.drawRectangle({
        x: 50,
        y: yPosition - 15,
        width: width - 100,
        height: 20,
        color: headerColor
      });
      
      // Section title
      page.drawText(title, {
        x: 60,
        y: yPosition - 10,
        size: 12,
        font: helveticaBoldFont,
        color: rgb(1, 1, 1)
      });
      yPosition -= 30;
      
      // Section items
      items.forEach(item => {
        if (item.value) {
          checkNewPage(25);
          
          page.drawText(`${item.label}:`, {
            x: 60,
            y: yPosition,
            size: 11,
            font: helveticaBoldFont,
            color: labelColor
          });
          
          // Handle long text with wrapping
          if (item.value.length > 50) {
            yPosition = addWrappedText(item.value, 250, yPosition, width - 300, { size: 11 });
          } else {
            page.drawText(item.value, {
              x: 250,
              y: yPosition,
              size: 11,
              font: helveticaFont,
              color: textColor
            });
            yPosition -= 18;
          }
        }
      });
      yPosition -= 10;
    };
    
    // ORGANISER INFORMATION
    addSectionContent('ORGANISER INFORMATION', [
      { label: 'Organiser Name', value: applicationData.organiserName },
      { label: 'Registration Number', value: applicationData.registrationNo },
      { label: 'Contact Number', value: applicationData.telContact },
      { label: 'Email Address', value: applicationData.email },
      { label: 'Organising Partner', value: applicationData.organisingPartner }
    ]);
    
    // EVENT DETAILS
    addSectionContent('EVENT DETAILS', [
      { label: 'Event Title', value: applicationData.eventTitle },
      { label: 'Event Start Date', value: applicationData.eventStartDateFormatted },
      { label: 'Event End Date', value: applicationData.eventEndDateFormatted },
      { label: 'State', value: applicationData.state },
      { label: 'City', value: applicationData.city },
      { label: 'Venue', value: applicationData.venue },
      { label: 'Classification', value: applicationData.classification },
      { label: 'Expected Participants', value: applicationData.expectedParticipants?.toString() },
      { label: 'Event Summary', value: applicationData.eventSummary }
    ]);
    
    // TOURNAMENT SETTINGS
    const scoringText = applicationData.scoringFormat === 'traditional' 
      ? 'Traditional (11 points, win by 2)' 
      : 'Rally (15 points, win by 2)';
      
    addSectionContent('TOURNAMENT SETTINGS', [
      { label: 'Scoring Format', value: scoringText }
    ]);
    
    // CONSENT STATEMENTS
    checkNewPage(100);
    
    page.drawRectangle({
      x: 50,
      y: yPosition - 15,
      width: width - 100,
      height: 20,
      color: headerColor
    });
    
    page.drawText('CONSENT STATEMENTS', {
      x: 60,
      y: yPosition - 10,
      size: 12,
      font: helveticaBoldFont,
      color: rgb(1, 1, 1)
    });
    yPosition -= 35;
    
    // Data Processing Consent
    page.drawText('1. Data Processing Consent:', {
      x: 60,
      y: yPosition,
      size: 11,
      font: helveticaBoldFont,
      color: textColor
    });
    yPosition -= 18;
    
    const dataConsentText = `I consent to the collection, use, and processing of my personal data by Malaysia Pickleball Association (MPA) for the purposes of tournament organization, administration, and related communications. I understand that my data will be handled in accordance with applicable data protection laws.`;
    
    yPosition = addWrappedText(dataConsentText, 70, yPosition, width - 130, { size: 11 });
    
    const dataStatus = `Status: ${applicationData.dataConsent ? 'AGREED AND CONSENTED' : 'NOT CONSENTED'}`;
    page.drawText(dataStatus, {
      x: 70,
      y: yPosition,
      size: 11,
      font: helveticaBoldFont,
      color: applicationData.dataConsent ? rgb(0, 0.6, 0) : rgb(0.8, 0, 0)
    });
    yPosition -= 30;
    
    // Terms and Conditions Consent
    checkNewPage(100);
    
    page.drawText('2. Terms and Conditions Consent:', {
      x: 60,
      y: yPosition,
      size: 11,
      font: helveticaBoldFont,
      color: textColor
    });
    yPosition -= 18;
    
    const termsConsentText = `I have read, understood, and agree to abide by the Terms and Conditions set forth by Malaysia Pickleball Association (MPA) for tournament participation and organization. I acknowledge that failure to comply with these terms may result in disqualification or other appropriate actions.`;
    
    yPosition = addWrappedText(termsConsentText, 70, yPosition, width - 130, { size: 11 });
    
    const termsStatus = `Status: ${applicationData.termsConsent ? 'AGREED AND ACCEPTED' : 'NOT ACCEPTED'}`;
    page.drawText(termsStatus, {
      x: 70,
      y: yPosition,
      size: 11,
      font: helveticaBoldFont,
      color: applicationData.termsConsent ? rgb(0, 0.6, 0) : rgb(0.8, 0, 0)
    });
    yPosition -= 30;
    
    // Footer - ensure proper margin
    checkNewPage(120);
    
    // Add some space before footer
    yPosition -= 30;
    
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: width - 50, y: yPosition },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8)
    });
    yPosition -= 25;
    
    page.drawText('This application is submitted to Malaysia Pickleball Association (MPA) for tournament approval.', {
      x: 50,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: textColor
    });
    yPosition -= 18;
    
    page.drawText('For inquiries, please contact: tournament@malaysiapickleballassociation.org', {
      x: 50,
      y: yPosition,
      size: 10,
      font: helveticaBoldFont,
      color: headerColor
    });
    yPosition -= 18;
    
    page.drawText(`Generated on: ${new Date().toLocaleString()}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: textColor
    });
    
    // Serialize the PDFDocument to bytes
    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);
    
    console.log('[OK] Enhanced PDF generated successfully, size:', buffer.length, 'bytes');
    console.log('[OK] Includes: MPA logo background, consent statements (data processing & terms acceptance)');
    return buffer;
    
  } catch (error) {
    console.error('[ERROR] Error generating PDF:', error);
    throw error;
  }
};

// Email sending function
const sendEmail = async (to, template, attachments = []) => {
  try {
    console.log('📧 Preparing to send email to:', to);
    console.log('📧 Attachments count:', attachments.length);
    
    if (attachments.length > 0) {
      attachments.forEach((attachment, index) => {
        console.log(`📎 Attachment ${index + 1}: ${attachment.filename} (${attachment.content ? attachment.content.length : 0} bytes)`);
      });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@malaysiapickleball.my',
      to: to,
      subject: template.subject,
      html: template.html,
      attachments: attachments
    };

    console.log('📧 Sending email...');
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
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
  },
  // Admin remarks/rejection reason
  remarks: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const TournamentApplication = mongoose.model('TournamentApplication', tournamentApplicationSchema);

// Organization Registration Schema
const organizationSchema = new mongoose.Schema({
  organizationId: {
    type: String,
    unique: true
  },
  organizationName: {
    type: String,
    required: true
  },
  registrationNo: {
    type: String,
    required: true,
    unique: true
  },
  applicantFullName: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    validate: {
      validator: function(password) {
        // Password must contain: uppercase, lowercase, number, and symbol
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
        
        return password.length >= 8 && hasUppercase && hasLowercase && hasNumber && hasSymbol;
      },
      message: 'Password must be at least 8 characters and contain uppercase, lowercase, number, and symbol.'
    }
  },
  addressLine1: {
    type: String,
    required: true
  },
  addressLine2: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    required: true
  },
  postcode: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true,
    default: 'Malaysia'
  },
  status: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active'
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Organization = mongoose.model('Organization', organizationSchema);

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
    enum: ['super_admin', 'admin'],
    default: 'admin'
  },
  status: {
    type: String,
    enum: ['active', 'disabled'],
    default: 'active'
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const AdminUser = mongoose.model('AdminUser', adminUserSchema);

// Generate unique organization ID
const generateOrganizationId = async () => {
  let organizationId;
  let isUnique = false;
  
  while (!isUnique) {
    // Generate 5-digit random number
    const randomNum = Math.floor(Math.random() * 90000) + 10000; // Ensures 5 digits (10000-99999)
    organizationId = `MPO${randomNum}`;
    
    // Check if this ID already exists
    const existingOrg = await Organization.findOne({ organizationId });
    if (!existingOrg) {
      isUnique = true;
    }
  }
  
  return organizationId;
};

// Routes

// Organization registration endpoint
app.post('/api/organizations/register', async (req, res) => {
  try {
    const {
      organizationName,
      registrationNo,
      applicantFullName,
      phoneNumber,
      email,
      password,
      addressLine1,
      addressLine2,
      city,
      postcode,
      state,
      country
    } = req.body;

    // Check if organization with this registration number already exists
    const existingOrganization = await Organization.findOne({ registrationNo });
    if (existingOrganization) {
      return res.status(400).json({ 
        error: 'An organization with this registration number already exists' 
      });
    }

    // Check if organization with this email already exists
    const existingEmail = await Organization.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ 
        error: 'An organization with this email address already exists' 
      });
    }

    // Generate unique organization ID
    const organizationId = await generateOrganizationId();

    // Create new organization
    const organization = new Organization({
      organizationId,
      organizationName,
      registrationNo,
      applicantFullName,
      phoneNumber,
      email,
      password,
      addressLine1,
      addressLine2,
      city,
      postcode,
      state,
      country
    });

    await organization.save();

    // Send confirmation email
    const mailOptions = {
      from: `"Malaysia Pickleball Association" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Organization Registration Successful - Malaysia Pickleball Association',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2c3e50, #3498db); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .success-badge { background: #28a745; color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; margin: 20px 0; font-weight: bold; }
            .info-card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .info-label { font-weight: bold; color: #2c3e50; display: inline-block; min-width: 120px; }
            .login-section { background: #e3f2fd; padding: 20px; border-left: 4px solid #2196f3; margin: 20px 0; border-radius: 4px; }
            .btn { background: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome to Malaysia Pickleball Association</h1>
            <p>Your organization has been successfully registered!</p>
          </div>
          
          <div class="content">
            <div class="success-badge">✅ Registration Successful</div>
            
            <p>Dear <strong>${applicantFullName}</strong>,</p>
            
            <p>Congratulations! Your organization registration has been completed successfully. You are now part of the Malaysia Pickleball Association community.</p>
            
            <div class="info-card">
              <h3>📋 Registration Details</h3>
              <p><span class="info-label">Organization ID:</span> <strong>${organizationId}</strong></p>
              <p><span class="info-label">Organization:</span> ${organizationName}</p>
              <p><span class="info-label">Registration No:</span> ${registrationNo}</p>
              <p><span class="info-label">Applicant Name:</span> ${applicantFullName}</p>
              <p><span class="info-label">Email:</span> ${email}</p>
              <p><span class="info-label">Phone:</span> ${phoneNumber}</p>
            </div>
            
            <div class="login-section">
              <h3>🔐 Access Your Tournament Portal</h3>
              <p>You can now log in to access the tournament application form using your registered credentials:</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Password:</strong> Your registered password</p>
              <p>Visit our portal and click "Apply for Tournament" to get started!</p>
            </div>
            
            <h3>🎯 What's Next?</h3>
            <ul>
              <li>Use your registered email and password to log in</li>
              <li>Access the tournament application form</li>
              <li>Submit tournament applications for MPA sanctioning</li>
              <li>Track your application status through the portal</li>
            </ul>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            
            <div class="footer">
              <p><strong>Malaysia Pickleball Association</strong><br>
              Email: tournament@malaysiapickleballassociation.org<br>
              Official Tournament Management Portal</p>
              <p><em>This email was sent automatically. Please do not reply to this email.</em></p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Registration confirmation email sent to:', email);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the registration if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Organization registered successfully',
      organization: {
        id: organization._id,
        organizationId: organization.organizationId,
        organizationName: organization.organizationName,
        registrationNo: organization.registrationNo,
        applicantFullName: organization.applicantFullName,
        phoneNumber: organization.phoneNumber,
        email: organization.email
      }
    });

  } catch (error) {
    console.error('Organization registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Organization login endpoint
app.post('/api/organizations/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find organization by email and password
    const organization = await Organization.findOne({ 
      email: email,
      password: password
    });

    if (!organization) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials. Please check your email and password.' 
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      organization: {
        id: organization._id,
        organizationId: organization.organizationId,
        organizationName: organization.organizationName,
        registrationNo: organization.registrationNo,
        applicantFullName: organization.applicantFullName,
        phoneNumber: organization.phoneNumber,
        email: organization.email,
        organizationAddress: organization.organizationAddress
      }
    });

  } catch (error) {
    console.error('Organization login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all registered organizations (for admin)
app.get('/api/organizations', async (req, res) => {
  try {
    // First, fix any organizations without registeredAt field
    await Organization.updateMany(
      { registeredAt: { $exists: false } },
      [{ $set: { registeredAt: "$createdAt" } }]
    );
    
    const organizations = await Organization.find({}, {
      password: 0 // Exclude password from response
    }).sort({ registeredAt: -1 });
    
    res.json(organizations);
  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Suspend organization (for admin)
app.patch('/api/organizations/:id/suspend', async (req, res) => {
  try {
    const { id } = req.params;
    const organization = await Organization.findById(id);
    
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    organization.status = 'suspended';
    await organization.save();
    
    res.json({ 
      success: true, 
      message: 'Organization suspended successfully',
      organizationId: organization.organizationId 
    });
  } catch (error) {
    console.error('Suspend organization error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reactivate organization (for admin)
app.patch('/api/organizations/:id/reactivate', async (req, res) => {
  try {
    const { id } = req.params;
    const organization = await Organization.findById(id);
    
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    organization.status = 'active';
    await organization.save();
    
    res.json({ 
      success: true, 
      message: 'Organization reactivated successfully',
      organizationId: organization.organizationId 
    });
  } catch (error) {
    console.error('Reactivate organization error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete organization permanently (for admin)
app.delete('/api/organizations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const organization = await Organization.findById(id);
    
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    const organizationId = organization.organizationId;
    const organizationName = organization.organizationName;
    
    await Organization.findByIdAndDelete(id);
    
    console.log(`Organization permanently deleted: ${organizationId} - ${organizationName}`);
    
    res.json({ 
      success: true, 
      message: 'Organization permanently deleted',
      organizationId: organizationId 
    });
  } catch (error) {
    console.error('Delete organization error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all tournament applications (for admin)
app.get('/api/applications', async (req, res) => {
  try {
    const applications = await TournamentApplication.find().sort({ submissionDate: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tournament applications by organization (for organization dashboard)
app.get('/api/applications/organization/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const applications = await TournamentApplication.find({ email }).sort({ submissionDate: -1 });
    res.json(applications);
  } catch (error) {
    console.error('Get organization applications error:', error);
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
    
    // Send confirmation email to the organiser with PDF attachment
    if (savedApplication.email) {
      try {
        // Generate PDF
        const pdfBuffer = await generateApplicationPDF(savedApplication);
        
        // Create attachment
        const attachments = [{
          filename: `Tournament_Application_${savedApplication.applicationId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }];
        
        const emailTemplate = emailTemplates.applicationSubmitted(savedApplication);
        const emailResult = await sendEmail(savedApplication.email, emailTemplate, attachments);
        
        if (!emailResult.success) {
          console.error('Failed to send confirmation email:', emailResult.error);
          // Still return success for the application, even if email fails
        }
      } catch (pdfError) {
        console.error('Failed to generate PDF:', pdfError);
        // Still try to send email without PDF
        const emailTemplate = emailTemplates.applicationSubmitted(savedApplication);
        const emailResult = await sendEmail(savedApplication.email, emailTemplate);
        
        if (!emailResult.success) {
          console.error('Failed to send confirmation email:', emailResult.error);
          // Still return success for the application, even if email fails
        }
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
    const { status, rejectionReason } = req.body;
    const updateData = { 
      status, 
      lastUpdated: Date.now() 
    };
    
    // Add rejection reason if status is rejected
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
    
    // Send approval email if status is changed to 'Approved'
    if (status === 'Approved' && application.email) {
      const emailTemplate = emailTemplates.applicationApproved(application);
      const emailResult = await sendEmail(application.email, emailTemplate);
      
      if (!emailResult.success) {
        console.error('Failed to send approval email:', emailResult.error);
        // Still return success for the status update, even if email fails
      }
    }
    
    // Send rejection email if status is changed to 'Rejected'
    if (status === 'Rejected' && application.email && rejectionReason) {
      const emailTemplate = emailTemplates.applicationRejected(application, rejectionReason);
      const emailResult = await sendEmail(application.email, emailTemplate);
      
      if (!emailResult.success) {
        console.error('Failed to send rejection email:', emailResult.error);
        // Still return success for the status update, even if email fails
      }
    }
    
    res.json(application);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete tournament application (admin only)
app.delete('/api/applications/:id', async (req, res) => {
  try {
    console.log('Delete request received for application ID:', req.params.id);
    const application = await TournamentApplication.findOneAndDelete({
      applicationId: req.params.id
    });
    
    if (!application) {
      console.log('Application not found with ID:', req.params.id);
      return res.status(404).json({ error: 'Application not found' });
    }
    
    console.log('Application deleted successfully:', application.applicationId);
    res.json({ 
      message: 'Application deleted successfully',
      deletedApplication: {
        applicationId: application.applicationId,
        eventTitle: application.eventTitle,
        organiserName: application.organiserName
      }
    });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin login endpoint
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
    
    // Check hardcoded super admin credentials first
    if (trimmedUsername === 'admin' && trimmedPassword === 'admin123') {
      console.log('Login successful for hardcoded super admin');
      loginSuccessful = true;
      userAuthority = 'super_admin';
    } else {
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
      error: 'Internal server error',
      message: 'Something went wrong. Please try again.'
    });
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

// Admin User Management Endpoints

// Create new admin user
app.post('/api/admin/users', async (req, res) => {
  try {
    console.log('Creating new admin user:', req.body);
    const { username, password, email, fullName, authorityLevel } = req.body;
    
    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Check if username already exists
    const existingUser = await AdminUser.findOne({ username: username.trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Create new admin user
    const newAdminUser = new AdminUser({
      username: username.trim(),
      password: password.trim(), // In production, hash this password
      email: email ? email.trim() : null,
      fullName: fullName ? fullName.trim() : null,
      authorityLevel: authorityLevel || 'admin',
      status: 'active'
    });

    await newAdminUser.save();
    console.log('New admin user created successfully');

    res.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: newAdminUser._id,
        username: newAdminUser.username,
        email: newAdminUser.email,
        fullName: newAdminUser.fullName,
        authorityLevel: newAdminUser.authorityLevel,
        status: newAdminUser.status,
        createdAt: newAdminUser.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to create admin user'
    });
  }
});

// Get all admin users
app.get('/api/admin/users', async (req, res) => {
  try {
    const adminUsers = await AdminUser.find({}, '-password').sort({ createdAt: -1 });
    res.json({
      success: true,
      users: adminUsers
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch admin users'
    });
  }
});

// Update admin user status
app.patch('/api/admin/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['active', 'disabled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "active" or "disabled"'
      });
    }

    const updatedUser = await AdminUser.findByIdAndUpdate(
      id,
      { status },
      { new: true, select: '-password' }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    res.json({
      success: true,
      message: 'User status updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to update user status'
    });
  }
});

// Delete admin user
app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedUser = await AdminUser.findByIdAndDelete(id);
    
    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    res.json({
      success: true,
      message: 'Admin user deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting admin user:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete admin user'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Catch-all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});