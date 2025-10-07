// Load environment variables FIRST before any other imports
const fs = require('fs');
if (fs.existsSync('.env.local')) {
  require('dotenv').config({ path: '.env.local' });
  console.log('📁 Using .env.local (local development mode)');
} else {
  require('dotenv').config();
  console.log('📁 Using .env (production mode)');
}

// Debug: Verify Cloudinary env vars are loaded
console.log('🔍 Cloudinary env check:', {
  CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? '✓ Set' : '✗ Missing',
  API_KEY: process.env.CLOUDINARY_API_KEY ? '✓ Set' : '✗ Missing',
  API_SECRET: process.env.CLOUDINARY_API_SECRET ? '✓ Set' : '✗ Missing'
});

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const multer = require('multer');
const { profileStorage, newsStorage, journeyStorage, applicationStorage } = require('./cloudinaryConfig');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'build')));

// Import database configuration
const { getDatabaseConfig, displayEnvironmentInfo, isLocalDevelopment } = require('./config/database');

// Get database configuration
const dbConfig = getDatabaseConfig();
const MONGODB_URI = dbConfig.uri;
const IS_LOCAL_DEV = isLocalDevelopment();

// Display environment info
displayEnvironmentInfo();

mongoose.connect(MONGODB_URI)
.then(() => console.log(`✅ Connected to MongoDB (${dbConfig.type})`))
.catch((err) => console.error('MongoDB connection error:', err));

// Configure multer for file uploads with Cloudinary
const uploadProfile = multer({
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const uploadNews = multer({
  storage: newsStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const uploadJourney = multer({
  storage: journeyStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Store application documents in memory (MongoDB)
const uploadApplication = multer({
  storage: multer.memoryStorage(), // Store in memory, then save to MongoDB
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Legacy upload (keep for backward compatibility if needed)
const upload = uploadProfile;

// Function to generate unique application ID
function generateApplicationId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return 'MPA' + result;
}



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

        <div style="background-color: #e8f4fd; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2c5aa0;">
          <h4 style="color: #2c5aa0; margin-top: 0;">📎 Application PDF Attached</h4>
          <p style="margin-bottom: 0;">A complete PDF copy of your tournament application is attached to this email, containing all the information you submitted including:</p>
          <ul style="margin-top: 8px; margin-bottom: 0; padding-left: 20px;">
            <li>Organiser information and contact details</li>
            <li>Complete event details and venue information</li>
            <li>All tournament categories with entry fees</li>
            <li>Scoring format and tournament settings</li>
            <li>Consent statements and agreements</li>
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
  }),

  applicationMoreInfoRequired: (applicationData, requiredInfo) => ({
    subject: 'Additional Information Required - Malaysia Pickleball Association',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #2c5aa0;">Malaysia Pickleball Association</h2>
          <h3 style="color: #666;">Tournament Application Update</h3>
        </div>

        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h4 style="color: #856404; margin-top: 0;">📋 Additional Information Required</h4>
          <p><strong>Application ID:</strong> ${applicationData.applicationId}</p>
          <p><strong>Event Title:</strong> ${applicationData.eventTitle}</p>
          <p><strong>Organiser:</strong> ${applicationData.organiserName}</p>
          <p><strong>Event Date:</strong> ${new Date(applicationData.eventStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} - ${new Date(applicationData.eventEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          <p><strong>Location:</strong> ${applicationData.city}, ${applicationData.state}</p>
        </div>

        <div style="background-color: #e8f4fd; border-left: 4px solid #2c5aa0; padding: 20px; margin-bottom: 20px;">
          <h4 style="color: #2c5aa0; margin-top: 0;">Required Information:</h4>
          <p style="color: #1e3a8a; line-height: 1.6; margin-bottom: 0;">${requiredInfo}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h4>How to provide the information:</h4>
          <ul style="line-height: 1.6;">
            <li>Reply to this email with the requested information and documents</li>
            <li>Ensure all documents are clear and properly formatted</li>
            <li>Include your Application ID (${applicationData.applicationId}) in your response</li>
            <li>Submit the information as soon as possible to avoid processing delays</li>
          </ul>
        </div>

        <div style="background-color: #e7f3ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h4 style="color: #0056b3; margin-top: 0;">Important Notes:</h4>
          <ul style="margin-bottom: 0; line-height: 1.6;">
            <li>Your application is on hold until we receive the requested information</li>
            <li>Processing will resume immediately once you provide the required details</li>
            <li>If you need clarification on what's required, please contact us</li>
            <li>Please provide the information within 7 days to avoid delays</li>
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
      const newPage = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
      const { width, height } = newPage.getSize();

      // Add logo as background if available
      if (logoImage) {
        const logoSize = 150;
        newPage.drawImage(logoImage, {
          x: width / 2 - logoSize / 2,
          y: height / 2 - logoSize / 2,
          width: logoSize,
          height: logoSize,
          opacity: 0.05 // Very light background
        });
      }

      return { page: newPage, width, height };
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
      const bottomMargin = 80; // Reserve space for footer
      if (yPosition < (requiredSpace + bottomMargin)) {
        const newPageData = addPageWithLogo();
        page = newPageData.page;
        yPosition = newPageData.height - 50;
        return true;
      }
      return false;
    };

    // Helper function to add footer to current page
    const addFooter = () => {
      const footerY = 80; // Fixed footer position from bottom

      // Footer separator line
      page.drawLine({
        start: { x: 50, y: footerY + 40 },
        end: { x: width - 50, y: footerY + 40 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8)
      });

      // Footer content
      page.drawText('This application is submitted to Malaysia Pickleball Association (MPA) for tournament approval.', {
        x: 50,
        y: footerY + 25,
        size: 10,
        font: helveticaFont,
        color: textColor
      });

      page.drawText('For inquiries, please contact: tournament@malaysiapickleballassociation.org', {
        x: 50,
        y: footerY + 10,
        size: 10,
        font: helveticaBoldFont,
        color: headerColor
      });

      page.drawText(`Generated on: ${new Date().toLocaleString()}`, {
        x: 50,
        y: footerY - 5,
        size: 10,
        font: helveticaFont,
        color: textColor
      });
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
      checkNewPage(120); // Increased space check for section headers

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
          checkNewPage(40); // Better spacing check for each item

          page.drawText(`${item.label}:`, {
            x: 60,
            y: yPosition,
            size: 11,
            font: helveticaBoldFont,
            color: labelColor
          });

          // Handle long text with wrapping
          if (item.value.length > 50) {
            const newY = addWrappedText(item.value, 250, yPosition, width - 300, { size: 11 });
            yPosition = newY - 10; // Add some spacing after wrapped text
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
      yPosition -= 15; // Increased section spacing
    };
    
    // ORGANISER INFORMATION
    addSectionContent('ORGANISER INFORMATION', [
      { label: 'Organiser Name', value: applicationData.organiserName },
      { label: 'Registration Number', value: applicationData.registrationNo },
      { label: 'Contact Number', value: applicationData.telContact },
      { label: 'Person in Charge', value: applicationData.personInCharge },
      { label: 'Email Address', value: applicationData.email },
      { label: 'Organising Partner', value: applicationData.organisingPartner || 'Not applicable' }
    ]);
    
    // EVENT DETAILS
    addSectionContent('EVENT DETAILS', [
      { label: 'Event Title', value: applicationData.eventTitle },
      { label: 'Event Start Date', value: applicationData.eventStartDateFormatted || new Date(applicationData.eventStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) },
      { label: 'Event End Date', value: applicationData.eventEndDateFormatted || new Date(applicationData.eventEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) },
      { label: 'State', value: applicationData.state },
      { label: 'City', value: applicationData.city },
      { label: 'Venue', value: applicationData.venue },
      { label: 'Level of Event', value: applicationData.classification },
      { label: 'Type of Event', value: applicationData.eventType },
      { label: 'Expected Participants', value: applicationData.expectedParticipants?.toString() },
      { label: 'Event Summary', value: applicationData.eventSummary }
    ]);

    // TOURNAMENT CATEGORIES & ENTRY FEES
    if (applicationData.categories && applicationData.categories.length > 0) {
      checkNewPage(150); // More space for categories section

      // Section header background
      page.drawRectangle({
        x: 50,
        y: yPosition - 15,
        width: width - 100,
        height: 20,
        color: headerColor
      });

      // Section title
      page.drawText('TOURNAMENT CATEGORIES & ENTRY FEES', {
        x: 60,
        y: yPosition - 10,
        size: 12,
        font: helveticaBoldFont,
        color: rgb(1, 1, 1)
      });
      yPosition -= 40;

      // Categories details
      applicationData.categories.forEach((category, index) => {
        checkNewPage(100); // Check space for each category

        // Category number header
        page.drawText(`Category ${index + 1}:`, {
          x: 60,
          y: yPosition,
          size: 11,
          font: helveticaBoldFont,
          color: textColor
        });
        yPosition -= 20;

        // Category details
        page.drawText('Category:', {
          x: 80,
          y: yPosition,
          size: 10,
          font: helveticaBoldFont,
          color: labelColor
        });
        page.drawText(category.category || 'Not specified', {
          x: 200,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: textColor
        });
        yPosition -= 15;

        page.drawText('Malaysian Entry Fee:', {
          x: 80,
          y: yPosition,
          size: 10,
          font: helveticaBoldFont,
          color: labelColor
        });
        page.drawText(`RM ${category.malaysianEntryFee?.toFixed(2) || '0.00'} per player`, {
          x: 200,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: textColor
        });
        yPosition -= 15;

        page.drawText('International Entry Fee:', {
          x: 80,
          y: yPosition,
          size: 10,
          font: helveticaBoldFont,
          color: labelColor
        });
        const intlFee = category.internationalEntryFee > 0 ? `RM ${category.internationalEntryFee?.toFixed(2)} per player` : 'Not applicable';
        page.drawText(intlFee, {
          x: 200,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: textColor
        });
        yPosition -= 30; // Extra space between categories
      });

      yPosition -= 15;
    }

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
    
    // Add footer to all pages
    const pages = pdfDoc.getPages();
    pages.forEach((currentPage) => {
      page = currentPage;
      addFooter();
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
  personInCharge: {
    type: String,
    required: false
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
  eventStartDateFormatted: {
    type: String,
    required: false
  },
  eventEndDateFormatted: {
    type: String,
    required: false
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
  eventType: {
    type: String,
    required: false,
    enum: ['Open', 'Closed']
  },
  expectedParticipants: {
    type: Number,
    required: true
  },
  eventSummary: {
    type: String,
    required: true
  },
  // Tournament Categories
  categories: [{
    category: {
      type: String,
      required: true
    },
    malaysianEntryFee: {
      type: Number,
      required: true,
      max: 200
    },
    internationalEntryFee: {
      type: Number,
      required: false,
      default: 0
    }
  }],
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
  // Support Documents
  supportDocuments: [{
    filename: String,
    originalname: String,
    mimetype: String,
    size: Number,
    path: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
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
  },
  requiredInfo: {
    type: String,
    default: ''
  },
  // Flag to identify admin-created tournaments
  createdByAdmin: {
    type: Boolean,
    default: false
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
  },
  documents: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

const Organization = mongoose.model('Organization', organizationSchema);

// Message Schema for Admin-Organiser Communication
const messageSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true,
    unique: true
  },
  fromType: {
    type: String,
    required: true,
    enum: ['admin', 'organiser']
  },
  fromId: {
    type: String,
    required: true
  },
  fromName: {
    type: String,
    required: true
  },
  toType: {
    type: String,
    required: true,
    enum: ['admin', 'organiser']
  },
  toId: {
    type: String,
    required: true
  },
  toName: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  category: {
    type: String,
    enum: ['tournament', 'general', 'technical', 'urgent'],
    default: 'general'
  },
  relatedApplicationId: {
    type: String,
    default: null
  },
  attachments: [{
    fileName: String,
    filePath: String,
    fileSize: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const Message = mongoose.model('Message', messageSchema);

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

// Player/Member Schema
const playerSchema = new mongoose.Schema({
  playerId: {
    type: String,
    unique: true,
    required: true
  },
  username: {
    type: String,
    unique: true,
    required: true,
    sparse: true
  },
  password: {
    type: String,
    required: true
  },
  profilePicture: {
    type: String
  },
  personalInfo: {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['Male', 'Female'], required: true },
    nationality: { type: String, default: 'Malaysian' },
    icNumber: { type: String, required: true, unique: true },
    address: {
      street: String,
      city: String,
      state: String,
      postcode: String,
      country: { type: String, default: 'Malaysia' }
    }
  },
  playerInfo: {
    skillLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Professional'], default: 'Beginner' },
    yearStarted: Number,
    achievements: [String],
    playingHand: { type: String, enum: ['Right', 'Left'], default: 'Right' }
  },
  membership: {
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
    membershipType: { type: String, enum: ['Standard', 'Premium', 'Student', 'Senior'], default: 'Standard' },
    registrationDate: { type: Date, default: Date.now },
    expiryDate: Date,
    organizationId: { type: String, ref: 'Organization' }
  },
  rankings: {
    national: { position: Number, points: Number },
    state: { position: Number, points: Number },
    district: { position: Number, points: Number }
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  }
}, { timestamps: true });

const Player = mongoose.model('Player', playerSchema);

// Court/Venue Schema
const venueSchema = new mongoose.Schema({
  venueId: {
    type: String,
    unique: true,
    required: true
  },
  basicInfo: {
    name: { type: String, required: true },
    description: String,
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postcode: { type: String, required: true },
      country: { type: String, default: 'Malaysia' }
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  facilities: {
    totalCourts: { type: Number, required: true },
    indoorCourts: { type: Number, default: 0 },
    outdoorCourts: { type: Number, default: 0 },
    lighting: { type: Boolean, default: false },
    parking: { type: Boolean, default: false },
    restrooms: { type: Boolean, default: false },
    cafeteria: { type: Boolean, default: false },
    proShop: { type: Boolean, default: false },
    airConditioning: { type: Boolean, default: false }
  },
  contact: {
    phone: String,
    email: String,
    website: String,
    manager: String
  },
  pricing: {
    hourlyRate: Number,
    currency: { type: String, default: 'MYR' },
    memberDiscount: Number
  },
  availability: {
    operatingHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String }
    },
    closedDays: [String]
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'closed'],
    default: 'active'
  },
  ownerId: { type: String, ref: 'Organization' }
}, { timestamps: true });

const Venue = mongoose.model('Venue', venueSchema);

// Event/Match Schema
const eventSchema = new mongoose.Schema({
  eventId: {
    type: String,
    unique: true,
    required: true
  },
  basicInfo: {
    title: { type: String, required: true },
    description: String,
    type: { type: String, enum: ['Tournament', 'Training', 'Social', 'League', 'Workshop'], required: true },
    status: { type: String, enum: ['Draft', 'Published', 'Registration Open', 'Registration Closed', 'Ongoing', 'Completed', 'Cancelled'], default: 'Draft' },
    visibility: { type: String, enum: ['Public', 'Private', 'Members Only'], default: 'Public' }
  },
  schedule: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    registrationDeadline: Date,
    schedule: [String]
  },
  location: {
    venueId: { type: String, ref: 'Venue' },
    venueName: String,
    address: String,
    city: String,
    state: String
  },
  participants: {
    maxParticipants: Number,
    minParticipants: Number,
    currentParticipants: { type: Number, default: 0 },
    registeredPlayers: [{ playerId: String, registrationDate: Date, status: String }],
    waitingList: [{ playerId: String, registrationDate: Date }]
  },
  categories: [{
    name: String,
    ageGroup: String,
    skillLevel: String,
    gender: String,
    maxParticipants: Number,
    entryFee: Number
  }],
  prizes: {
    totalPrizePool: Number,
    currency: { type: String, default: 'MYR' },
    distribution: [{
      position: String,
      amount: Number,
      trophy: String
    }]
  },
  organizer: {
    organizationId: { type: String, ref: 'Organization' },
    organizerName: String,
    contactEmail: String,
    contactPhone: String
  },
  requirements: {
    minimumSkillLevel: String,
    equipmentProvided: [String],
    requiredDocuments: [String]
  }
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);

// Booking Schema
const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true,
    required: true
  },
  venueId: { type: String, ref: 'Venue', required: true },
  playerId: { type: String, ref: 'Player', required: true },
  bookingDetails: {
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    courtNumber: String,
    purpose: { type: String, enum: ['Training', 'Match', 'Social', 'Tournament'], default: 'Training' }
  },
  payment: {
    amount: { type: Number, required: true },
    currency: { type: String, default: 'MYR' },
    status: { type: String, enum: ['Pending', 'Paid', 'Refunded', 'Failed'], default: 'Pending' },
    paymentMethod: String,
    transactionId: String,
    paymentDate: Date
  },
  status: {
    type: String,
    enum: ['Confirmed', 'Pending', 'Cancelled', 'Completed'],
    default: 'Pending'
  },
  additionalServices: [{
    service: String,
    cost: Number
  }],
  notes: String
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);

// News/Announcement Schema
const newsSchema = new mongoose.Schema({
  newsId: {
    type: String,
    unique: true,
    required: true
  },
  title: { type: String, required: true },
  content: { type: String, required: true },
  summary: String,
  category: { type: String, enum: ['News', 'Announcement', 'Tournament', 'Training', 'General'], default: 'General' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  status: { type: String, enum: ['Draft', 'Published', 'Archived'], default: 'Draft' },
  publishDate: { type: Date, default: Date.now },
  expiryDate: Date,
  author: {
    organizationId: { type: String, ref: 'Organization' },
    authorName: String,
    authorEmail: String
  },
  media: [{
    type: { type: String },
    url: String,
    caption: String
  }],
  tags: [String],
  views: { type: Number, default: 0 }
}, { timestamps: true });

const News = mongoose.model('News', newsSchema);

// Featured Video Schema
const featuredVideoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  videoUrl: { type: String, required: true },  // YouTube embed URL
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const FeaturedVideo = mongoose.model('FeaturedVideo', featuredVideoSchema);

// Assessment Form Schema
const assessmentFormSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    minlength: 5,
    maxlength: 5
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  titleMalay: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  subtitle: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  subtitleMalay: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  questions: [{
    id: {
      type: Number,
      required: true
    },
    question: {
      type: String,
      required: true
    },
    questionMalay: {
      type: String,
      required: false,
      default: ''
    },
    section: {
      type: String,
      required: true
    },
    options: [{
      text: {
        type: String,
        required: true
      },
      malay: {
        type: String,
        required: false,
        default: ''
      }
    }],
    correctAnswer: {
      type: String,
      required: true
    }
  }],
  timeLimit: {
    type: Number,
    required: true,
    min: 1,
    max: 180
  },
  // Draft field
  isDraft: {
    type: Boolean,
    default: false
  },
  // Temporary form fields
  isTemporary: {
    type: Boolean,
    default: false
  },
  parentFormId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AssessmentForm',
    required: function() {
      return this.isTemporary;
    }
  },
  expiresAt: {
    type: Date,
    required: function() {
      return this.isTemporary;
    },
    index: { expireAfterSeconds: 0 } // MongoDB TTL index for auto-deletion
  },
  generatedBy: {
    type: String, // Could be IP address or user identifier
    required: function() {
      return this.isTemporary;
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries on temporary forms
assessmentFormSchema.index({ isTemporary: 1, expiresAt: 1 });
assessmentFormSchema.index({ parentFormId: 1 });

const AssessmentForm = mongoose.model('AssessmentForm', assessmentFormSchema);

// Assessment Submission Schema
const assessmentSubmissionSchema = new mongoose.Schema({
  submissionId: {
    type: String,
    required: true,
    unique: true
  },
  formCode: {
    type: String,
    required: true,
    ref: 'AssessmentForm'
  },
  participantName: {
    type: String,
    required: true
  },
  participantIcNumber: {
    type: String,
    required: false,
    default: null
  },
  participantEmail: {
    type: String,
    required: false,
    default: null
  },
  answers: [{
    questionId: {
      type: Number,
      required: true
    },
    selectedAnswer: {
      type: String,
      required: true
    },
    isCorrect: {
      type: Boolean,
      required: true
    }
  }],
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  correctAnswers: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  timeSpent: {
    type: Number,
    required: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  batchId: {
    type: String,
    required: true,
    index: true
  },
  batchDate: {
    type: String,
    required: true,
    index: true
  },
  submittedAfterExpiry: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const AssessmentSubmission = mongoose.model('AssessmentSubmission', assessmentSubmissionSchema);

// ID Generation Functions
const generatePlayerId = async () => {
  let playerId;
  let isUnique = false;

  while (!isUnique) {
    // Generate 5-character alphanumeric string (A-Z, 0-9)
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let alphanumeric = '';
    for (let i = 0; i < 5; i++) {
      alphanumeric += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    playerId = `MPA${alphanumeric}`;

    const existingPlayer = await Player.findOne({ playerId });
    if (!existingPlayer) {
      isUnique = true;
    }
  }

  return playerId;
};

const generateVenueId = async () => {
  let venueId;
  let isUnique = false;
  
  while (!isUnique) {
    const randomNum = Math.floor(Math.random() * 90000) + 10000;
    venueId = `VN${randomNum}`;
    
    const existingVenue = await Venue.findOne({ venueId });
    if (!existingVenue) {
      isUnique = true;
    }
  }
  
  return venueId;
};

const generateEventId = async () => {
  let eventId;
  let isUnique = false;
  
  while (!isUnique) {
    const randomNum = Math.floor(Math.random() * 900000) + 100000;
    eventId = `EV${randomNum}`;
    
    const existingEvent = await Event.findOne({ eventId });
    if (!existingEvent) {
      isUnique = true;
    }
  }
  
  return eventId;
};

const generateBookingId = async () => {
  let bookingId;
  let isUnique = false;
  
  while (!isUnique) {
    const randomNum = Math.floor(Math.random() * 900000) + 100000;
    bookingId = `BK${randomNum}`;
    
    const existingBooking = await Booking.findOne({ bookingId });
    if (!existingBooking) {
      isUnique = true;
    }
  }
  
  return bookingId;
};

const generateNewsId = async () => {
  let newsId;
  let isUnique = false;
  
  while (!isUnique) {
    const randomNum = Math.floor(Math.random() * 90000) + 10000;
    newsId = `NW${randomNum}`;
    
    const existingNews = await News.findOne({ newsId });
    if (!existingNews) {
      isUnique = true;
    }
  }
  
  return newsId;
};

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

// Generate unique assessment form code
const generateAssessmentFormCode = async () => {
  let formCode;
  let isUnique = false;

  while (!isUnique) {
    // Generate 5-character random code (letters and numbers)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    formCode = '';
    for (let i = 0; i < 5; i++) {
      formCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Check if this code already exists
    const existingForm = await AssessmentForm.findOne({ code: formCode });
    if (!existingForm) {
      isUnique = true;
    }
  }

  return formCode;
};

// Generate unique temporary assessment form code
const generateTemporaryAssessmentCode = async () => {
  let formCode;
  let isUnique = false;
  while (!isUnique) {
    // Generate 5-character random code with 'T' prefix for temporary
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    formCode = 'T';
    for (let i = 0; i < 4; i++) {
      formCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Check if this code already exists (including both temporary and permanent)
    const existingForm = await AssessmentForm.findOne({ code: formCode });
    if (!existingForm) {
      isUnique = true;
    }
  }
  return formCode;
};

// Generate unique assessment submission ID
const generateSubmissionId = async () => {
  let submissionId;
  let isUnique = false;

  while (!isUnique) {
    const randomNum = Math.floor(Math.random() * 900000) + 100000;
    submissionId = `AS${randomNum}`;

    const existingSubmission = await AssessmentSubmission.findOne({ submissionId });
    if (!existingSubmission) {
      isUnique = true;
    }
  }

  return submissionId;
};

// Routes

// ===============================
// PLAYER/MEMBER MANAGEMENT APIs
// ===============================

// Register new player
// Check if IC number already exists
app.get('/api/players/check-ic/:icNumber', async (req, res) => {
  try {
    const { icNumber } = req.params;
    const existingPlayer = await Player.findOne({ 'personalInfo.icNumber': icNumber });

    res.json({
      exists: !!existingPlayer,
      message: existingPlayer ? 'I/C number already registered' : 'I/C number available'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/players/register', uploadProfile.single('profilePicture'), async (req, res) => {
  try {
    const formData = req.body;

    // Check if IC number already exists
    const existingPlayer = await Player.findOne({ 'personalInfo.icNumber': formData.icNumber });
    if (existingPlayer) {
      return res.status(400).json({
        error: 'This I/C number is already registered. Each I/C number can only be used once.'
      });
    }

    // Calculate date of birth from IC number (YYMMDD format)
    const icDigits = formData.icNumber.replace(/\D/g, '');
    const year = parseInt(icDigits.substring(0, 2));
    const month = icDigits.substring(2, 4);
    const day = icDigits.substring(4, 6);
    const currentYear = new Date().getFullYear() % 100;
    const fullYear = year > currentYear ? 1900 + year : 2000 + year;
    const dateOfBirth = new Date(`${fullYear}-${month}-${day}`);

    const playerId = await generatePlayerId();

    // Hash password
    const hashedPassword = await bcrypt.hash(formData.password, 10);

    // Map form data to Player schema structure
    const playerData = {
      playerId,
      username: formData.username,
      password: hashedPassword,
      personalInfo: {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phoneNumber,
        dateOfBirth: dateOfBirth,
        gender: formData.gender,
        nationality: 'Malaysian',
        icNumber: formData.icNumber,
        address: {
          street: formData.addressLine1 + (formData.addressLine2 ? ', ' + formData.addressLine2 : ''),
          city: formData.city,
          state: formData.state,
          country: 'Malaysia'
        }
      },
      playerInfo: {
        skillLevel: 'Beginner',
        playingHand: 'Right'
      },
      membership: {
        status: 'active',
        membershipType: 'Standard',
        registrationDate: new Date()
      }
    };

    // Add profile picture path if uploaded
    if (req.file) {
      playerData.profilePicture = req.file.path; // Cloudinary URL
    }

    const newPlayer = new Player(playerData);
    await newPlayer.save();

    res.status(201).json({
      success: true,
      message: 'Player registered successfully',
      player: newPlayer
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Player login
app.post('/api/players/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find player by username
    const player = await Player.findOne({ username });

    if (!player) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check if account is active
    if (player.membership.status !== 'active') {
      return res.status(403).json({ error: 'Account is not active. Please contact support.' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, player.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        playerId: player._id,
        username: player.username,
        email: player.personalInfo.email
      },
      process.env.JWT_SECRET || 'mpa-secret-key-2024',
      { expiresIn: '7d' }
    );

    // Return player data (excluding password)
    const playerData = {
      id: player._id,
      playerId: player.playerId,
      username: player.username,
      fullName: player.personalInfo.fullName,
      email: player.personalInfo.email,
      profilePicture: player.profilePicture,
      gender: player.personalInfo.gender,
      icNumber: player.personalInfo.icNumber,
      age: new Date().getFullYear() - new Date(player.personalInfo.dateOfBirth).getFullYear(),
      phoneNumber: player.personalInfo.phone,
      addressLine1: player.personalInfo.address.street,
      city: player.personalInfo.address.city,
      state: player.personalInfo.address.state,
      membershipStatus: player.membership.status,
      membershipType: player.membership.membershipType,
      skillLevel: player.playerInfo.skillLevel
    };

    res.json({
      success: true,
      message: 'Login successful',
      token,
      player: playerData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An error occurred during login' });
  }
});

// Get all players
app.get('/api/players', async (req, res) => {
  try {
    const { status, skillLevel, state, limit = 50, page = 1 } = req.query;
    
    let query = {};
    if (status) query['membership.status'] = status;
    if (skillLevel) query['playerInfo.skillLevel'] = skillLevel;
    if (state) query['personalInfo.address.state'] = state;
    
    const players = await Player.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await Player.countDocuments(query);
    
    res.json({
      players,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get player by ID
app.get('/api/players/:id', async (req, res) => {
  try {
    // Try to find by playerId first, then by MongoDB _id
    let player = await Player.findOne({ playerId: req.params.id });
    if (!player) {
      player = await Player.findById(req.params.id);
    }
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Return player data without sensitive information
    const playerData = {
      id: player._id,
      playerId: player.playerId,
      username: player.username,
      fullName: player.personalInfo.fullName,
      email: player.personalInfo.email,
      profilePicture: player.profilePicture,
      gender: player.personalInfo.gender,
      icNumber: player.personalInfo.icNumber,
      age: new Date().getFullYear() - new Date(player.personalInfo.dateOfBirth).getFullYear(),
      phoneNumber: player.personalInfo.phone,
      addressLine1: player.personalInfo.address.street,
      addressLine2: '',
      city: player.personalInfo.address.city,
      state: player.personalInfo.address.state,
      membershipStatus: player.membership.status,
      membershipType: player.membership.membershipType,
      skillLevel: player.playerInfo.skillLevel
    };

    res.json(playerData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update player
app.patch('/api/players/:id', async (req, res) => {
  try {
    const player = await Player.findOneAndUpdate(
      { playerId: req.params.id },
      req.body,
      { new: true }
    );
    
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.json({
      success: true,
      message: 'Player updated successfully',
      player
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete player
app.delete('/api/players/:id', async (req, res) => {
  try {
    const player = await Player.findOneAndDelete({ playerId: req.params.id });
    
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.json({
      success: true,
      message: 'Player deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// VENUE MANAGEMENT APIs
// ===============================

// Create new venue
app.post('/api/venues', async (req, res) => {
  try {
    const venueData = req.body;
    const venueId = await generateVenueId();
    
    const newVenue = new Venue({
      venueId,
      ...venueData
    });
    
    await newVenue.save();
    
    res.status(201).json({
      success: true,
      message: 'Venue created successfully',
      venue: newVenue
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all venues
app.get('/api/venues', async (req, res) => {
  try {
    const { city, state, status } = req.query;
    
    let query = {};
    if (city) query['basicInfo.address.city'] = city;
    if (state) query['basicInfo.address.state'] = state;
    if (status) query.status = status;
    
    const venues = await Venue.find(query).sort({ createdAt: -1 });
    
    res.json(venues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get venue by ID
app.get('/api/venues/:id', async (req, res) => {
  try {
    const venue = await Venue.findOne({ venueId: req.params.id });
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }
    res.json(venue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update venue
app.patch('/api/venues/:id', async (req, res) => {
  try {
    const venue = await Venue.findOneAndUpdate(
      { venueId: req.params.id },
      req.body,
      { new: true }
    );
    
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }
    
    res.json({
      success: true,
      message: 'Venue updated successfully',
      venue
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete venue
app.delete('/api/venues/:id', async (req, res) => {
  try {
    const venue = await Venue.findOneAndDelete({ venueId: req.params.id });
    
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }
    
    res.json({
      success: true,
      message: 'Venue deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// EVENT MANAGEMENT APIs
// ===============================

// Create new event
app.post('/api/events', async (req, res) => {
  try {
    const eventData = req.body;
    const eventId = await generateEventId();
    
    const newEvent = new Event({
      eventId,
      ...eventData
    });
    
    await newEvent.save();
    
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event: newEvent
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all events
app.get('/api/events', async (req, res) => {
  try {
    const { type, status, city, state, upcoming } = req.query;
    
    let query = {};
    if (type) query['basicInfo.type'] = type;
    if (status) query['basicInfo.status'] = status;
    if (city) query['location.city'] = city;
    if (state) query['location.state'] = state;
    if (upcoming === 'true') {
      query['schedule.startDate'] = { $gte: new Date() };
    }
    
    const events = await Event.find(query).sort({ 'schedule.startDate': 1 });
    
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get event by ID
app.get('/api/events/:id', async (req, res) => {
  try {
    const event = await Event.findOne({ eventId: req.params.id });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update event
app.patch('/api/events/:id', async (req, res) => {
  try {
    const event = await Event.findOneAndUpdate(
      { eventId: req.params.id },
      req.body,
      { new: true }
    );
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({
      success: true,
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete event
app.delete('/api/events/:id', async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({ eventId: req.params.id });
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register player for event
app.post('/api/events/:id/register', async (req, res) => {
  try {
    const { playerId } = req.body;
    
    const event = await Event.findOne({ eventId: req.params.id });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const player = await Player.findOne({ playerId });
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    // Check if already registered
    const isAlreadyRegistered = event.participants.registeredPlayers.some(
      p => p.playerId === playerId
    );
    
    if (isAlreadyRegistered) {
      return res.status(400).json({ error: 'Player already registered for this event' });
    }
    
    // Check capacity
    if (event.participants.maxParticipants && 
        event.participants.currentParticipants >= event.participants.maxParticipants) {
      // Add to waiting list
      event.participants.waitingList.push({
        playerId,
        registrationDate: new Date()
      });
    } else {
      // Add to registered players
      event.participants.registeredPlayers.push({
        playerId,
        registrationDate: new Date(),
        status: 'Confirmed'
      });
      event.participants.currentParticipants += 1;
    }
    
    await event.save();
    
    res.json({
      success: true,
      message: 'Registration successful',
      event
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ===============================
// BOOKING MANAGEMENT APIs
// ===============================

// Create new booking
app.post('/api/bookings', async (req, res) => {
  try {
    const bookingData = req.body;
    const bookingId = await generateBookingId();
    
    const newBooking = new Booking({
      bookingId,
      ...bookingData
    });
    
    await newBooking.save();
    
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: newBooking
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const { venueId, playerId, status, date } = req.query;
    
    let query = {};
    if (venueId) query.venueId = venueId;
    if (playerId) query.playerId = playerId;
    if (status) query.status = status;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      query['bookingDetails.date'] = { $gte: startDate, $lt: endDate };
    }
    
    const bookings = await Booking.find(query).sort({ 'bookingDetails.date': -1 });
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get booking by ID
app.get('/api/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.id });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update booking
app.patch('/api/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { bookingId: req.params.id },
      req.body,
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json({
      success: true,
      message: 'Booking updated successfully',
      booking
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Cancel booking
app.patch('/api/bookings/:id/cancel', async (req, res) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { bookingId: req.params.id },
      { status: 'Cancelled' },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ===============================
// NEWS/ANNOUNCEMENT APIs
// ===============================

// Create news/announcement
app.post('/api/news', uploadNews.single('newsImage'), async (req, res) => {
  try {
    console.log('📰 Creating news...');
    console.log('File received:', req.file ? req.file.filename : 'No file');
    console.log('Body data:', req.body);

    const newsData = req.body;
    const newsId = newsData.newsId || await generateNewsId();

    // Handle image upload
    let media = [];
    if (req.file) {
      console.log('✅ Image uploaded:', req.file.filename);
      media.push({
        type: 'image',
        url: req.file.path, // Cloudinary URL
        caption: newsData.title
      });
    }

    const newNews = new News({
      newsId,
      title: newsData.title,
      content: newsData.content,
      summary: newsData.summary,
      category: newsData.category || 'General',
      priority: newsData.priority || 'Medium',
      status: newsData.status || 'Published',
      publishDate: newsData.publishDate || new Date(),
      media: media
    });

    await newNews.save();
    console.log('✅ News created successfully:', newsId);

    res.status(201).json({
      success: true,
      message: 'News created successfully',
      news: newNews
    });
  } catch (error) {
    console.error('❌ Error creating news:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get all news
app.get('/api/news', async (req, res) => {
  try {
    const { category, status, priority, limit } = req.query;

    let query = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (priority) query.priority = priority;

    let newsQuery = News.find(query).sort({ publishDate: -1 });

    // Apply limit if provided
    if (limit) {
      newsQuery = newsQuery.limit(parseInt(limit));
    }

    const news = await newsQuery;

    res.json(news);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get news by ID
app.get('/api/news/:id', async (req, res) => {
  try {
    const news = await News.findOne({ newsId: req.params.id });
    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }
    
    // Increment view count
    news.views += 1;
    await news.save();
    
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update news
app.patch('/api/news/:id', uploadNews.single('newsImage'), async (req, res) => {
  try {
    const newsData = req.body;
    const updateData = {
      title: newsData.title,
      content: newsData.content,
      summary: newsData.summary,
      status: newsData.status,
      publishDate: newsData.publishDate
    };

    // Handle image upload if new file is provided
    if (req.file) {
      updateData.media = [{
        type: 'image',
        url: req.file.path, // Cloudinary URL
        caption: newsData.title
      }];
    }

    const news = await News.findOneAndUpdate(
      { newsId: req.params.id },
      updateData,
      { new: true }
    );

    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }

    res.json({
      success: true,
      message: 'News updated successfully',
      news
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete news
app.delete('/api/news/:id', async (req, res) => {
  try {
    const news = await News.findOneAndDelete({ newsId: req.params.id });

    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }

    res.json({
      success: true,
      message: 'News deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// FEATURED VIDEO APIs
// ===============================

// Get active featured video
app.get('/api/featured-video', async (req, res) => {
  try {
    const video = await FeaturedVideo.findOne({ isActive: true }).sort({ createdAt: -1 });
    res.json(video || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all featured videos
app.get('/api/featured-videos', async (req, res) => {
  try {
    const videos = await FeaturedVideo.find().sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update featured video
app.post('/api/featured-video', async (req, res) => {
  try {
    const { title, description, videoUrl } = req.body;

    // Deactivate all existing videos
    await FeaturedVideo.updateMany({}, { isActive: false });

    // Create new featured video
    const video = new FeaturedVideo({
      title,
      description,
      videoUrl,
      isActive: true
    });

    await video.save();
    res.status(201).json({
      success: true,
      message: 'Featured video saved successfully',
      video
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update featured video
app.patch('/api/featured-video/:id', async (req, res) => {
  try {
    const { title, description, videoUrl, isActive } = req.body;

    // If setting this video as active, deactivate all others
    if (isActive) {
      await FeaturedVideo.updateMany({ _id: { $ne: req.params.id } }, { isActive: false });
    }

    const video = await FeaturedVideo.findByIdAndUpdate(
      req.params.id,
      { title, description, videoUrl, isActive },
      { new: true }
    );

    if (!video) {
      return res.status(404).json({ error: 'Featured video not found' });
    }

    res.json({
      success: true,
      message: 'Featured video updated successfully',
      video
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete featured video
app.delete('/api/featured-video/:id', async (req, res) => {
  try {
    const video = await FeaturedVideo.findByIdAndDelete(req.params.id);

    if (!video) {
      return res.status(404).json({ error: 'Featured video not found' });
    }

    res.json({
      success: true,
      message: 'Featured video deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// ORGANIZATION MANAGEMENT APIs
// ===============================

// Organization registration endpoint
app.post('/api/organizations/register', upload.single('registrationDocument'), async (req, res) => {
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

    // Prepare documents array for uploaded files
    const documents = [];
    if (req.file) {
      documents.push({
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        uploadedAt: new Date()
      });
    }

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
      country,
      documents
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

// Update organization profile with document upload
app.patch('/api/organizations/profile', upload.array('documents', 10), async (req, res) => {
  try {
    const {
      organizationId,
      organizationName,
      registrationNo,
      applicantFullName,
      phoneNumber,
      email,
      addressLine1,
      addressLine2,
      city,
      postcode,
      state,
      country
    } = req.body;

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    // Find organization by organizationId
    const organization = await Organization.findOne({ organizationId });
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Update basic information
    organization.organizationName = organizationName || organization.organizationName;
    organization.registrationNo = registrationNo || organization.registrationNo;
    organization.applicantFullName = applicantFullName || organization.applicantFullName;
    organization.phoneNumber = phoneNumber || organization.phoneNumber;
    organization.email = email || organization.email;
    organization.addressLine1 = addressLine1 || organization.addressLine1;
    organization.addressLine2 = addressLine2 || organization.addressLine2;
    organization.city = city || organization.city;
    organization.postcode = postcode || organization.postcode;
    organization.state = state || organization.state;
    organization.country = country || organization.country;

    // Handle uploaded documents
    if (req.files && req.files.length > 0) {
      const newDocuments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        uploadedAt: new Date()
      }));

      // Add new documents to existing ones
      organization.documents = [...(organization.documents || []), ...newDocuments];
    }

    await organization.save();

    console.log(`Organization profile updated: ${organization.organizationId} - ${organization.organizationName}`);

    res.json({
      success: true,
      message: 'Organization profile updated successfully',
      organization: {
        organizationId: organization.organizationId,
        organizationName: organization.organizationName,
        registrationNo: organization.registrationNo,
        applicantFullName: organization.applicantFullName,
        phoneNumber: organization.phoneNumber,
        email: organization.email,
        addressLine1: organization.addressLine1,
        addressLine2: organization.addressLine2,
        city: organization.city,
        postcode: organization.postcode,
        state: organization.state,
        country: organization.country,
        documents: organization.documents || []
      }
    });

  } catch (error) {
    console.error('Update organization profile error:', error);
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
    // Exclude admin-created tournaments from organization's applied tournaments list
    const applications = await TournamentApplication.find({ 
      email, 
      createdByAdmin: { $ne: true } 
    }).sort({ submissionDate: -1 });
    res.json(applications);
  } catch (error) {
    console.error('Get organization applications error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update existing admin-created tournaments (one-time fix)
app.post('/api/admin/fix-admin-tournaments', async (req, res) => {
  try {
    // Find tournaments that were likely created by admin (approved status and no createdByAdmin flag)
    const adminTournaments = await TournamentApplication.find({
      status: 'Approved',
      createdByAdmin: { $ne: true },
      // Additional criteria: tournaments created with admin-like characteristics
      $or: [
        { submissionDate: { $gte: new Date('2025-01-01') } }, // Recent tournaments
        { organiserName: { $regex: /admin|test|system/i } } // Admin-like names
      ]
    });
    
    console.log(`Found ${adminTournaments.length} potential admin-created tournaments to update`);
    
    // Update them to mark as admin-created
    const updateResult = await TournamentApplication.updateMany(
      {
        _id: { $in: adminTournaments.map(t => t._id) }
      },
      {
        $set: { createdByAdmin: true }
      }
    );
    
    res.json({
      success: true,
      message: `Updated ${updateResult.modifiedCount} tournaments`,
      foundTournaments: adminTournaments.length,
      updatedCount: updateResult.modifiedCount
    });
    
  } catch (error) {
    console.error('Fix admin tournaments error:', error);
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
app.post('/api/applications', uploadApplication.array('supportDocuments', 10), async (req, res) => {
  try {
    let applicationData = req.body;

    // If categories is a string (from FormData), parse it
    if (typeof applicationData.categories === 'string') {
      try {
        applicationData.categories = JSON.parse(applicationData.categories);
      } catch (e) {
        console.error('Error parsing categories:', e);
        applicationData.categories = [];
      }
    }

    // Handle uploaded support documents - Store in MongoDB as Base64
    const supportDocuments = [];
    if (req.files && req.files.length > 0) {
      console.log('📎 Processing uploaded files:', req.files.length);

      req.files.forEach((file, index) => {
        console.log(`File ${index}:`, {
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        });

        // Convert file buffer to Base64 and store in MongoDB
        const fileBase64 = file.buffer.toString('base64');

        supportDocuments.push({
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          data: fileBase64, // Base64 encoded file data
          uploadDate: new Date()
        });
      });
      applicationData.supportDocuments = supportDocuments;
      console.log('✅ Processed documents:', supportDocuments.length);
    }
    
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
    
    // WEBHOOK - If admin created this tournament and it's already approved, trigger webhook immediately
    if (savedApplication.createdByAdmin && savedApplication.status === 'Approved') {
      try {
        console.log('🚨 Sending INSTANT admin-created tournament webhook to main site...');
        const webhookUrl = IS_LOCAL_DEV ? 'http://localhost:3000/api/webhooks/tournament-updated' : 'https://malaysiapickleball-fbab5112dbaf.herokuapp.com/api/webhooks/tournament-updated';
        
        const webhookPayload = {
          tournament: {
            applicationId: savedApplication.applicationId,
            id: savedApplication.applicationId,
            eventTitle: savedApplication.eventTitle,
            name: savedApplication.eventTitle,
            eventStartDate: savedApplication.eventStartDate,
            eventEndDate: savedApplication.eventEndDate,
            startDate: savedApplication.eventStartDate,
            endDate: savedApplication.eventEndDate,
            tournamentType: savedApplication.tournamentType,
            type: savedApplication.tournamentType,
            venue: savedApplication.venue,
            city: savedApplication.city,
            state: savedApplication.state,
            organizer: savedApplication.organizer,
            personInCharge: savedApplication.personInCharge,
            telContact: savedApplication.telContact,
            contactEmail: savedApplication.contactEmail,
            description: savedApplication.eventSummary,
            eventSummary: savedApplication.eventSummary,
            maxParticipants: savedApplication.maxParticipants,
            registrationOpen: true
          },
          action: 'created'
        };
        
        const https = require('https');
        const http = require('http');
        const url = require('url');
        
        const parsedUrl = url.parse(webhookUrl);
        const postData = JSON.stringify(webhookPayload);
        
        const options = {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
          path: parsedUrl.path,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        };
        
        const client = parsedUrl.protocol === 'https:' ? https : http;
        
        const webhookReq = client.request(options, (webhookRes) => {
          console.log(`⚡ INSTANT admin tournament webhook response: ${webhookRes.statusCode}`);
          
          webhookRes.on('data', (chunk) => {
            // Handle response data if needed
          });
        });
        
        webhookReq.on('error', (error) => {
          console.error('❌ Admin tournament webhook request error:', error.message);
        });
        
        webhookReq.write(postData);
        webhookReq.end();
        
        console.log(`🚀 INSTANT admin tournament webhook sent: ${savedApplication.eventTitle} → Approved`);
        
      } catch (webhookError) {
        console.error('❌ Admin tournament webhook error:', webhookError.message);
      }
    }
    
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
    const { status, rejectionReason, requiredInfo } = req.body;
    const updateData = {
      status,
      lastUpdated: Date.now()
    };

    // Add rejection reason if status is rejected
    if (status === 'Rejected' && rejectionReason) {
      updateData.remarks = rejectionReason;
    }

    // Add required info if status is "More Info Required"
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
    
    // INSTANT WEBHOOK - Notify main site of status change immediately
    try {
      console.log('🚨 Sending INSTANT status change webhook to main site...');
      const webhookUrl = IS_LOCAL_DEV ? 'http://localhost:3000/api/webhooks/tournament-updated' : 'https://malaysiapickleball-fbab5112dbaf.herokuapp.com/api/webhooks/tournament-updated';
      
      const webhookPayload = {
        tournament: {
          applicationId: application.applicationId,
          id: application.applicationId,
          eventTitle: application.eventTitle,
          name: application.eventTitle,
          eventStartDate: application.eventStartDate,
          eventEndDate: application.eventEndDate,
          startDate: application.eventStartDate,
          endDate: application.eventEndDate,
          tournamentType: application.tournamentType,
          type: application.tournamentType,
          venue: application.venue,
          city: application.city,
          state: application.state,
          organizer: application.organizer,
          personInCharge: application.personInCharge,
          telContact: application.telContact,
          contactEmail: application.contactEmail,
          description: application.eventSummary,
          eventSummary: application.eventSummary,
          maxParticipants: application.maxParticipants,
          registrationOpen: true
        },
        action: status === 'Approved' ? 'created' : 'updated'
      };
      
      const https = require('https');
      const http = require('http');
      const url = require('url');
      
      const parsedUrl = url.parse(webhookUrl);
      const postData = JSON.stringify(webhookPayload);
      
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      
      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      const webhookReq = client.request(options, (webhookRes) => {
        console.log(`⚡ INSTANT status webhook response: ${webhookRes.statusCode}`);
      });
      
      webhookReq.on('error', (error) => {
        console.error('❌ Status webhook failed:', error.message);
      });
      
      webhookReq.write(postData);
      webhookReq.end();
      
      console.log(`🚀 INSTANT status webhook sent: ${application.eventTitle} → ${status}`);
      
    } catch (webhookError) {
      console.error('❌ Status webhook error:', webhookError.message);
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

    // Send "More Info Required" email if status is changed to 'More Info Required'
    if (status === 'More Info Required' && application.email && requiredInfo) {
      const emailTemplate = emailTemplates.applicationMoreInfoRequired(application, requiredInfo);
      const emailResult = await sendEmail(application.email, emailTemplate);

      if (!emailResult.success) {
        console.error('Failed to send more info required email:', emailResult.error);
        // Still return success for the status update, even if email fails
      }
    }
    
    res.json(application);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update tournament application details (admin only)  
app.patch('/api/applications/:id', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const updateData = req.body;
    
    // Add lastUpdated timestamp
    updateData.lastUpdated = new Date();
    
    // Find and update the application
    const application = await TournamentApplication.findOneAndUpdate(
      { applicationId: req.params.id },
      updateData,
      { new: true }
    );
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    
    // INSTANT WEBHOOK - Notify main site if tournament is approved
    if (application.status === 'Approved') {
      try {
        console.log('🚨 Sending INSTANT update webhook to main site...');
        const webhookUrl = IS_LOCAL_DEV ? 'http://localhost:3000/api/webhooks/tournament-updated' : 'https://malaysiapickleball-fbab5112dbaf.herokuapp.com/api/webhooks/tournament-updated';
        
        const webhookPayload = {
          tournament: application,
          action: 'updated'
        };
        
        const https = require('https');
        const http = require('http');
        const url = require('url');
        
        const parsedUrl = url.parse(webhookUrl);
        const postData = JSON.stringify(webhookPayload);
        
        const options = {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port,
          path: parsedUrl.path,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        };
        
        const client = parsedUrl.protocol === 'https:' ? https : http;
        
        const req = client.request(options, (webhookRes) => {
          console.log(`⚡ INSTANT update webhook response: ${webhookRes.statusCode}`);
        });
        
        req.on('error', (error) => {
          console.error('❌ Update webhook failed:', error.message);
        });
        
        req.write(postData);
        req.end();
      } catch (webhookError) {
        console.error('❌ Update webhook error:', webhookError.message);
      }
    }
    
    res.json({
      message: 'Application updated successfully',
      application: application
    });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ error: error.message });
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
    
    // INSTANT WEBHOOK - Notify main site immediately
    try {
      console.log('🚨 Sending INSTANT deletion webhook to main site...');
      const webhookUrl = IS_LOCAL_DEV ? 'http://localhost:3000/api/webhooks/tournament-updated' : 'https://malaysiapickleball-fbab5112dbaf.herokuapp.com/api/webhooks/tournament-updated';
      
      const webhookPayload = {
        tournament: {
          applicationId: application.applicationId,
          id: application.applicationId,
          eventTitle: application.eventTitle,
          name: application.eventTitle,
          eventStartDate: application.eventStartDate,
          eventEndDate: application.eventEndDate,
          startDate: application.eventStartDate,
          endDate: application.eventEndDate,
          tournamentType: application.tournamentType,
          type: application.tournamentType,
          venue: application.venue,
          city: application.city,
          state: application.state,
          organizer: application.organizer,
          personInCharge: application.personInCharge,
          telContact: application.telContact,
          contactEmail: application.contactEmail,
          description: application.eventSummary,
          eventSummary: application.eventSummary,
          maxParticipants: application.maxParticipants
        },
        action: 'deleted'
      };
      
      // Use axios or built-in fetch for webhook call
      const https = require('https');
      const http = require('http');
      const url = require('url');
      
      const parsedUrl = url.parse(webhookUrl);
      const postData = JSON.stringify(webhookPayload);
      
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      
      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      const req = client.request(options, (webhookRes) => {
        console.log(`⚡ INSTANT webhook response: ${webhookRes.statusCode}`);
        webhookRes.on('data', (chunk) => {
          console.log('📡 Webhook response:', chunk.toString());
        });
      });
      
      req.on('error', (error) => {
        console.error('❌ Webhook failed (tournament still deleted from portal):', error.message);
      });
      
      req.write(postData);
      req.end();
      
      console.log('🚀 INSTANT deletion webhook sent - no 2-minute wait!');
      
    } catch (webhookError) {
      console.error('❌ Webhook error (portal deletion still successful):', webhookError.message);
    }
    
    
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





// Generate unique application ID (utility endpoint)
app.post('/api/generate/application-id', async (req, res) => {
  try {
    console.log('🆔 Application ID generation request');
    
    // Generate unique application ID
    let applicationId;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      applicationId = generateApplicationId();
      const existing = await TournamentApplication.findOne({ applicationId });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }
    
    if (!isUnique) {
      return res.status(500).json({ 
        error: 'Failed to generate unique ID',
        message: 'Unable to generate unique application ID after 10 attempts' 
      });
    }
    
    console.log(`✅ Generated unique application ID: ${applicationId}`);
    
    res.json({
      success: true,
      applicationId: applicationId,
      message: 'Unique application ID generated successfully'
    });
    
  } catch (error) {
    console.error('ID generation error:', error);
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

    // Validate authority level
    const validAuthorityLevels = ['super_admin', 'admin', 'assessment_admin'];
    if (authorityLevel && !validAuthorityLevels.includes(authorityLevel)) {
      return res.status(400).json({
        success: false,
        message: `Invalid authority level. Must be one of: ${validAuthorityLevels.join(', ')}`
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

// ===============================
// ASSESSMENT FORM MANAGEMENT APIs
// ===============================

// Get all temporary assessment codes
app.get('/api/assessment/temporary-codes', async (req, res) => {
  try {
    // Find all temporary forms that are not expired, populate parent form details
    const tempForms = await AssessmentForm.find({
      isTemporary: true,
      expiresAt: { $gt: new Date() } // Only non-expired codes
    }).populate('parentFormId', 'title code').sort({ createdAt: -1 });

    // Format the response with relevant information
    const formattedCodes = tempForms.map(form => ({
      _id: form._id,
      tempCode: form.code,
      parentFormTitle: form.parentFormId ? form.parentFormId.title : form.title,
      parentFormCode: form.parentFormId ? form.parentFormId.code : 'N/A',
      expiresAt: form.expiresAt,
      timeRemaining: Math.max(0, form.expiresAt.getTime() - Date.now()),
      generatedBy: form.generatedBy,
      createdAt: form.createdAt,
      timeLimit: form.timeLimit
    }));

    res.json({
      success: true,
      data: formattedCodes
    });

  } catch (error) {
    console.error('Error fetching temporary codes:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch temporary codes'
    });
  }
});

// Generate temporary assessment code from existing form
app.post('/api/assessment/forms/:formId/generate-temp-code', async (req, res) => {
  try {
    const { formId } = req.params;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    // Find the parent form
    const parentForm = await AssessmentForm.findById(formId);
    if (!parentForm) {
      return res.status(404).json({
        success: false,
        message: 'Assessment form not found'
      });
    }

    // Ensure we're not creating a temporary copy of another temporary form
    if (parentForm.isTemporary) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create temporary copy of a temporary form'
      });
    }

    // Generate temporary code
    const tempCode = await generateTemporaryAssessmentCode();

    // Calculate expiry time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create temporary form
    const tempForm = new AssessmentForm({
      code: tempCode,
      title: parentForm.title,
      titleMalay: parentForm.titleMalay,
      subtitle: parentForm.subtitle,
      subtitleMalay: parentForm.subtitleMalay,
      questions: parentForm.questions,
      timeLimit: parentForm.timeLimit,
      isTemporary: true,
      parentFormId: parentForm._id,
      expiresAt: expiresAt,
      generatedBy: clientIP
    });

    const savedTempForm = await tempForm.save();

    res.status(201).json({
      success: true,
      message: 'Temporary assessment code generated successfully',
      data: {
        tempCode: savedTempForm.code,
        expiresAt: savedTempForm.expiresAt,
        parentTitle: parentForm.title,
        timeLimit: savedTempForm.timeLimit
      }
    });

  } catch (error) {
    console.error('Error generating temporary assessment code:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to generate temporary assessment code'
    });
  }
});

// Save assessment form
app.post('/api/assessment/forms', async (req, res) => {
  try {
    const {
      questions,
      timeLimit,
      title,
      subtitle,
      titleMalay,
      subtitleMalay,
      passingScore,
      isDraft
    } = req.body;

    console.log('Received form data:', {
      title,
      isDraft,
      questionsLength: Array.isArray(questions) ? questions.length : 'not array',
      timeLimit
    });

    // Validation - relax for drafts
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Assessment title is required'
      });
    }

    // For non-drafts, require questions and timeLimit
    if (!isDraft) {
      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Questions are required and must be a non-empty array'
        });
      }

      if (!timeLimit || timeLimit < 1 || timeLimit > 180) {
        return res.status(400).json({
          success: false,
          message: 'Time limit must be between 1 and 180 minutes'
        });
      }
    } else {
      // For drafts, ensure questions is at least an array (can be empty)
      if (questions && !Array.isArray(questions)) {
        return res.status(400).json({
          success: false,
          message: 'Questions must be an array'
        });
      }
    }

    // Generate unique form code
    const formCode = await generateAssessmentFormCode();

    const newForm = new AssessmentForm({
      code: formCode,
      title: title.trim(),
      subtitle: subtitle ? subtitle.trim() : '',
      titleMalay: titleMalay ? titleMalay.trim() : '',
      subtitleMalay: subtitleMalay ? subtitleMalay.trim() : '',
      questions: questions || [],
      timeLimit: timeLimit || 30,
      passingScore: passingScore || 70,
      isDraft: isDraft || false,
    });

    const savedForm = await newForm.save();

    res.status(201).json({
      success: true,
      message: isDraft ? 'Assessment draft saved successfully' : 'Assessment form saved successfully',
      data: savedForm
    });
  } catch (error) {
    console.error('Error saving assessment form:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to save assessment form'
    });
  }
});

// Update assessment form
app.patch('/api/assessment/forms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      questions,
      timeLimit,
      title,
      subtitle,
      titleMalay,
      subtitleMalay,
      passingScore,
      isDraft
    } = req.body;

    console.log('Updating form with ID:', id);

    // Validation - relax for drafts
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Assessment title is required'
      });
    }

    // For non-drafts, require questions and timeLimit
    if (!isDraft) {
      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Questions are required and must be a non-empty array'
        });
      }

      if (!timeLimit || timeLimit < 1 || timeLimit > 180) {
        return res.status(400).json({
          success: false,
          message: 'Time limit must be between 1 and 180 minutes'
        });
      }
    } else {
      // For drafts, ensure questions is at least an array (can be empty)
      if (questions && !Array.isArray(questions)) {
        return res.status(400).json({
          success: false,
          message: 'Questions must be an array'
        });
      }
    }

    const updateData = {
      title: title.trim(),
      subtitle: subtitle ? subtitle.trim() : '',
      titleMalay: titleMalay ? titleMalay.trim() : '',
      subtitleMalay: subtitleMalay ? subtitleMalay.trim() : '',
      questions: questions || [],
      timeLimit: timeLimit || 30,
      passingScore: passingScore || 70,
      isDraft: isDraft || false,
    };

    const updatedForm = await AssessmentForm.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedForm) {
      return res.status(404).json({
        success: false,
        message: 'Assessment form not found'
      });
    }

    res.json({
      success: true,
      message: isDraft ? 'Assessment draft updated successfully' : 'Assessment form updated successfully',
      data: updatedForm
    });
  } catch (error) {
    console.error('Error updating assessment form:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update assessment form'
    });
  }
});

// Get all assessment forms
app.get('/api/assessment/forms', async (req, res) => {
  try {
    const forms = await AssessmentForm.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: forms
    });
  } catch (error) {
    console.error('Error fetching assessment forms:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch assessment forms'
    });
  }
});

// Get assessment form by code
app.get('/api/assessment/forms/:code', async (req, res) => {
  try {
    const { code } = req.params;

    // Find form and check if it's expired (for temporary forms)
    const form = await AssessmentForm.findOne({
      code: code.toUpperCase(),
      $or: [
        { isTemporary: false }, // Permanent forms don't expire
        {
          isTemporary: true,
          expiresAt: { $gt: new Date() } // Temporary forms must not be expired
        }
      ]
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Assessment form not found or has expired'
      });
    }

    // Add expiry information to response for temporary forms
    const responseData = {
      ...form.toObject()
    };

    if (form.isTemporary) {
      responseData.timeRemaining = Math.max(0, form.expiresAt.getTime() - Date.now());
      responseData.isExpired = form.expiresAt <= new Date();
    }

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error fetching assessment form:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch assessment form'
    });
  }
});

// Delete assessment form
app.delete('/api/assessment/forms/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedForm = await AssessmentForm.findByIdAndDelete(id);

    if (!deletedForm) {
      return res.status(404).json({
        success: false,
        message: 'Assessment form not found'
      });
    }

    res.json({
      success: true,
      message: 'Assessment form deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting assessment form:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete assessment form'
    });
  }
});

// ===============================
// ASSESSMENT SUBMISSION APIs
// ===============================

// Save assessment submission
app.post('/api/assessment/submissions', async (req, res) => {
  try {
    console.log('=== Assessment Submission Request ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const { formCode, participantName, participantIcNumber, participantEmail, answers, score, correctAnswers, totalQuestions, timeSpent, batchId, batchDate } = req.body;

    // Validation
    console.log('Validating fields...');
    if (!formCode || !participantName || !answers || score === undefined) {
      console.log('Validation failed:', { formCode, participantName, answers: !!answers, score });
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }
    console.log('Validation passed');

    // Verify form exists (don't block expired forms, but track their status)
    console.log('Checking if form exists:', formCode.toUpperCase());
    const form = await AssessmentForm.findOne({
      code: formCode.toUpperCase()
    });

    if (!form) {
      console.log('Form not found:', formCode.toUpperCase());
      return res.status(404).json({
        success: false,
        message: 'Assessment form not found'
      });
    }

    // Check if form is expired (for tracking purposes, but don't block submission)
    const isExpired = form.isTemporary && form.expiresAt && form.expiresAt <= new Date();
    console.log('Form found:', form.code, form.isTemporary ? `(Temporary, expires: ${form.expiresAt}, expired: ${isExpired})` : '(Permanent)');

    // Generate unique submission ID
    console.log('Generating submission ID...');
    const submissionId = await generateSubmissionId();
    console.log('Generated submission ID:', submissionId);

    // Generate batch information if not provided
    const submissionDate = new Date();
    const dateStr = submissionDate.toISOString().split('T')[0];
    const finalBatchId = batchId || `${formCode.toUpperCase()}-${dateStr}`;
    const finalBatchDate = batchDate || dateStr;

    console.log('Creating submission object...');
    const newSubmission = new AssessmentSubmission({
      submissionId: submissionId,
      formCode: formCode.toUpperCase(),
      participantName: participantName,
      participantIcNumber: participantIcNumber || null,
      participantEmail: participantEmail || null,
      answers: answers,
      score: score,
      correctAnswers: correctAnswers,
      totalQuestions: totalQuestions,
      timeSpent: timeSpent,
      batchId: finalBatchId,
      batchDate: finalBatchDate,
      submittedAfterExpiry: isExpired
    });

    console.log('Saving submission to database...');
    const savedSubmission = await newSubmission.save();
    console.log('Submission saved successfully:', savedSubmission.submissionId);

    res.status(201).json({
      success: true,
      message: isExpired ?
        'Assessment submission saved successfully. Note: This form code has expired, but your submission has been recorded.' :
        'Assessment submission saved successfully',
      data: savedSubmission,
      warnings: isExpired ? ['Form code was expired at time of submission'] : []
    });
  } catch (error) {
    console.error('Error saving assessment submission:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to save assessment submission'
    });
  }
});

// Recover lost assessment submissions
app.post('/api/assessment/recover', async (req, res) => {
  try {
    console.log('=== Assessment Recovery Request ===');
    const { backupData, adminNote } = req.body;

    if (!backupData || !Array.isArray(backupData)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid backup data provided'
      });
    }

    const recoveredSubmissions = [];
    const errors = [];

    for (const backup of backupData) {
      try {
        // Validate backup data structure
        if (!backup.userInfo || !backup.scoreData || !backup.assessmentFormData) {
          errors.push(`Invalid backup structure for ${backup.userInfo?.name || 'unknown'}`);
          continue;
        }

        // Check if this submission already exists
        const existingSubmission = await AssessmentSubmission.findOne({
          participantName: backup.userInfo.name,
          participantEmail: backup.userInfo.email,
          formCode: backup.assessmentFormData.code,
          submittedAt: new Date(backup.submissionTime)
        });

        if (existingSubmission) {
          errors.push(`Submission already exists for ${backup.userInfo.name}`);
          continue;
        }

        // Generate unique submission ID
        const submissionId = await generateSubmissionId();

        // Create submission from backup data
        const newSubmission = new AssessmentSubmission({
          submissionId: submissionId,
          formCode: backup.assessmentFormData.code.toUpperCase(),
          participantName: backup.userInfo.name,
          participantEmail: backup.userInfo.email,
          answers: backup.scoreData.answers ? Object.keys(backup.scoreData.answers).map(questionId => ({
            questionId: parseInt(questionId),
            selectedAnswer: backup.scoreData.answers[questionId],
            isCorrect: false // Will be recalculated if needed
          })) : [],
          score: backup.scoreData.percentage || 0,
          correctAnswers: backup.scoreData.score || 0,
          totalQuestions: backup.scoreData.totalQuestions || 0,
          timeSpent: backup.scoreData.timeSpent || 0,
          batchId: `RECOVERED-${backup.assessmentFormData.code}-${new Date().toISOString().split('T')[0]}`,
          batchDate: new Date(backup.submissionTime).toISOString().split('T')[0],
          submittedAfterExpiry: true, // Mark as recovered data
          completedAt: new Date(backup.submissionTime)
        });

        const savedSubmission = await newSubmission.save();
        recoveredSubmissions.push(savedSubmission);
        console.log('Recovered submission:', savedSubmission.submissionId);

      } catch (error) {
        console.error('Error recovering individual submission:', error);
        errors.push(`Failed to recover submission for ${backup.userInfo?.name}: ${error.message}`);
      }
    }

    res.status(200).json({
      success: true,
      message: `Recovery completed. ${recoveredSubmissions.length} submissions recovered, ${errors.length} errors.`,
      data: {
        recovered: recoveredSubmissions.length,
        errors: errors.length,
        recoveredSubmissions: recoveredSubmissions.map(s => s.submissionId),
        errorDetails: errors
      }
    });

  } catch (error) {
    console.error('Error in assessment recovery:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to recover assessment submissions'
    });
  }
});

// Get all assessment submissions
app.get('/api/assessment/submissions', async (req, res) => {
  try {
    const { batchId, batchDate } = req.query;
    let query = {};

    // Filter by batch if provided
    if (batchId) {
      query.batchId = batchId;
    }
    if (batchDate) {
      query.batchDate = batchDate;
    }

    const submissions = await AssessmentSubmission.find(query).sort({ completedAt: -1 });

    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('Error fetching assessment submissions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch assessment submissions'
    });
  }
});

// Clear all assessment submissions
app.delete('/api/assessment/submissions/clear', async (req, res) => {
  try {
    console.log('=== Clear All Assessment Submissions Request ===');

    const result = await AssessmentSubmission.deleteMany({});

    console.log(`Successfully cleared ${result.deletedCount} assessment submissions`);

    res.json({
      success: true,
      message: `Successfully cleared ${result.deletedCount} assessment submissions`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error clearing assessment submissions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to clear assessment submissions'
    });
  }
});

// Get assessment batches (grouped by batchId)
app.get('/api/assessment/batches', async (req, res) => {
  try {
    const { fromDate } = req.query;

    // Build match stage for date filtering
    let matchStage = {};
    if (fromDate) {
      matchStage.batchDate = { $gte: fromDate };
    }

    // Build aggregation pipeline
    const pipeline = [];

    // Add match stage if we have filters
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Add the rest of the pipeline
    pipeline.push(
      {
        $group: {
          _id: '$batchId',
          batchDate: { $first: '$batchDate' },
          formCode: { $first: '$formCode' },
          submissionCount: { $sum: 1 },
          averageScore: { $avg: '$score' },
          submissions: { $push: '$$ROOT' }
        }
      },
      {
        $lookup: {
          from: 'assessmentforms',
          localField: 'formCode',
          foreignField: 'code',
          as: 'formInfo'
        }
      },
      {
        $addFields: {
          formTitle: { $arrayElemAt: ['$formInfo.title', 0] }
        }
      },
      {
        $project: {
          formInfo: 0
        }
      },
      {
        $sort: { batchDate: -1 }
      }
    );

    const batches = await AssessmentSubmission.aggregate(pipeline);

    res.json({
      success: true,
      data: batches
    });
  } catch (error) {
    console.error('Error fetching assessment batches:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch assessment batches'
    });
  }
});

// ===============================
// MESSAGING APIs
// ===============================

// Helper function to generate message ID
const generateMessageId = () => {
  return 'MSG' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
};

// Send message from admin to organiser
app.post('/api/messages/send', async (req, res) => {
  try {
    const {
      fromType,
      fromId,
      fromName,
      toType,
      toId,
      toName,
      subject,
      content,
      priority = 'normal',
      category = 'general',
      relatedApplicationId = null
    } = req.body;

    const messageId = generateMessageId();

    const newMessage = new Message({
      messageId,
      fromType,
      fromId,
      fromName,
      toType,
      toId,
      toName,
      subject,
      content,
      priority,
      category,
      relatedApplicationId
    });

    await newMessage.save();

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
      message: error.message
    });
  }
});

// Get messages for a specific user (inbox)
app.get('/api/messages/inbox/:userType/:userId', async (req, res) => {
  try {
    const { userType, userId } = req.params;
    const { limit = 50, offset = 0, unreadOnly = false } = req.query;

    let query = {
      toType: userType,
      toId: userId
    };

    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const totalCount = await Message.countDocuments(query);
    const unreadCount = await Message.countDocuments({
      toType: userType,
      toId: userId,
      isRead: false
    });

    res.json({
      success: true,
      data: {
        messages,
        totalCount,
        unreadCount,
        hasMore: (parseInt(offset) + messages.length) < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching inbox messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages',
      message: error.message
    });
  }
});

// Get sent messages for a specific user
app.get('/api/messages/sent/:userType/:userId', async (req, res) => {
  try {
    const { userType, userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const messages = await Message.find({
      fromType: userType,
      fromId: userId
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const totalCount = await Message.countDocuments({
      fromType: userType,
      fromId: userId
    });

    res.json({
      success: true,
      data: {
        messages,
        totalCount,
        hasMore: (parseInt(offset) + messages.length) < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching sent messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sent messages',
      message: error.message
    });
  }
});

// Mark message as read
app.patch('/api/messages/:messageId/read', async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findOneAndUpdate(
      { messageId },
      {
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    res.json({
      success: true,
      message: 'Message marked as read',
      data: message
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark message as read',
      message: error.message
    });
  }
});

// Get unread message count
app.get('/api/messages/unread-count/:userType/:userId', async (req, res) => {
  try {
    const { userType, userId } = req.params;

    const unreadCount = await Message.countDocuments({
      toType: userType,
      toId: userId,
      isRead: false
    });

    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unread count',
      message: error.message
    });
  }
});

// Delete message
app.delete('/api/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findOneAndDelete({ messageId });

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete message',
      message: error.message
    });
  }
});

// Get message by ID
app.get('/api/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findOne({ messageId });

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch message',
      message: error.message
    });
  }
});

// ===============================
// FILE UPLOAD APIs
// ===============================


// Upload single file
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        path: `/uploads/${req.file.filename}`,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload multiple files
app.post('/api/upload/multiple', upload.array('files', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const files = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      path: `/uploads/${file.filename}`,
      mimetype: file.mimetype
    }));

    res.json({
      success: true,
      message: 'Files uploaded successfully',
      files
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===============================
// STATISTICS & ANALYTICS APIs
// ===============================

// Get dashboard statistics
app.get('/api/stats/dashboard', async (req, res) => {
  try {
    const stats = {
      players: {
        total: await Player.countDocuments(),
        active: await Player.countDocuments({ 'membership.status': 'active' }),
        newThisMonth: await Player.countDocuments({
          createdAt: { $gte: new Date(new Date().setDate(1)) }
        })
      },
      events: {
        total: await Event.countDocuments(),
        upcoming: await Event.countDocuments({
          'schedule.startDate': { $gte: new Date() }
        }),
        ongoing: await Event.countDocuments({
          'basicInfo.status': 'Ongoing'
        })
      },
      venues: {
        total: await Venue.countDocuments(),
        active: await Venue.countDocuments({ status: 'active' })
      },
      organizations: {
        total: await Organization.countDocuments(),
        active: await Organization.countDocuments({ status: 'active' })
      },
      bookings: {
        total: await Booking.countDocuments(),
        confirmed: await Booking.countDocuments({ status: 'Confirmed' }),
        thisMonth: await Booking.countDocuments({
          createdAt: { $gte: new Date(new Date().setDate(1)) }
        })
      },
      applications: {
        total: await TournamentApplication.countDocuments(),
        pending: await TournamentApplication.countDocuments({ status: 'Pending Review' }),
        approved: await TournamentApplication.countDocuments({ status: 'Approved' })
      }
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get player statistics by state
app.get('/api/stats/players/by-state', async (req, res) => {
  try {
    const stats = await Player.aggregate([
      {
        $group: {
          _id: '$personalInfo.address.state',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get events statistics
app.get('/api/stats/events', async (req, res) => {
  try {
    const typeStats = await Event.aggregate([
      {
        $group: {
          _id: '$basicInfo.type',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusStats = await Event.aggregate([
      {
        $group: {
          _id: '$basicInfo.status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        byType: typeStats,
        byStatus: statusStats
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// SEARCH & FILTER APIs
// ===============================

// Global search
app.get('/api/search', async (req, res) => {
  try {
    const { q, type } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const results = {};

    if (!type || type === 'players') {
      results.players = await Player.find({
        $or: [
          { 'personalInfo.fullName': { $regex: q, $options: 'i' } },
          { 'personalInfo.email': { $regex: q, $options: 'i' } },
          { playerId: { $regex: q, $options: 'i' } }
        ]
      }).limit(10);
    }

    if (!type || type === 'events') {
      results.events = await Event.find({
        $or: [
          { 'basicInfo.title': { $regex: q, $options: 'i' } },
          { 'basicInfo.description': { $regex: q, $options: 'i' } },
          { eventId: { $regex: q, $options: 'i' } }
        ]
      }).limit(10);
    }

    if (!type || type === 'venues') {
      results.venues = await Venue.find({
        $or: [
          { 'basicInfo.name': { $regex: q, $options: 'i' } },
          { 'basicInfo.address.city': { $regex: q, $options: 'i' } },
          { venueId: { $regex: q, $options: 'i' } }
        ]
      }).limit(10);
    }

    if (!type || type === 'organizations') {
      results.organizations = await Organization.find({
        $or: [
          { organizationName: { $regex: q, $options: 'i' } },
          { registrationNo: { $regex: q, $options: 'i' } },
          { organizationId: { $regex: q, $options: 'i' } }
        ]
      }).limit(10);
    }

    res.json({
      success: true,
      query: q,
      results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve uploaded files (for admin to download/view documents)
app.get('/api/files/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, 'uploads', filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Set appropriate headers
  res.setHeader('Content-Disposition', 'inline'); // For viewing in browser
  res.sendFile(filePath);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    features: [
      'Player Management',
      'Venue Management', 
      'Event Management',
      'Booking System',
      'Tournament Applications',
      'Organization Management',
      'News & Announcements',
      'File Upload',
      'Statistics & Analytics',
      'Search & Filter'
    ]
  });
});

// API Documentation endpoint
app.get('/api/docs', (req, res) => {
  const apiDocs = {
    title: 'Malaysia Pickleball Portal API',
    version: '1.0.0',
    description: 'Complete API for managing pickleball portal operations',
    baseURL: req.protocol + '://' + req.get('host') + '/api',
    endpoints: {
      'Player Management': [
        'POST /api/players/register - Register new player',
        'GET /api/players - Get all players with filtering',
        'GET /api/players/:id - Get player by ID',
        'PATCH /api/players/:id - Update player',
        'DELETE /api/players/:id - Delete player'
      ],
      'Venue Management': [
        'POST /api/venues - Create new venue',
        'GET /api/venues - Get all venues with filtering',
        'GET /api/venues/:id - Get venue by ID',
        'PATCH /api/venues/:id - Update venue',
        'DELETE /api/venues/:id - Delete venue'
      ],
      'Event Management': [
        'POST /api/events - Create new event',
        'GET /api/events - Get all events with filtering',
        'GET /api/events/:id - Get event by ID',
        'PATCH /api/events/:id - Update event',
        'DELETE /api/events/:id - Delete event',
        'POST /api/events/:id/register - Register player for event'
      ],
      'Booking System': [
        'POST /api/bookings - Create new booking',
        'GET /api/bookings - Get all bookings with filtering',
        'GET /api/bookings/:id - Get booking by ID',
        'PATCH /api/bookings/:id - Update booking',
        'PATCH /api/bookings/:id/cancel - Cancel booking'
      ],
      'Organization Management': [
        'POST /api/organizations/register - Register organization',
        'POST /api/organizations/login - Organization login',
        'GET /api/organizations - Get all organizations',
        'PATCH /api/organizations/:id/suspend - Suspend organization',
        'PATCH /api/organizations/:id/reactivate - Reactivate organization',
        'DELETE /api/organizations/:id - Delete organization'
      ],
      'Tournament Applications': [
        'POST /api/applications - Submit tournament application',
        'GET /api/applications - Get all applications',
        'GET /api/applications/:id - Get application by ID',
        'PATCH /api/applications/:id/status - Update application status',
        'PATCH /api/applications/:id - Update application details',
        'DELETE /api/applications/:id - Delete application',
        'GET /api/approved-tournaments - Get approved tournaments'
      ],
      'News & Announcements': [
        'POST /api/news - Create news/announcement',
        'GET /api/news - Get all news with filtering',
        'GET /api/news/:id - Get news by ID (increments view count)',
        'PATCH /api/news/:id - Update news',
        'DELETE /api/news/:id - Delete news'
      ],
      'File Management': [
        'POST /api/upload - Upload single file',
        'POST /api/upload/multiple - Upload multiple files',
        'GET /uploads/:filename - Access uploaded files'
      ],
      'Statistics & Analytics': [
        'GET /api/stats/dashboard - Get dashboard statistics',
        'GET /api/stats/players/by-state - Get player statistics by state',
        'GET /api/stats/events - Get event statistics'
      ],
      'Search & Utilities': [
        'GET /api/search - Global search across all entities',
        'GET /api/health - Health check',
        'GET /api/docs - API documentation'
      ],
      'Admin Management': [
        'POST /api/admin/login - Admin login',
        'GET /api/admin/login-history - Get login history',
        'POST /api/admin/users - Create admin user',
        'GET /api/admin/users - Get all admin users',
        'PATCH /api/admin/users/:id/status - Update admin user status',
        'DELETE /api/admin/users/:id - Delete admin user'
      ],
      'Assessment Management': [
        'POST /api/assessment/forms - Save assessment form',
        'GET /api/assessment/forms - Get all assessment forms',
        'GET /api/assessment/forms/:code - Get assessment form by code',
        'DELETE /api/assessment/forms/:id - Delete assessment form',
        'POST /api/assessment/submissions - Save assessment submission',
        'GET /api/assessment/submissions - Get all assessment submissions (supports ?batchId=X&batchDate=Y filters)',
        'GET /api/assessment/batches - Get assessment batches grouped by batchId (supports ?fromDate=YYYY-MM-DD filter)'
      ]
    }
  };

  res.json(apiDocs);
});

// Serve document from MongoDB
app.get('/api/documents/:applicationId/:documentIndex', async (req, res) => {
  try {
    const { applicationId, documentIndex } = req.params;

    const application = await TournamentApplication.findOne({ applicationId });

    if (!application || !application.supportDocuments || !application.supportDocuments[documentIndex]) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = application.supportDocuments[documentIndex];

    // Convert Base64 back to buffer
    const fileBuffer = Buffer.from(doc.data, 'base64');

    // Set headers
    res.setHeader('Content-Type', doc.mimetype);
    res.setHeader('Content-Disposition', `inline; filename="${doc.originalname}"`);
    res.setHeader('Content-Length', fileBuffer.length);

    // Send file
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error serving document:', error);
    res.status(500).json({ error: 'Error serving document' });
  }
});

// Catch-all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Initialize default assessment form
async function initializeDefaultAssessmentForm() {
  try {
    const generalForm = await AssessmentForm.findOne({ code: 'GNRAL' });

    if (!generalForm) {
      console.log('Creating default GNRAL assessment form...');
      const newForm = new AssessmentForm({
        code: 'GNRAL',
        title: 'Tournament Readiness Assessment',
        description: 'General pickleball knowledge assessment for tournament readiness',
        questions: [
          {
            id: 1,
            question: "What is the standard court size for pickleball?",
            section: 'Court Specifications',
            options: [
              { text: "20' x 44'" },
              { text: "20' x 40'" },
              { text: "24' x 44'" },
              { text: "20' x 48'" }
            ],
            correctAnswer: "20' x 44'"
          },
          {
            id: 2,
            question: "What is the height of the net at the center?",
            section: 'Court Specifications',
            options: [
              { text: "34 inches" },
              { text: "36 inches" },
              { text: "32 inches" },
              { text: "38 inches" }
            ],
            correctAnswer: "34 inches"
          },
          {
            id: 3,
            question: "What is the non-volley zone also called?",
            section: 'Rules & Regulations',
            options: [
              { text: "The service area" },
              { text: "The kitchen" },
              { text: "The baseline" },
              { text: "The sideline" }
            ],
            correctAnswer: "The kitchen"
          },
          {
            id: 4,
            question: "In doubles play, which player serves first?",
            section: 'Rules & Regulations',
            options: [
              { text: "The player on the left" },
              { text: "The player on the right" },
              { text: "Either player can serve" },
              { text: "The team captain decides" }
            ],
            correctAnswer: "The player on the right"
          },
          {
            id: 5,
            question: "What happens when the ball hits the net and goes over during a serve?",
            section: 'Rules & Regulations',
            options: [
              { text: "It's a fault" },
              { text: "It's a let, replay the serve" },
              { text: "It's a valid serve" },
              { text: "The receiving team gets a point" }
            ],
            correctAnswer: "It's a fault"
          }
        ],
        timeLimit: 30,
        isTemporary: false,
        isDraft: false
      });

      await newForm.save();
      console.log('✅ Default GNRAL assessment form created');
    } else {
      console.log('✅ Default GNRAL assessment form already exists');
    }
  } catch (error) {
    console.error('Error initializing default assessment form:', error);
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await initializeDefaultAssessmentForm();
});