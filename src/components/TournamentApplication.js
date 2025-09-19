import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import mpaLogo from '../assets/images/mpa.png';
import apiService from '../services/api';

const TournamentApplication = ({ setCurrentPage }) => {
  const [organizationData, setOrganizationData] = useState(null);
  const [appliedTournaments, setAppliedTournaments] = useState([]);
  const [isLoadingTournaments, setIsLoadingTournaments] = useState(true);

  // Edit Tournament States
  const [editingTournament, setEditingTournament] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editTournamentError, setEditTournamentError] = useState('');
  const [tournamentUpdated, setTournamentUpdated] = useState(false);
  
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
    personInCharge: '',
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
    eventType: '',
    category: '',
    malaysianEntryFee: '',
    internationalEntryFee: '',
    expectedParticipants: '',
    eventSummary: '',
    
    // Tournament Settings
    scoringFormat: 'traditional',
    
    // Consent
    dataConsent: false,
    termsConsent: false
  });

  // State for managing multiple categories
  const [savedCategories, setSavedCategories] = useState([]);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedApplication, setSubmittedApplication] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Load organization data on component mount
  useEffect(() => {
    const organizationData = localStorage.getItem('organizationData');
    const isOrgLoggedIn = localStorage.getItem('organizationLoggedIn');
    
    if (organizationData && isOrgLoggedIn === 'true') {
      const orgData = JSON.parse(organizationData);
      updateOrganizationData(orgData);
      
      setFormData(prev => ({
        ...prev,
        organiserName: orgData.organizationName,
        registrationNo: orgData.registrationNo,
        personInCharge: orgData.applicantFullName,
        telContact: orgData.phoneNumber,
        email: orgData.email
      }));

      // Load applied tournaments for this organization
      loadAppliedTournaments(orgData.email);
      
      // Set up periodic refresh to sync with admin changes
      const refreshInterval = setInterval(() => {
        console.log('Auto-refreshing organization tournaments to sync with admin changes...');
        loadAppliedTournaments(orgData.email);
      }, 30000); // Refresh every 30 seconds
      
      // Cleanup interval on component unmount
      return () => {
        console.log('Cleaning up tournament refresh interval');
        clearInterval(refreshInterval);
      };
    } else {
      // If no organization login, redirect to home
      alert('Please login to your organization account first.');
      setCurrentPage('home');
    }
  }, [setCurrentPage]);

  const loadAppliedTournaments = async (email) => {
    try {
      setIsLoadingTournaments(true);
      console.log('Loading applied tournaments for email:', email);
      const tournaments = await apiService.getApplicationsByOrganization(email);
      console.log('Loaded tournaments:', tournaments);
      setAppliedTournaments(tournaments);
    } catch (error) {
      console.error('Failed to load applied tournaments:', error);
      setAppliedTournaments([]);
    } finally {
      setIsLoadingTournaments(false);
    }
  };

  // Date formatting functions
  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return ''; // Invalid date
    const options = { day: '2-digit', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
  };

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    
    // If it's already in YYYY-MM-DD format, return as is
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // If it's an ISO timestamp, extract just the date part
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(dateStr)) {
      return dateStr.split('T')[0];
    }
    
    // Try to parse the date
    let date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.warn('Could not parse date:', dateStr);
      return '';
    }
    
    // Return in YYYY-MM-DD format for HTML date input
    return date.toISOString().split('T')[0];
  };

  // Edit Tournament handlers
  const startEditTournament = (tournament) => {
    console.log('Editing tournament:', tournament);
    setEditingTournament(tournament);
    setEditFormData({
      organiserName: tournament.organiserName || '',
      registrationNo: tournament.registrationNo || '',
      telContact: tournament.telContact || '',
      personInCharge: tournament.personInCharge || '',
      email: tournament.email || '',
      organisingPartner: tournament.organisingPartner || '',
      eventTitle: tournament.eventTitle || '',
      eventStartDate: formatDateForInput(tournament.eventStartDate || ''),
      eventEndDate: formatDateForInput(tournament.eventEndDate || ''),
      state: tournament.state || '',
      city: tournament.city || '',
      venue: tournament.venue || '',
      classification: tournament.classification || '',
      eventType: tournament.eventType || '',
      category: tournament.category || '',
      malaysianEntryFee: (tournament.malaysianEntryFee || '').toString(),
      internationalEntryFee: (tournament.internationalEntryFee || '').toString(),
      expectedParticipants: (tournament.expectedParticipants || '').toString(),
      eventSummary: tournament.eventSummary || '',
      scoringFormat: tournament.scoringFormat || 'traditional',
      dataConsent: true,
      termsConsent: true
    });
    setEditTournamentError('');
    setTournamentUpdated(false);
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEditStateChange = (e) => {
    const selectedState = e.target.value;
    setEditFormData(prev => ({
      ...prev,
      state: selectedState,
      city: '' // Reset city when state changes
    }));
  };

  const handleUpdateTournament = async (e) => {
    e.preventDefault();
    
    try {
      const tournamentId = editingTournament.applicationId;
      
      const updatePayload = {
        ...editFormData,
        applicationId: tournamentId,
        id: tournamentId,
        isUpdate: true
      };
      
      await apiService.updateTournamentApplication(tournamentId, updatePayload);
      
      // Update local state
      setAppliedTournaments(prevTournaments => 
        prevTournaments.map(tournament => 
          tournament.applicationId === tournamentId 
            ? { ...tournament, ...editFormData }
            : tournament
        )
      );
      
      setTournamentUpdated(true);
      setEditTournamentError('');
      alert('Tournament updated successfully!');
      
      // Close edit mode
      setEditingTournament(null);
      
    } catch (error) {
      console.error('Error updating tournament:', error);
      setEditTournamentError(error.message || 'Failed to update tournament');
    }
  };

  const cancelEditTournament = () => {
    setEditingTournament(null);
    setEditFormData({});
    setEditTournamentError('');
    setTournamentUpdated(false);
  };

  const updateOrganizationData = async (orgData) => {
    // If organizationId is missing, try to fetch it
    if (!orgData.organizationId && orgData.email) {
      try {
        const organizations = await apiService.getRegisteredOrganizations();
        const currentOrg = organizations.find(org => org.email === orgData.email);
        if (currentOrg && currentOrg.organizationId) {
          const updatedOrgData = { ...orgData, organizationId: currentOrg.organizationId };
          setOrganizationData(updatedOrgData);
          // Update localStorage with the organizationId
          localStorage.setItem('organizationData', JSON.stringify(updatedOrgData));
          return;
        }
      } catch (error) {
        console.error('Failed to fetch organization ID:', error);
      }
    }
    setOrganizationData(orgData);
  };

  const handleLogout = () => {
    localStorage.removeItem('organizationData');
    localStorage.removeItem('organizationLoggedIn');
    setCurrentPage('home');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending Review': return '#ffa500';
      case 'Approved': return '#28a745';
      case 'Rejected': return '#dc3545';
      case 'Under Review': return '#007bff';
      default: return '#6c757d';
    }
  };

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

  // Handle saving category
  const handleSaveCategory = () => {
    if (!formData.category || !formData.malaysianEntryFee) {
      alert('Please fill in Category and Malaysian Entry Fee before saving.');
      return;
    }

    // Check if Malaysian Entry Fee exceeds RM 200
    const malaysianFee = parseFloat(formData.malaysianEntryFee);
    if (malaysianFee > 200) {
      alert('Malaysian Entry Fee cannot exceed RM 200.00 per player. Please enter a valid amount.');
      return;
    }

    const newCategory = {
      id: Date.now(), // Simple unique ID
      category: formData.category,
      malaysianEntryFee: malaysianFee,
      internationalEntryFee: formData.internationalEntryFee ? parseFloat(formData.internationalEntryFee) : 0
    };

    setSavedCategories(prev => [...prev, newCategory]);

    // Clear the category fields
    setFormData(prev => ({
      ...prev,
      category: '',
      malaysianEntryFee: '',
      internationalEntryFee: ''
    }));
  };

  // Check if Save Category button should be disabled
  const isSaveCategoryDisabled = () => {
    const malaysianFee = parseFloat(formData.malaysianEntryFee);
    return !formData.category || !formData.malaysianEntryFee || malaysianFee > 200 || isNaN(malaysianFee);
  };

  // Handle removing a saved category
  const handleRemoveCategory = (categoryId) => {
    setSavedCategories(prev => prev.filter(cat => cat.id !== categoryId));
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
    
    const addInfoRow = (label, value, y) => {
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
      yPosition = addInfoRow('Person in Charge', dataToUse.personInCharge, yPosition);
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
      yPosition = addInfoRow('Level of Event', dataToUse.classification, yPosition);
      yPosition = addInfoRow('Type of Event', dataToUse.eventType, yPosition);
      
      // Display categories
      if (dataToUse.categories && dataToUse.categories.length > 0) {
        yPosition = addSectionHeader('TOURNAMENT CATEGORIES & ENTRY FEES', yPosition);
        dataToUse.categories.forEach((category, index) => {
          yPosition = addInfoRow(`Category ${index + 1}`, category.category, yPosition);
          yPosition = addInfoRow('Malaysian Entry Fee (RM)', category.malaysianEntryFee.toFixed(2), yPosition);
          yPosition = addInfoRow('International Entry Fee (RM)', category.internationalEntryFee.toFixed(2), yPosition);
          yPosition += 5; // Add some spacing between categories
        });
      } else if (savedCategories && savedCategories.length > 0) {
        yPosition = addSectionHeader('TOURNAMENT CATEGORIES & ENTRY FEES', yPosition);
        savedCategories.forEach((category, index) => {
          yPosition = addInfoRow(`Category ${index + 1}`, category.category, yPosition);
          yPosition = addInfoRow('Malaysian Entry Fee (RM)', category.malaysianEntryFee.toFixed(2), yPosition);
          yPosition = addInfoRow('International Entry Fee (RM)', category.internationalEntryFee.toFixed(2), yPosition);
          yPosition += 5; // Add some spacing between categories
        });
      }
      
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
    
    // Validate that at least one category is saved
    if (savedCategories.length === 0) {
      alert('Please save at least one tournament category before submitting.');
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Prepare data for API submission
      const submissionData = {
        organiserName: formData.organiserName,
        registrationNo: formData.registrationNo,
        telContact: formData.telContact,
        personInCharge: formData.personInCharge,
        email: formData.email,
        organisingPartner: formData.organisingPartner,
        eventTitle: formData.eventTitle,
        eventStartDate: formData.eventStartDate,
        eventEndDate: formData.eventEndDate,
        eventStartDateFormatted: formData.eventStartDateFormatted,
        eventEndDateFormatted: formData.eventEndDateFormatted,
        state: formData.state,
        city: formData.city,
        venue: formData.venue,
        classification: formData.classification,
        eventType: formData.eventType,
        categories: savedCategories, // Send all saved categories
        expectedParticipants: parseInt(formData.expectedParticipants),
        eventSummary: formData.eventSummary,
        scoringFormat: formData.scoringFormat,
        dataConsent: formData.dataConsent,
        termsConsent: formData.termsConsent
      };

      const response = await apiService.submitTournamentApplication(submissionData);
      const newApplication = response.application;
      
      alert(`Application submitted successfully! Your application ID is: ${newApplication.applicationId}`);
      
      // Reload applied tournaments to show the new application
      const orgData = JSON.parse(localStorage.getItem('organizationData') || '{}');
      if (orgData.email) {
        await loadAppliedTournaments(orgData.email);
      }
      
      // Enable PDF download and show message
      setSubmittedApplication({
        ...newApplication,
        id: newApplication.applicationId // For backward compatibility with PDF generation
      });
      setIsSubmitted(true);
      
      // Reset form and clear saved categories
      setFormData({
        organiserName: '',
        registrationNo: '',
        telContact: '',
        personInCharge: '',
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
        eventType: '',
        category: '',
        malaysianEntryFee: '',
        internationalEntryFee: '',
        expectedParticipants: '',
        eventSummary: '',
        scoringFormat: 'traditional',
        dataConsent: false,
        termsConsent: false
      });
      
      // Clear saved categories
      setSavedCategories([]);
      
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitError(error.message || 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="tournament-application-container">
      {/* Sidebar */}
      <div className="tournament-sidebar">
        {/* Profile Section */}
        <div className="sidebar-section profile-section">
          <div className="profile-header">
            <div className="profile-avatar">
              {organizationData?.organizationName?.charAt(0) || 'O'}
            </div>
            <div className="profile-info">
              <h3>{organizationData?.organizationName || 'Organization'}</h3>
              <p className="profile-id">{organizationData?.organizationId || 'N/A'}</p>
              <p className="profile-email">{organizationData?.email || 'N/A'}</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        {/* Tournament Guidelines Section */}
        <div className="sidebar-section guidelines-section">
          <h3>Tournament Guidelines</h3>
          <div className="guidelines-list">
            <div className="guideline-item">
              <h4>Scoring Format</h4>
              <ul>
                <li>Traditional scoring: 11+ pts</li>
                <li>Rally scoring: 21+ pts (first round-robins only)</li>
              </ul>
            </div>

            <div className="guideline-item">
              <h4>Skill Ratings</h4>
              <ul>
                <li><strong>Intermediate:</strong> &lt; 3.5</li>
                <li><strong>Advanced:</strong> &lt; 4.5</li>
                <li><strong>Elite:</strong> &gt;= 4.5</li>
              </ul>
              <p className="guideline-note">
                Players with lower ratings can play in higher rated categories,
                but not vice versa.
              </p>
            </div>

            <div className="guideline-item">
              <h4>Important Notice</h4>
              <ul>
                <li>Endorsement logos must be displayed</li>
                <li>Entry fees capped at RM200 per Malaysian player</li>
                <li>Venue must be fully covered with valid permits</li>
              </ul>
            </div>

            <div className="guideline-item">
              <h4>Safe Sport Code</h4>
              <ul>
                <li>Follow all MPA safety guidelines</li>
                <li>Report incidents immediately</li>
                <li>Maintain fair play standards</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Applied Tournaments Section */}
        <div className="sidebar-section tournaments-section">
          <h3>Applied Tournaments</h3>
          {isLoadingTournaments ? (
            <div className="loading-tournaments">Loading...</div>
          ) : appliedTournaments.length === 0 ? (
            <div className="no-tournaments">
              <p>No tournaments applied yet.</p>
              <p>Submit your first application below!</p>
            </div>
          ) : (
            <div className="tournaments-list">
              {appliedTournaments.map((tournament, index) => (
                <div key={tournament.applicationId || index} className="tournament-item">
                  <div className="tournament-title">
                    {tournament.eventTitle || 'Untitled Tournament'}
                  </div>
                  <div className="tournament-meta">
                    <span className="tournament-id">ID: {tournament.applicationId}</span>
                    <span
                      className="tournament-status"
                      style={{
                        backgroundColor: getStatusColor(tournament.status),
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '11px'
                      }}
                    >
                      {tournament.status}
                    </span>
                  </div>
                  <div className="tournament-date">
                    {tournament.submissionDate ?
                      new Date(tournament.submissionDate).toLocaleDateString() :
                      'Date N/A'
                    }
                  </div>
                  <div className="tournament-actions">
                    <button
                      className="edit-tournament-btn"
                      onClick={() => startEditTournament(tournament)}
                      style={{
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '3px',
                        fontSize: '10px',
                        cursor: 'pointer',
                        marginTop: '5px'
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="tournament-main-content">
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
            <small className="form-note">Pre-filled from organization registration (you can modify if needed)</small>
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
            <small className="form-note">Pre-filled from organization registration (you can modify if needed)</small>
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
            <small className="form-note">Pre-filled from organization registration (you can modify if needed)</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="personInCharge">Person in Charge *</label>
            <input
              type="text"
              id="personInCharge"
              name="personInCharge"
              value={formData.personInCharge}
              onChange={handleInputChange}
              required
            />
            <small className="form-note">Pre-filled from organization registration (you can modify if needed)</small>
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
            <small className="form-note">Pre-filled from organization registration (you can modify if needed)</small>
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
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="classification">Level of Event *</label>
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
              <label htmlFor="eventType">Type of Event *</label>
              <select
                id="eventType"
                name="eventType"
                value={formData.eventType}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Type</option>
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group" style={{ flex: '2' }}>
              <label htmlFor="category">Category *</label>
              <input
                type="text"
                id="category"
                name="category"
                placeholder="e.g., Men's Singles, Women's Doubles, Mixed Doubles"
                value={formData.category}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="malaysianEntryFee">Malaysian Entry Fee (RM) per player *</label>
              <input
                type="number"
                id="malaysianEntryFee"
                name="malaysianEntryFee"
                placeholder="0.00"
                min="0"
                max="200"
                step="0.01"
                value={formData.malaysianEntryFee}
                onChange={handleInputChange}
                style={{
                  borderColor: formData.malaysianEntryFee && parseFloat(formData.malaysianEntryFee) > 200 ? '#dc3545' : ''
                }}
              />
              <small className="form-note" style={{
                color: formData.malaysianEntryFee && parseFloat(formData.malaysianEntryFee) > 200 ? '#dc3545' : '#dc3545',
                fontWeight: formData.malaysianEntryFee && parseFloat(formData.malaysianEntryFee) > 200 ? 'bold' : 'normal'
              }}>
                {formData.malaysianEntryFee && parseFloat(formData.malaysianEntryFee) > 200
                  ? '⚠️ Fee exceeds RM 200.00 limit! Please enter a valid amount.'
                  : 'Note: Not more than RM 200.00'
                }
              </small>
            </div>
            
            <div className="form-group">
              <label htmlFor="internationalEntryFee">International Entry Fee (RM) per player</label>
              <input
                type="number"
                id="internationalEntryFee"
                name="internationalEntryFee"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={formData.internationalEntryFee}
                onChange={handleInputChange}
              />
              <small className="form-note" style={{ color: '#dc3545' }}>Note: Only required if international players are involved</small>
            </div>
            
            <div className="form-group">
              <label style={{ visibility: 'hidden' }}>Save</label>
              <button
                type="button"
                onClick={handleSaveCategory}
                disabled={isSaveCategoryDisabled()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: isSaveCategoryDisabled() ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isSaveCategoryDisabled() ? 'not-allowed' : 'pointer',
                  width: 'auto',
                  opacity: isSaveCategoryDisabled() ? 0.6 : 1,
                  transition: 'all 0.2s ease'
                }}
                title={
                  isSaveCategoryDisabled()
                    ? formData.malaysianEntryFee && parseFloat(formData.malaysianEntryFee) > 200
                      ? 'Malaysian Entry Fee exceeds RM 200.00 limit'
                      : 'Please fill in Category and Malaysian Entry Fee (max RM 200.00)'
                    : 'Save this category'
                }
              >
                Save Category
              </button>
            </div>
          </div>
          
          {/* Display saved categories */}
          {savedCategories.length > 0 && (
            <div className="saved-categories" style={{ marginTop: '15px', marginBottom: '15px' }}>
              <h4>Tournament Categories:</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '1px solid #ddd',
                  backgroundColor: 'white'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{
                        padding: '12px',
                        textAlign: 'left',
                        borderBottom: '2px solid #ddd',
                        borderRight: '1px solid #ddd',
                        fontWeight: 'bold',
                        color: '#333'
                      }}>Category</th>
                      <th style={{
                        padding: '12px',
                        textAlign: 'center',
                        borderBottom: '2px solid #ddd',
                        borderRight: '1px solid #ddd',
                        fontWeight: 'bold',
                        color: '#333'
                      }}>Malaysian Entry Fee (RM) per player</th>
                      <th style={{
                        padding: '12px',
                        textAlign: 'center',
                        borderBottom: '2px solid #ddd',
                        borderRight: '1px solid #ddd',
                        fontWeight: 'bold',
                        color: '#333'
                      }}>International Entry Fee (RM) per player</th>
                      <th style={{
                        padding: '12px',
                        textAlign: 'center',
                        borderBottom: '2px solid #ddd',
                        fontWeight: 'bold',
                        color: '#333',
                        width: '100px'
                      }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedCategories.map((category, index) => (
                      <tr key={category.id} style={{
                        backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9'
                      }}>
                        <td style={{
                          padding: '12px',
                          borderBottom: '1px solid #ddd',
                          borderRight: '1px solid #ddd'
                        }}>{category.category}</td>
                        <td style={{
                          padding: '12px',
                          textAlign: 'center',
                          borderBottom: '1px solid #ddd',
                          borderRight: '1px solid #ddd'
                        }}>{category.malaysianEntryFee.toFixed(2)}</td>
                        <td style={{
                          padding: '12px',
                          textAlign: 'center',
                          borderBottom: '1px solid #ddd',
                          borderRight: '1px solid #ddd'
                        }}>{category.internationalEntryFee > 0 ? category.internationalEntryFee.toFixed(2) : '-'}</td>
                        <td style={{
                          padding: '12px',
                          textAlign: 'center',
                          borderBottom: '1px solid #ddd'
                        }}>
                          <button 
                            type="button"
                            onClick={() => handleRemoveCategory(category.id)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
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
          <h3>Consent & Agreement</h3>
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

      {/* Edit Tournament Modal */}
      {editingTournament && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginBottom: '20px' }}>Edit Tournament Application</h3>
            
            <form onSubmit={handleUpdateTournament} className="tournament-form">
              <div className="form-section">
                <h4>Organiser Information</h4>
                
                <div className="form-group">
                  <label htmlFor="edit-organiserName">Organiser Name *</label>
                  <input
                    type="text"
                    id="edit-organiserName"
                    name="organiserName"
                    value={editFormData.organiserName || ''}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-registrationNo">Registration No. *</label>
                  <input
                    type="text"
                    id="edit-registrationNo"
                    name="registrationNo"
                    value={editFormData.registrationNo || ''}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-telContact">Phone Contact *</label>
                  <input
                    type="tel"
                    id="edit-telContact"
                    name="telContact"
                    value={editFormData.telContact || ''}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-personInCharge">Person in Charge</label>
                  <input
                    type="text"
                    id="edit-personInCharge"
                    name="personInCharge"
                    value={editFormData.personInCharge || ''}
                    onChange={handleEditInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-email">Email *</label>
                  <input
                    type="email"
                    id="edit-email"
                    name="email"
                    value={editFormData.email || ''}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-section">
                <h4>Event Details</h4>
                
                <div className="form-group">
                  <label htmlFor="edit-eventTitle">Event Title *</label>
                  <input
                    type="text"
                    id="edit-eventTitle"
                    name="eventTitle"
                    value={editFormData.eventTitle || ''}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-eventStartDate">Event Start Date *</label>
                    <input
                      type="date"
                      id="edit-eventStartDate"
                      name="eventStartDate"
                      value={editFormData.eventStartDate || ''}
                      onChange={handleEditInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="edit-eventEndDate">Event End Date *</label>
                    <input
                      type="date"
                      id="edit-eventEndDate"
                      name="eventEndDate"
                      value={editFormData.eventEndDate || ''}
                      onChange={handleEditInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-state">State *</label>
                    <select
                      id="edit-state"
                      name="state"
                      value={editFormData.state || ''}
                      onChange={handleEditStateChange}
                      required
                    >
                      <option value="">Select State</option>
                      {Object.keys(malaysianStatesAndCities).map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="edit-city">City *</label>
                    <select
                      id="edit-city"
                      name="city"
                      value={editFormData.city || ''}
                      onChange={handleEditInputChange}
                      required
                    >
                      <option value="">Select City</option>
                      {editFormData.state && malaysianStatesAndCities[editFormData.state]?.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-venue">Venue *</label>
                  <input
                    type="text"
                    id="edit-venue"
                    name="venue"
                    value={editFormData.venue || ''}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-eventSummary">Event Summary *</label>
                  <textarea
                    id="edit-eventSummary"
                    name="eventSummary"
                    value={editFormData.eventSummary || ''}
                    onChange={handleEditInputChange}
                    rows="4"
                    required
                  />
                </div>
              </div>

              {editTournamentError && (
                <div style={{ 
                  color: '#d32f2f', 
                  backgroundColor: '#ffebee', 
                  padding: '10px', 
                  borderRadius: '4px', 
                  marginBottom: '15px',
                  border: '1px solid #ffcdd2' 
                }}>
                  {editTournamentError}
                </div>
              )}

              <div className="form-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={cancelEditTournament}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Update Tournament
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentApplication;