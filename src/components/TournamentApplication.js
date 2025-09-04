import React, { useState } from 'react';
import jsPDF from 'jspdf';
import mpaLogo from '../assets/images/mpa.png';
import apiService from '../services/api';

const TournamentApplication = ({ setCurrentPage }) => {
  // Malaysian States and Cities data
  const malaysianStatesAndCities = {
    'Johor': ['Johor Bahru', 'Batu Pahat', 'Muar', 'Kluang', 'Pontian', 'Segamat', 'Mersing', 'Kota Tinggi', 'Kulai', 'Skudai'],
    'Kedah': ['Alor Setar', 'Sungai Petani', 'Kulim', 'Jitra', 'Baling', 'Langkawi', 'Kuala Kedah', 'Pendang', 'Sik', 'Yan'],
    'Kelantan': ['Kota Bharu', 'Wakaf Che Yeh', 'Tanah Merah', 'Machang', 'Pasir Mas', 'Gua Musang', 'Kuala Krai', 'Tumpat', 'Pasir Puteh', 'Bachok'],
    'Melaka': ['Melaka City', 'Ayer Keroh', 'Batu Berendam', 'Bukit Baru', 'Tanjung Kling', 'Jasin', 'Merlimau', 'Masjid Tanah', 'Alor Gajah', 'Bemban'],
    'Negeri Sembilan': ['Seremban', 'Port Dickson', 'Bahau', 'Tampin', 'Kuala Pilah', 'Rembau', 'Jelebu', 'Gemenceh', 'Labu', 'Linggi'],
    'Pahang': ['Kuantan', 'Temerloh', 'Bentong', 'Raub', 'Jerantut', 'Pekan', 'Kuala Lipis', 'Bera', 'Maran', 'Rompin'],
    'Penang': ['George Town', 'Bukit Mertajam', 'Butterworth', 'Perai', 'Nibong Tebal', 'Balik Pulau', 'Bayan Lepas', 'Air Itam', 'Tanjung Tokong', 'Jelutong'],
    'Perak': ['Ipoh', 'Taiping', 'Sitiawan', 'Kuala Kangsar', 'Teluk Intan', 'Batu Gajah', 'Lumut', 'Parit Buntar', 'Ayer Tawar', 'Bagan Serai'],
    'Perlis': ['Kangar', 'Arau', 'Padang Besar', 'Wang Kelian', 'Kaki Bukit', 'Simpang Empat', 'Beseri', 'Chuping', 'Mata Ayer', 'Sanglang'],
    'Sabah': ['Kota Kinabalu', 'Sandakan', 'Tawau', 'Lahad Datu', 'Keningau', 'Kota Belud', 'Kudat', 'Semporna', 'Beaufort', 'Ranau'],
    'Sarawak': ['Kuching', 'Miri', 'Sibu', 'Bintulu', 'Limbang', 'Sarikei', 'Sri Aman', 'Kapit', 'Betong', 'Mukah'],
    'Selangor': ['Shah Alam', 'Petaling Jaya', 'Subang Jaya', 'Klang', 'Ampang', 'Cheras', 'Kajang', 'Puchong', 'Seri Kembangan', 'Bangi'],
    'Terengganu': ['Kuala Terengganu', 'Chukai', 'Dungun', 'Marang', 'Jerteh', 'Besut', 'Setiu', 'Hulu Terengganu', 'Kemaman', 'Kuala Nerus'],
    'Kuala Lumpur': ['Kuala Lumpur City Centre', 'Bukit Bintang', 'Cheras', 'Ampang', 'Bangsar', 'Mont Kiara', 'Wangsa Maju', 'Kepong', 'Setapak', 'Titiwangsa'],
    'Putrajaya': ['Putrajaya', 'Precinct 1', 'Precinct 8', 'Precinct 9', 'Precinct 11', 'Precinct 14', 'Precinct 16', 'Precinct 18', 'Precinct 19', 'Precinct 20'],
    'Labuan': ['Labuan Town', 'Victoria', 'Batu Manikar', 'Patau-Patau', 'Rancha-Rancha', 'Kiansam', 'Layang-Layangan', 'Sungai Lada', 'Sungai Miri', 'Varley']
  };
  const [formData, setFormData] = useState({
    // Organiser Information
    organiserName: '',
    registrationNo: '',
    telContact: '',
    email: '',
    organisingPartner: '',
    
    // Event Details
    eventTitle: '',
    eventStartDate: '',
    eventEndDate: '',
    eventStartDateFormatted: '',
    eventEndDateFormatted: '',
    state: '',
    city: '',
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
  const [submittedApplication, setSubmittedApplication] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleStateChange = (e) => {
    const selectedState = e.target.value;
    setFormData(prev => ({
      ...prev,
      state: selectedState,
      city: '' // Reset city when state changes
    }));
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    const formattedValue = value ? formatDateForDisplay(value) : '';
    
    if (name === 'eventStartDate') {
      setFormData(prev => ({
        ...prev,
        eventStartDate: value,
        eventStartDateFormatted: formattedValue
      }));
    } else if (name === 'eventEndDate') {
      setFormData(prev => ({
        ...prev,
        eventEndDate: value,
        eventEndDateFormatted: formattedValue
      }));
    }
  };

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const options = { day: '2-digit', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
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
    const dataToUse = submittedApplication || formData;
    const doc = new jsPDF('p', 'mm', 'a4');
    let yPosition = 10;
    
    // Helper functions for consistent styling
    const addSectionHeader = (title, y) => {
      doc.setTextColor(0, 63, 127);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 25, y + 5);
      return y + 12;
    };
    
    const addInfoRow = (label, value, y, isLast = false) => {
      const rowHeight = 6;
      
      // Label
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(label + ':', 25, y + 3);
      
      // Value
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      const displayValue = value || 'Not provided';
      const splitValue = doc.splitTextToSize(displayValue, 110);
      doc.text(splitValue, 80, y + 3);
      
      return y + Math.max(rowHeight, splitValue.length * 5);
    };
    
    // Add MPA Logo and Header
    const img = new Image();
    img.onload = function() {
      // Create watermark function
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.globalAlpha = 0.1; // Make it very transparent
      ctx.drawImage(img, 0, 0);
      const watermarkDataUrl = canvas.toDataURL('image/png');
      
      const addWatermark = () => {
        // Position watermark in center of page - much larger
        const pageWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const logoSize = 120; // Much larger watermark size
        const xPos = (pageWidth - logoSize) / 2;
        const yPos = (pageHeight - logoSize) / 2;
        
        doc.addImage(watermarkDataUrl, 'PNG', xPos, yPos, logoSize, logoSize);
      };
      
      // Add watermark to first page
      addWatermark();
      
      // Professional header with smaller logo
      doc.addImage(img, 'PNG', 20, yPosition, 20, 20);
      
      // Title and subtitle
      doc.setTextColor(0, 63, 127);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('MALAYSIA PICKLEBALL ASSOCIATION', 45, yPosition + 8);
      
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Tournament Application Form', 45, yPosition + 15);
      
      yPosition += 25;
      
      // Header separator line
      doc.setDrawColor(0, 63, 127);
      doc.setLineWidth(0.5);
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 10;
      
      // Application details
      doc.setTextColor(0, 63, 127);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('APPLICATION DETAILS', 25, yPosition + 5);
      
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Application ID:', 25, yPosition + 12);
      doc.text('Submission Date:', 25, yPosition + 18);
      
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(dataToUse.id || generateApplicationId(), 80, yPosition + 12);
      doc.text(new Date().toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      }), 80, yPosition + 18);
      
      yPosition += 25;
      
      // ORGANISER INFORMATION Section
      yPosition = addSectionHeader('ORGANISER INFORMATION', yPosition);
      
      yPosition = addInfoRow('Organiser Name', dataToUse.organiserName, yPosition);
      yPosition = addInfoRow('Registration Number', dataToUse.registrationNo, yPosition);
      yPosition = addInfoRow('Telephone Contact', dataToUse.telContact, yPosition);
      yPosition = addInfoRow('Email Address', dataToUse.email, yPosition);
      yPosition = addInfoRow('Organising Partner', dataToUse.organisingPartner || 'Not applicable', yPosition, true);
      yPosition += 10;
      
      // EVENT DETAILS Section
      yPosition = addSectionHeader('EVENT DETAILS', yPosition);
      
      yPosition = addInfoRow('Event Title', dataToUse.eventTitle, yPosition);
      
      // Format dates
      const formatDate = (dateStr) => {
        if (!dateStr) return 'Not provided';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
      };
      const eventDatesFormatted = dataToUse.eventStartDate && dataToUse.eventEndDate 
        ? `${formatDate(dataToUse.eventStartDate)} - ${formatDate(dataToUse.eventEndDate)}`
        : 'Not provided';
      yPosition = addInfoRow('Event Dates', eventDatesFormatted, yPosition);
      
      const locationText = dataToUse.state && dataToUse.city 
        ? `${dataToUse.city}, ${dataToUse.state}`
        : 'Not provided';
      yPosition = addInfoRow('Location', locationText, yPosition);
      yPosition = addInfoRow('Venue', dataToUse.venue, yPosition);
      yPosition = addInfoRow('Event Level/Type', dataToUse.classification, yPosition);
      yPosition = addInfoRow('Expected Participants', dataToUse.expectedParticipants, yPosition, true);
      yPosition += 10;
      
      // EVENT SUMMARY Section
      if (dataToUse.eventSummary && dataToUse.eventSummary.trim()) {
        yPosition = addSectionHeader('EVENT SUMMARY', yPosition);
        
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const splitSummary = doc.splitTextToSize(dataToUse.eventSummary, 160);
        doc.text(splitSummary, 25, yPosition + 5);
        yPosition += splitSummary.length * 5 + 10;
      }
      
      // Check if we need a new page
      if (yPosition > 200) {
        doc.addPage();
        addWatermark(); // Add watermark to new page
        yPosition = 25;
      }
      
      // CONSENT & AGREEMENT Section
      yPosition = addSectionHeader('CONSENT & AGREEMENT', yPosition);
      
      // Data Consent
      if (dataToUse.dataConsent) {
        doc.setTextColor(76, 175, 80);
      } else {
        doc.setTextColor(244, 67, 54);
      }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(dataToUse.dataConsent ? 'DATA PROTECTION CONSENT' : 'DATA PROTECTION CONSENT', 25, yPosition + 5);
      doc.text(dataToUse.dataConsent ? 'AGREED' : 'NOT AGREED', 140, yPosition + 5);
      
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const dataConsentText = 'I consent to the collection, use, and processing of my personal data by Malaysia Pickleball Association (MPA) for the purposes of tournament organization, administration, and related communications. I understand that my data will be handled in accordance with applicable data protection laws.';
      const splitDataConsent = doc.splitTextToSize(dataConsentText, 160);
      doc.text(splitDataConsent, 25, yPosition + 12, { lineHeightFactor: 1.3 });
      yPosition += 35;
      
      // Terms Consent
      if (dataToUse.termsConsent) {
        doc.setTextColor(76, 175, 80);
      } else {
        doc.setTextColor(244, 67, 54);
      }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('TERMS & CONDITIONS', 25, yPosition + 5);
      doc.text(dataToUse.termsConsent ? 'AGREED' : 'NOT AGREED', 140, yPosition + 5);
      
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const termsConsentText = 'I have read, understood, and agree to abide by the Terms and Conditions set forth by Malaysia Pickleball Association (MPA) for tournament participation and organization. I acknowledge that failure to comply with these terms may result in disqualification or other appropriate actions.';
      const splitTermsConsent = doc.splitTextToSize(termsConsentText, 160);
      doc.text(splitTermsConsent, 25, yPosition + 12, { lineHeightFactor: 1.3 });
      yPosition += 35;
      
      // TOURNAMENT GUIDELINES Section
      yPosition = addSectionHeader('TOURNAMENT GUIDELINES', yPosition);
      
      // Guidelines in plain text
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('SCORING FORMAT', 25, yPosition);
      
      doc.setFont('helvetica', 'normal');
      doc.text('• Traditional scoring: 11+ pts', 25, yPosition + 6);
      doc.text('• Rally scoring: 21+ pts', 25, yPosition + 12);
      doc.text('  (first round-robins only)', 25, yPosition + 18);
      
      doc.setFont('helvetica', 'bold');
      doc.text('SKILL RATINGS', 113, yPosition);
      
      doc.setFont('helvetica', 'normal');
      doc.text('Intermediate: < 3.5', 113, yPosition + 6);
      doc.text('Advanced: < 4.5', 113, yPosition + 12);
      doc.text('Elite: >= 4.5', 113, yPosition + 18);
      
      yPosition += 45;
      
      // Professional Footer
      yPosition = 270; // Fixed footer position
      doc.setDrawColor(0, 63, 127);
      doc.setLineWidth(0.5);
      doc.line(20, yPosition, 190, yPosition);
      
      doc.setTextColor(0, 63, 127);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('MALAYSIA PICKLEBALL ASSOCIATION', 20, yPosition + 8);
      
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})}`, 20, yPosition + 15);
      doc.text('Official Tournament Application Portal', 130, yPosition + 8);
      doc.text('www.malaysiapickleball.my', 130, yPosition + 15);
      
      // Open PDF in new tab instead of downloading
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    };
    
    img.src = mpaLogo;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      // Prepare data for API submission
      const submissionData = {
        organiserName: formData.organiserName,
        registrationNo: formData.registrationNo,
        telContact: formData.telContact,
        email: formData.email,
        organisingPartner: formData.organisingPartner,
        eventTitle: formData.eventTitle,
        eventStartDate: formData.eventStartDate,
        eventEndDate: formData.eventEndDate,
        state: formData.state,
        city: formData.city,
        venue: formData.venue,
        classification: formData.classification,
        expectedParticipants: parseInt(formData.expectedParticipants),
        eventSummary: formData.eventSummary,
        scoringFormat: formData.scoringFormat,
        dataConsent: formData.dataConsent,
        termsConsent: formData.termsConsent
      };

      const response = await apiService.submitTournamentApplication(submissionData);
      const newApplication = response.application;
      
      alert(`Application submitted successfully! Your application ID is: ${newApplication.applicationId}`);
      
      // Enable PDF download and show message
      setSubmittedApplication({
        ...newApplication,
        id: newApplication.applicationId // For backward compatibility with PDF generation
      });
      setIsSubmitted(true);
      
      // Reset form
      setFormData({
        organiserName: '',
        registrationNo: '',
        telContact: '',
        email: '',
        organisingPartner: '',
        eventTitle: '',
        eventStartDate: '',
        eventEndDate: '',
        eventStartDateFormatted: '',
        eventEndDateFormatted: '',
        state: '',
        city: '',
        venue: '',
        classification: '',
        expectedParticipants: '',
        eventSummary: '',
        scoringFormat: 'traditional',
        dataConsent: false,
        termsConsent: false
      });
      
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitError(error.message || 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="tournament-application">
      <div className="form-header">
        <img src={mpaLogo} alt="Malaysia Pickleball Association" className="form-logo" />
        <div className="form-header-text">
          <h2>Tournament Application Form</h2>
          <p className="form-subtitle">Apply to organize a pickleball tournament</p>
        </div>
      </div>
      
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
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
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
              placeholder=""
              required
            />
            <small className="form-note">Note: Should Not Include the National/State Title (e.g. Malaysia Open/Closed, State Open/Closed etc)</small>
          </div>
          
          <div className="form-group date-input-group">
            <label htmlFor="eventStartDate">Event Start Date *</label>
            <div className="date-input-wrapper">
              <input
                type="date"
                id="eventStartDate"
                name="eventStartDate"
                value={formData.eventStartDate}
                onChange={handleDateChange}
                className="date-picker-hidden"
                required
              />
              <input
                type="text"
                className="date-display-input"
                value={formData.eventStartDateFormatted}
                placeholder="Click to select date"
                readOnly
                onClick={() => document.getElementById('eventStartDate').showPicker()}
              />
            </div>
          </div>
          
          <div className="form-group date-input-group">
            <label htmlFor="eventEndDate">Event End Date *</label>
            <div className="date-input-wrapper">
              <input
                type="date"
                id="eventEndDate"
                name="eventEndDate"
                value={formData.eventEndDate}
                onChange={handleDateChange}
                min={formData.eventStartDate}
                className="date-picker-hidden"
                required
              />
              <input
                type="text"
                className="date-display-input"
                value={formData.eventEndDateFormatted}
                placeholder="Click to select date"
                readOnly
                onClick={() => document.getElementById('eventEndDate').showPicker()}
              />
            </div>
            <small className="form-note">End date must be on or after start date</small>
          </div>
          
          <div className="form-group">
            <label>Location *</label>
            <div className="location-row">
              <div className="form-subgroup">
                <label htmlFor="state">State</label>
                <select
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleStateChange}
                  required
                >
                  <option value="">Select State</option>
                  {Object.keys(malaysianStatesAndCities).map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-subgroup">
                <label htmlFor="city">City</label>
                <select
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  disabled={!formData.state}
                >
                  <option value="">Select City</option>
                  {formData.state && malaysianStatesAndCities[formData.state].map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                {!formData.state && (
                  <small className="form-note">Please select a state first</small>
                )}
              </div>
            </div>
            
            <div className="form-subgroup">
              <label htmlFor="venue">Venue</label>
              <input
                type="text"
                id="venue"
                name="venue"
                value={formData.venue}
                onChange={handleInputChange}
                placeholder=""
                required
              />
              <small className="form-note">Note: The venue must be fully covered and is required to hold a valid government occupancy permit.</small>
            </div>
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
              placeholder=""
              required
            />
            <div className="character-counter-wrapper">
              <small className="form-note">Maximum 300 characters. Do not include your factsheet.</small>
              <small className={`character-counter ${
                formData.eventSummary.length >= 300 ? 'at-limit' : 
                formData.eventSummary.length >= 250 ? 'near-limit' : ''
              }`}>
                {formData.eventSummary.length}/300
              </small>
            </div>
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
              <li><strong>Intermediate:</strong> &lt; 3.5</li>
              <li><strong>Advanced:</strong> &lt; 4.5</li>
              <li><strong>Elite:</strong> &gt;= 4.5</li>
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
            {submitError && (
              <div className="error-message" style={{ 
                color: '#d32f2f', 
                backgroundColor: '#ffebee', 
                padding: '10px', 
                borderRadius: '4px', 
                marginBottom: '15px',
                border: '1px solid #ffcdd2' 
              }}>
                {submitError}
              </div>
            )}
            <button 
              type="submit" 
              className={`submit-btn ${(!formData.dataConsent || !formData.termsConsent || isSubmitting) ? 'disabled' : ''}`}
              disabled={!formData.dataConsent || !formData.termsConsent || isSubmitting}
            >
              {isSubmitting ? 'Submitting Application...' : 'Submit Tournament Application'}
            </button>
          </div>
        ) : (
          <div className="submission-success">
            <div className="success-message">
              <h3>Application Submitted Successfully!</h3>
              <p>Your tournament application has been submitted and is now under review.</p>
              <p><strong>Important:</strong> Check your email for a confirmation message with your application PDF attached.</p>
              <p>If you don't receive the email within a few minutes, please check your spam folder.</p>
            </div>
            <div className="form-actions">
              <button type="button" className="pdf-btn active" onClick={generatePDF}>
                Download Application PDF (Backup)
              </button>
              <button type="button" className="home-btn" onClick={() => setCurrentPage('home')}>
                Back to Home
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default TournamentApplication;