require('dotenv').config();
const nodemailer = require('nodemailer');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

// Email Configuration
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

// Simple PDF generation for testing
const generateTestPDF = async () => {
  try {
    console.log('🔄 Generating test PDF...');
    
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const { width, height } = page.getSize();
    
    page.drawText('MALAYSIA PICKLEBALL ASSOCIATION', {
      x: 50,
      y: height - 50,
      size: 20,
      font: helveticaBoldFont,
      color: rgb(0, 0.247, 0.498)
    });
    
    page.drawText('Test Tournament Application', {
      x: 50,
      y: height - 80,
      size: 16,
      font: helveticaFont
    });
    
    page.drawText('Application ID: TEST123', {
      x: 50,
      y: height - 110,
      size: 12,
      font: helveticaBoldFont
    });
    
    page.drawText('This is a test PDF for email attachment debugging.', {
      x: 50,
      y: height - 140,
      size: 11,
      font: helveticaFont
    });
    
    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);
    
    console.log('✅ Test PDF generated, size:', buffer.length, 'bytes');
    return buffer;
    
  } catch (error) {
    console.error('❌ Error generating test PDF:', error);
    throw error;
  }
};

// Test email sending with PDF attachment
const testEmailWithPDF = async () => {
  try {
    console.log('🧪 Starting email with PDF attachment test...');
    
    // Generate PDF
    const pdfBuffer = await generateTestPDF();
    
    // Prepare attachment
    const attachments = [{
      filename: 'Test_Application.pdf',
      content: pdfBuffer,
      contentType: 'application/pdf'
    }];
    
    console.log('📎 Attachment prepared:', attachments[0].filename, '(' + attachments[0].content.length + ' bytes)');
    
    // Email configuration
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@malaysiapickleball.my',
      to: process.env.EMAIL_USER, // Send to yourself for testing
      subject: '🧪 Test: Tournament Application with PDF Attachment',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c5aa0;">Malaysia Pickleball Association</h2>
          <h3 style="color: #666;">Test Email with PDF Attachment</h3>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="color: #28a745; margin-top: 0;">✓ Test Email Successfully Sent</h4>
            <p><strong>Test ID:</strong> TEST123</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div style="background-color: #e7f3ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="color: #0056b3; margin-top: 0;">📎 Attachment Information:</h4>
            <ul style="margin-bottom: 0; line-height: 1.6;">
              <li>Your test PDF application is attached to this email</li>
              <li>Filename: Test_Application.pdf</li>
              <li>Size: ${pdfBuffer.length} bytes</li>
            </ul>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            This is a test email to verify PDF attachment functionality.<br>
            Malaysia Pickleball Association
          </p>
        </div>
      `,
      attachments: attachments
    };
    
    console.log('📧 Sending test email...');
    console.log('📧 From:', mailOptions.from);
    console.log('📧 To:', mailOptions.to);
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('✅ Message ID:', result.messageId);
    console.log('✅ Response:', result.response);
    
    return result;
    
  } catch (error) {
    console.error('❌ Error sending test email:', error);
    if (error.code === 'EAUTH') {
      console.log('❌ Authentication failed. Check your EMAIL_USER and EMAIL_PASSWORD in .env file');
    }
    throw error;
  }
};

// Run the test
console.log('🚀 Starting Email + PDF Attachment Debug Test');
console.log('📧 Email User:', process.env.EMAIL_USER);
console.log('📧 Email Password configured:', process.env.EMAIL_PASSWORD ? 'Yes' : 'No');

testEmailWithPDF()
  .then(() => {
    console.log('✅ All tests completed successfully!');
    console.log('📧 Check your email inbox for the test message with PDF attachment.');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });