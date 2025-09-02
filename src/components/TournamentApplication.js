import React, { useState } from 'react';
import jsPDF from 'jspdf';
import mpaLogo from '../assets/images/mpa.png';

const TournamentApplication = ({ setCurrentPage }) => {
  const [formData, setFormData] = useState({
    // Organiser Information
    organiserName: '',
    registrationNo: '',
    telContact: '',
    organisingPartner: '',
    
    // Event Details
    eventTitle: '',
    eventDates: '',
    location: '',
    venue: '',
    classification: '',
    expectedParticipants: '',
    eventSummary: '',
    
    // Tournament Settings
    scoringFormat: 'traditional',
    
    // Consent
    dataConsent: false,
    termsConsent: false
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const [applications, setApplications] = useState(() => {
    const saved = localStorage.getItem('tournamentApplications');
    return saved ? JSON.parse(saved) : [];
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const generateApplicationId = () => {
    // Generate 6 random alphanumeric characters (letters and numbers)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return 'MPA' + result;
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    let yPosition = 20;
    
    // Add MPA Logo
    const img = new Image();
    img.onload = function() {
      // Header with logo
      doc.addImage(img, 'PNG', 20, yPosition, 30, 30);
      
      // Title next to logo
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('MALAYSIA PICKLEBALL ASSOCIATION', 55, yPosition + 10);
      doc.setFontSize(14);
      doc.text('TOURNAMENT APPLICATION FORM', 55, yPosition + 20);
      
      yPosition += 40;
      
      // Header line
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 10;
      
      // Application details box
      doc.setFillColor(240, 248, 255);
      doc.roundedRect(20, yPosition, 170, 20, 3, 3, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Application ID: ${generateApplicationId()}`, 25, yPosition + 8);
      doc.text(`Submission Date: ${new Date().toLocaleDateString('en-MY')}`, 25, yPosition + 15);
      yPosition += 30;
      
      // Section: Organiser Information
      doc.setFillColor(70, 130, 180);
      doc.roundedRect(20, yPosition, 170, 8, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('ORGANISER INFORMATION', 25, yPosition + 5);
      yPosition += 15;
      
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Organiser Name: ${formData.organiserName || 'Not provided'}`, 25, yPosition);
      yPosition += 8;
      doc.text(`Registration No.: ${formData.registrationNo || 'Not provided'}`, 25, yPosition);
      yPosition += 8;
      doc.text(`Telephone Contact: ${formData.telContact || 'Not provided'}`, 25, yPosition);
      yPosition += 8;
      doc.text(`Organising Partner: ${formData.organisingPartner || 'Not applicable'}`, 25, yPosition);
      yPosition += 15;
      
      // Section: Event Details
      doc.setFillColor(70, 130, 180);
      doc.roundedRect(20, yPosition, 170, 8, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('EVENT DETAILS', 25, yPosition + 5);
      yPosition += 15;
      
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Event Title: ${formData.eventTitle || 'Not provided'}`, 25, yPosition);
      yPosition += 8;
      doc.text(`Event Dates: ${formData.eventDates || 'Not provided'}`, 25, yPosition);
      yPosition += 8;
      doc.text(`Location: ${formData.location || 'Not provided'}`, 25, yPosition);
      yPosition += 8;
      doc.text(`Venue: ${formData.venue || 'Not provided'}`, 25, yPosition);
      yPosition += 8;
      doc.text(`Level/Type of Event: ${formData.classification || 'Not provided'}`, 25, yPosition);
      yPosition += 8;
      doc.text(`Expected Participants: ${formData.expectedParticipants || 'Not provided'}`, 25, yPosition);
      yPosition += 15;
      
      // Event Summary
      doc.setFont('helvetica', 'bold');
      doc.text('Event Summary/Purpose:', 25, yPosition);
      yPosition += 8;
      doc.setFont('helvetica', 'normal');
      const summary = formData.eventSummary || 'No summary provided';
      const splitSummary = doc.splitTextToSize(summary, 165);
      doc.text(splitSummary, 25, yPosition);
      yPosition += splitSummary.length * 6 + 10;
      
      // Add new page
      doc.addPage();
      yPosition = 20;
      
      // Section: Consent & Agreement
      doc.setFillColor(70, 130, 180);
      doc.roundedRect(20, yPosition, 170, 8, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('CONSENT & AGREEMENT', 25, yPosition + 5);
      yPosition += 15;
      
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      
      // Data Consent
      doc.setFont('helvetica', 'bold');
      doc.text(`Data Consent: ${formData.dataConsent ? '✓ AGREED' : '✗ NOT AGREED'}`, 25, yPosition);
      yPosition += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const dataConsentText = 'I consent to the collection, use, and processing of my personal data by Malaysia Pickleball Association (MPA) for the purposes of tournament organization, administration, and related communications. I understand that my data will be handled in accordance with applicable data protection laws.';
      const splitDataConsent = doc.splitTextToSize(dataConsentText, 165);
      doc.text(splitDataConsent, 25, yPosition);
      yPosition += splitDataConsent.length * 5 + 10;
      
      // Terms Consent
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Terms & Conditions: ${formData.termsConsent ? '✓ AGREED' : '✗ NOT AGREED'}`, 25, yPosition);
      yPosition += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const termsConsentText = 'I have read, understood, and agree to abide by the Terms and Conditions set forth by Malaysia Pickleball Association (MPA) for tournament participation and organization. I acknowledge that failure to comply with these terms may result in disqualification or other appropriate actions.';
      const splitTermsConsent = doc.splitTextToSize(termsConsentText, 165);
      doc.text(splitTermsConsent, 25, yPosition);
      yPosition += splitTermsConsent.length * 5 + 15;
      
      // Important Notes
      doc.setFillColor(255, 248, 220);
      doc.roundedRect(20, yPosition, 170, 50, 3, 3, 'F');
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('IMPORTANT NOTES', 25, yPosition + 8);
      yPosition += 15;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('SCORING FORMAT:', 25, yPosition);
      yPosition += 6;
      doc.setFont('helvetica', 'normal');
      doc.text('• Traditional scoring up to 11 pts or more', 30, yPosition);
      yPosition += 5;
      doc.text('• Rally Scoring (minimum up to 21 pts) is acceptable for first round-robins only', 30, yPosition);
      yPosition += 10;
      
      doc.setFont('helvetica', 'bold');
      doc.text('SKILL RATING GUIDELINES:', 25, yPosition);
      yPosition += 6;
      doc.setFont('helvetica', 'normal');
      doc.text('• Novice: 2.499 & below  • Intermediate: 2.999 & below  • Intermediate+: 3.499 & below', 30, yPosition);
      yPosition += 5;
      doc.text('• Advanced: 3.999 & below  • Advanced+: 4.499 & below  • Elite: 4.5 & above', 30, yPosition);
      
      // Footer
      yPosition = 280;
      doc.setDrawColor(70, 130, 180);
      doc.setLineWidth(1);
      doc.line(20, yPosition, 190, yPosition);
      doc.setFontSize(8);
      doc.setTextColor(70, 130, 180);
      doc.text(`Generated by Malaysia Pickleball Portal | ${new Date().toLocaleString('en-MY')}`, 25, yPosition + 5);
      
      // Open PDF in new tab instead of downloading
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    };
    
    img.src = mpaLogo;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newApplication = {
      id: generateApplicationId(),
      ...formData,
      submissionDate: new Date().toISOString(),
      status: 'Pending Review'
    };
    
    const updatedApplications = [...applications, newApplication];
    setApplications(updatedApplications);
    localStorage.setItem('tournamentApplications', JSON.stringify(updatedApplications));
    
    alert(`Application submitted successfully! Your application ID is: ${newApplication.id}`);
    
    // Enable PDF download and show message
    setIsSubmitted(true);
    
    setFormData({
      fullName: '',
      nric: '',
      email: '',
      phone: '',
      age: '',
      category: '',
      experience: '',
      emergencyContact: '',
      emergencyPhone: '',
      medicalConditions: ''
    });
  };

  const handleSave = () => {
    // Generate form content based on filled data
    const formContent = generateFormContent();
    
    // Create and download the form
    const element = document.createElement('a');
    const file = new Blob([formContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Tournament_Application_${formData.eventTitle || 'Form'}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    alert('Form saved successfully!');
  };

  const generateFormContent = () => {
    const currentDate = new Date().toLocaleDateString('en-MY');
    
    return `
MALAYSIA PICKLEBALL ASSOCIATION
TOURNAMENT APPLICATION FORM

Generated on: ${currentDate}

===========================================
ORGANISER INFORMATION
===========================================
Organiser Name: ${formData.organiserName || '[Not filled]'}
PJS/ROS/Company Registration No.: ${formData.registrationNo || '[Not filled]'}
Tel. Contact: ${formData.telContact || '[Not filled]'}
Organising Partner: ${formData.organisingPartner || '[Not applicable]'}

===========================================
EVENT DETAILS
===========================================
Title of Event: ${formData.eventTitle || '[Not filled]'}
Dates of Event: ${formData.eventDates || '[Not filled]'}
Location: ${formData.location || '[Not filled]'}
Venue: ${formData.venue || '[Not filled]'}
Level/Type of Event: ${formData.classification || '[Not filled]'}
Expected No. of Participants: ${formData.expectedParticipants || '[Not filled]'}

Brief Summary/Purpose of Event:
${formData.eventSummary || '[Not filled]'}

===========================================
TOURNAMENT CATEGORIES & SKILL RATINGS
===========================================
Skill Rating Guidelines:
• Novice: 2.499 & below
• Intermediate: 2.999 & below
• Intermediate+: 3.499 & below
• Advanced: 3.999 & below
• Advanced+: 4.499 & below
• Elite: 4.5 & above

Note: Players with lower ratings can play in any higher rated categories
but players of higher ratings cannot participate in the lower rated categories.

===========================================
SCORING FORMAT
===========================================
Scoring Format to be adopted for each match:
• Traditional scoring up to 11 pts or more
• Rally Scoring minimum up to 21 pts is acceptable for the first round-robins only

===========================================
IMPORTANT REMARKS
===========================================
• Endorsement logos (state, national & PJS/KBS) must be displayed on your event banners/at the venue etc.
• Traditional scoring up to 11 pts or more; Rally Scoring (minimum up to 21 pts) is acceptable for the first round-robins only.

===========================================
REQUIREMENTS
===========================================
• Event title should NOT include the National/State Title (e.g. Malaysia Open/Closed, State Open/Closed etc)
• Venue must have government occupancy permit
• Date format should be DD/MM/YYYY - DD/MM/YYYY

---
This form was generated from the Malaysia Pickleball Association Tournament Application Portal
Generated on: ${currentDate}
    `.trim();
  };

  return (
    <div className="tournament-application">
      <h2>Tournament Application Form</h2>
      <p className="form-subtitle">Apply to organize a pickleball tournament</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Organiser Information</h3>
          <div className="form-group">
            <label htmlFor="organiserName">Organiser Name *</label>
            <input
              type="text"
              id="organiserName"
              name="organiserName"
              value={formData.organiserName}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="registrationNo">PJS/ROS/Company Registration No. *</label>
            <input
              type="text"
              id="registrationNo"
              name="registrationNo"
              value={formData.registrationNo}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="telContact">Tel. Contact *</label>
            <input
              type="tel"
              id="telContact"
              name="telContact"
              value={formData.telContact}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="organisingPartner">Organising Partner (if applicable)</label>
            <input
              type="text"
              id="organisingPartner"
              name="organisingPartner"
              value={formData.organisingPartner}
              onChange={handleInputChange}
            />
          </div>
        </div>
        
        <div className="form-section">
          <h3>Event Details</h3>
          <div className="form-group">
            <label htmlFor="eventTitle">Title of Event *</label>
            <input
              type="text"
              id="eventTitle"
              name="eventTitle"
              value={formData.eventTitle}
              onChange={handleInputChange}
              placeholder="Should not include 'Malaysia (or State) Open/Closed'"
              required
            />
            <small className="form-note">Note: Should Not Include the National/State Title (e.g. Malaysia Open/Closed, State Open/Closed etc)</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="eventDates">Dates of Event *</label>
            <input
              type="text"
              id="eventDates"
              name="eventDates"
              value={formData.eventDates}
              onChange={handleInputChange}
              placeholder="Start Date - End Date (DD/MM/YYYY)"
              required
            />
            <small className="form-note">Format: DD/MM/YYYY - DD/MM/YYYY (e.g., 15/03/2024 - 17/03/2024)</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="location">Location *</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Town, district, state, etc"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="venue">Venue *</label>
            <input
              type="text"
              id="venue"
              name="venue"
              value={formData.venue}
              onChange={handleInputChange}
              placeholder="Covered - with OP, etc."
              required
            />
            <small className="form-note">Note: Must have government occupancy permit</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="classification">Level/Type of Event *</label>
            <select
              id="classification"
              name="classification"
              value={formData.classification}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Level/Type</option>
              <option value="District">District</option>
              <option value="Divisional">Divisional</option>
              <option value="State">State</option>
              <option value="National">National</option>
              <option value="International">International</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="expectedParticipants">Expected No. of Participants *</label>
            <input
              type="number"
              id="expectedParticipants"
              name="expectedParticipants"
              value={formData.expectedParticipants}
              onChange={handleInputChange}
              min="1"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="eventSummary">Brief Summary/Purpose of Event *</label>
            <textarea
              id="eventSummary"
              name="eventSummary"
              value={formData.eventSummary}
              onChange={handleInputChange}
              rows="5"
              maxLength="300"
              placeholder="Brief description of your event (not more than 300 words). Do not include your factsheet."
              required
            />
            <small className="form-note">Maximum 300 words. Do not include your factsheet.</small>
          </div>
        </div>
        
        <div className="form-section">
          <h3>NOTE : SCORING</h3>
          <div className="scoring-reminder">
            <p><strong>*Scoring Format</strong> to be adopted for each match:</p>
            <ul className="scoring-list">
              <li>Traditional scoring up to 11 pts or more;</li>
              <li>Rally Scoring minimum up to 21 pts is acceptable for the first round-robins only.</li>
            </ul>
          </div>
        </div>
        
        <div className="form-section">
          <h3>Tournament Categories & Skill Ratings</h3>
          <div className="skill-ratings-info">
            <h4>Skill Rating Guidelines:</h4>
            <ul className="skill-ratings">
              <li><strong>Novice:</strong> 2.499 & below</li>
              <li><strong>Intermediate:</strong> 2.999 & below</li>
              <li><strong>Intermediate+:</strong> 3.499 & below</li>
              <li><strong>Advanced:</strong> 3.999 & below</li>
              <li><strong>Advanced+:</strong> 4.499 & below</li>
              <li><strong>Elite:</strong> 4.5 & above</li>
            </ul>
            <p className="skill-note">
              <strong>Note:</strong> Players with lower ratings can play in any higher rated categories 
              but players of higher ratings cannot participate in the lower rated categories.
            </p>
          </div>
        </div>
        
        <div className="form-section">
          <h3>Important Remarks</h3>
          <div className="remarks-info">
            <ul className="remarks-list">
              <li>Endorsement logos (state, national & PJS/KBS) must be displayed on your event banners/at the venue etc.</li>
              <li>Traditional scoring up to 11 pts or more; Rally Scoring (minimum up to 21 pts) is acceptable for the first round-robins only.</li>
            </ul>
          </div>
        </div>
        
        <div className="form-section">
          <h3>Important Consent & Agreement</h3>
          <div className="consent-section">
            <div className="consent-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="dataConsent"
                  checked={formData.dataConsent}
                  onChange={handleInputChange}
                  required
                />
                <span className="checkmark"></span>
                I consent to the collection, use, and processing of my personal data by Malaysia Pickleball Association (MPA) for the purposes of tournament organization, administration, and related communications. I understand that my data will be handled in accordance with applicable data protection laws.
              </label>
            </div>
            
            <div className="consent-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="termsConsent"
                  checked={formData.termsConsent}
                  onChange={handleInputChange}
                  required
                />
                <span className="checkmark"></span>
                I have read, understood, and agree to abide by the Terms and Conditions set forth by Malaysia Pickleball Association (MPA) for tournament participation and organization. I acknowledge that failure to comply with these terms may result in disqualification or other appropriate actions.
              </label>
            </div>
          </div>
        </div>
        
        {!isSubmitted ? (
          <div className="form-actions">
            <button type="submit" className="submit-btn">Submit Tournament Application</button>
            <button type="button" className="pdf-btn" onClick={generatePDF} disabled>Show PDF File</button>
          </div>
        ) : (
          <div className="submission-success">
            <div className="success-message">
              <h3>🎉 Application Submitted Successfully!</h3>
              <p>Your tournament application has been submitted and is now under review.</p>
              <p><strong>Important:</strong> Please download your application copy for your records.</p>
            </div>
            <div className="form-actions">
              <button type="button" className="pdf-btn active" onClick={generatePDF}>
                📄 Download Application PDF
              </button>
              <button type="button" className="home-btn" onClick={() => setCurrentPage('home')}>
                🏠 Back to Home
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default TournamentApplication;