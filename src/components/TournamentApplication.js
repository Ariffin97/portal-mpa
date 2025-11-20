import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import mpaLogo from '../assets/images/mpa.png';
import apiService from '../services/api';
import OrganiserInbox, { InboxButton } from './OrganiserInbox';

const TournamentApplication = ({ setCurrentPage }) => {
  const [organizationData, setOrganizationData] = useState(null);
  const [appliedTournaments, setAppliedTournaments] = useState([]);
  const [isLoadingTournaments, setIsLoadingTournaments] = useState(true);

  // Calendar popup states
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(new Date());

  // Edit Tournament States
  const [editingTournament, setEditingTournament] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editTournamentError, setEditTournamentError] = useState('');
  const [editTournamentPoster, setEditTournamentPoster] = useState(null);
  
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
    tournamentSoftware: [],
    tournamentSoftwareOther: '',
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

  // Update Profile Modal States
  const [showUpdateProfileModal, setShowUpdateProfileModal] = useState(false);
  const [profileUpdateData, setProfileUpdateData] = useState({
    organizationName: '',
    registrationNo: '',
    applicantFullName: '',
    phoneNumber: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postcode: '',
    state: '',
    country: ''
  });
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileUpdateError, setProfileUpdateError] = useState('');

  // Support Documents States
  const [supportDocuments, setSupportDocuments] = useState([]);

  // Tournament Poster State
  const [tournamentPoster, setTournamentPoster] = useState(null);

  // Tournament Software States
  const [approvedSoftware, setApprovedSoftware] = useState([]);

  // Inbox States
  const [showInboxModal, setShowInboxModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Approved Tournaments State (for organizers to see when planning dates)
  const [approvedTournaments, setApprovedTournaments] = useState([]);
  const [isLoadingApprovedTournaments, setIsLoadingApprovedTournaments] = useState(false);

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

      // Load unread message count
      loadUnreadCount(orgData.email);

      // Set up periodic refresh to sync with admin changes
      const refreshInterval = setInterval(() => {
        console.log('Auto-refreshing organization tournaments to sync with admin changes...');
        loadAppliedTournaments(orgData.email);
        loadUnreadCount(orgData.email);
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

  // Load approved tournament software on component mount
  useEffect(() => {
    const fetchApprovedSoftware = async () => {
      try {
        const response = await fetch('/api/tournament-software/approved');

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Server returned non-JSON response when fetching tournament software');
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setApprovedSoftware(data);
        } else {
          console.error('Failed to fetch approved tournament software');
        }
      } catch (error) {
        console.error('Error fetching approved tournament software:', error);
      }
    };

    fetchApprovedSoftware();
  }, []);

  // Load approved tournaments for date planning
  useEffect(() => {
    const fetchApprovedTournaments = async () => {
      try {
        setIsLoadingApprovedTournaments(true);
        const tournaments = await apiService.getApprovedTournaments();
        setApprovedTournaments(tournaments || []);
      } catch (error) {
        console.error('Error fetching approved tournaments:', error);
        setApprovedTournaments([]);
      } finally {
        setIsLoadingApprovedTournaments(false);
      }
    };

    fetchApprovedTournaments();
  }, []);

  // Populate profile update form when modal opens
  useEffect(() => {
    if (showUpdateProfileModal && organizationData) {
      setProfileUpdateData({
        organizationName: organizationData.organizationName || '',
        registrationNo: organizationData.registrationNo || '',
        applicantFullName: organizationData.applicantFullName || '',
        phoneNumber: organizationData.phoneNumber || '',
        email: organizationData.email || '',
        addressLine1: organizationData.addressLine1 || '',
        addressLine2: organizationData.addressLine2 || '',
        city: organizationData.city || '',
        postcode: organizationData.postcode || '',
        state: organizationData.state || '',
        country: organizationData.country || 'Malaysia'
      });
      setUploadedDocuments(organizationData.documents || []);
    }
  }, [showUpdateProfileModal, organizationData]);

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

  const loadUnreadCount = async (email) => {
    try {
      const response = await apiService.getUnreadMessageCount('organiser', email);
      if (response.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to load unread count:', error);
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

  // Check if two date ranges overlap
  const checkDateOverlap = (start1, end1, start2, end2) => {
    if (!start1 || !end1 || !start2 || !end2) return false;

    const date1Start = new Date(start1);
    const date1End = new Date(end1);
    const date2Start = new Date(start2);
    const date2End = new Date(end2);

    // Check if any date is invalid
    if (isNaN(date1Start.getTime()) || isNaN(date1End.getTime()) ||
        isNaN(date2Start.getTime()) || isNaN(date2End.getTime())) {
      return false;
    }

    // Two date ranges overlap if: start1 <= end2 AND start2 <= end1
    return date1Start <= date2End && date2Start <= date1End;
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

    // Parse tournamentSoftware - ensure it's an array
    let softwareArray = [];
    if (tournament.tournamentSoftware) {
      if (Array.isArray(tournament.tournamentSoftware)) {
        softwareArray = tournament.tournamentSoftware;
      } else if (typeof tournament.tournamentSoftware === 'string') {
        try {
          softwareArray = JSON.parse(tournament.tournamentSoftware);
        } catch (e) {
          // If parsing fails, treat it as a single value
          softwareArray = [tournament.tournamentSoftware];
        }
      }
    }

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
      tournamentSoftware: softwareArray,
      tournamentSoftwareOther: tournament.tournamentSoftwareOther || '',
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

    // Handle tournament software checkboxes (multiple selection)
    if (name === 'tournamentSoftware') {
      setEditFormData(prev => {
        const currentSoftware = prev.tournamentSoftware || [];
        if (checked) {
          // Add the software to the array
          return { ...prev, tournamentSoftware: [...currentSoftware, value] };
        } else {
          // Remove the software from the array
          return { ...prev, tournamentSoftware: currentSoftware.filter(s => s !== value) };
        }
      });
    } else {
      setEditFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleEditStateChange = (e) => {
    const selectedState = e.target.value;
    setEditFormData(prev => ({
      ...prev,
      state: selectedState,
      city: '' // Reset city when state changes
    }));
  };

  const handleEditPosterUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type (only image files)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    const isValidType = allowedTypes.includes(file.type);
    const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit

    if (!isValidType) {
      alert('Please upload an image file (JPG, PNG, or WEBP) for the tournament poster.');
      e.target.value = ''; // Reset input
      return;
    }

    if (!isValidSize) {
      alert('Poster file is too large. Please upload an image smaller than 10MB.');
      e.target.value = ''; // Reset input
      return;
    }

    setEditTournamentPoster(file);
  };

  const removeEditPoster = () => {
    setEditTournamentPoster(null);
    // Reset file input
    const fileInput = document.getElementById('edit-tournamentPoster');
    if (fileInput) fileInput.value = '';
  };

  const handleUpdateTournament = async (e) => {
    e.preventDefault();

    try {
      const tournamentId = editingTournament.applicationId;

      // Use FormData if poster is uploaded, otherwise use JSON
      let updatePayload;
      if (editTournamentPoster) {
        updatePayload = new FormData();
        Object.keys(editFormData).forEach(key => {
          // Stringify arrays for FormData
          if (Array.isArray(editFormData[key])) {
            updatePayload.append(key, JSON.stringify(editFormData[key]));
          } else {
            updatePayload.append(key, editFormData[key]);
          }
        });
        updatePayload.append('tournamentPoster', editTournamentPoster);
        updatePayload.append('applicationId', tournamentId);
        updatePayload.append('id', tournamentId);
        updatePayload.append('isUpdate', true);
      } else {
        updatePayload = {
          ...editFormData,
          applicationId: tournamentId,
          id: tournamentId,
          isUpdate: true
        };
      }

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
      setEditTournamentPoster(null);
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
    setEditTournamentPoster(null);
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

    // Handle tournament software checkboxes (multiple selection)
    if (name === 'tournamentSoftware') {
      setFormData(prev => {
        const currentSoftware = prev.tournamentSoftware || [];
        if (checked) {
          // Add the software to the array
          return { ...prev, tournamentSoftware: [...currentSoftware, value] };
        } else {
          // Remove the software from the array
          return { ...prev, tournamentSoftware: currentSoftware.filter(s => s !== value) };
        }
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
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

      // Tournament Software
      let softwareNames = [];
      if (Array.isArray(dataToUse.tournamentSoftware)) {
        softwareNames = dataToUse.tournamentSoftware.map(software => {
          if (software === 'Other' && dataToUse.tournamentSoftwareOther) {
            return dataToUse.tournamentSoftwareOther;
          }
          return software;
        });
      } else if (dataToUse.tournamentSoftware) {
        // Handle old single-value format for backward compatibility
        softwareNames = dataToUse.tournamentSoftware === 'Other'
          ? [dataToUse.tournamentSoftwareOther]
          : [dataToUse.tournamentSoftware];
      }
      const softwareDisplay = softwareNames.length > 0 ? softwareNames.join(', ') : 'Not specified';
      yPosition = addInfoRow('Tournament Software', softwareDisplay, yPosition, true);
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

    // Validate tournament software selection
    if (!formData.tournamentSoftware || formData.tournamentSoftware.length === 0) {
      alert('Please select at least one tournament software.');
      setIsSubmitting(false);
      return;
    }

    // Validate tournament software "Other" field
    if (formData.tournamentSoftware.includes('Other') && !formData.tournamentSoftwareOther.trim()) {
      alert('Please specify the tournament software name.');
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Create FormData for file upload
      const submissionFormData = new FormData();

      // Add form data
      submissionFormData.append('organiserName', formData.organiserName);
      submissionFormData.append('registrationNo', formData.registrationNo);
      submissionFormData.append('telContact', formData.telContact);
      submissionFormData.append('personInCharge', formData.personInCharge);
      submissionFormData.append('email', formData.email);
      submissionFormData.append('organisingPartner', formData.organisingPartner);
      submissionFormData.append('eventTitle', formData.eventTitle);
      submissionFormData.append('eventStartDate', formData.eventStartDate);
      submissionFormData.append('eventEndDate', formData.eventEndDate);
      submissionFormData.append('eventStartDateFormatted', formData.eventStartDateFormatted);
      submissionFormData.append('eventEndDateFormatted', formData.eventEndDateFormatted);
      submissionFormData.append('state', formData.state);
      submissionFormData.append('city', formData.city);
      submissionFormData.append('venue', formData.venue);
      submissionFormData.append('classification', formData.classification);
      submissionFormData.append('eventType', formData.eventType);
      submissionFormData.append('categories', JSON.stringify(savedCategories));
      submissionFormData.append('expectedParticipants', parseInt(formData.expectedParticipants));
      submissionFormData.append('tournamentSoftware', JSON.stringify(formData.tournamentSoftware));
      submissionFormData.append('tournamentSoftwareOther', formData.tournamentSoftwareOther || '');
      submissionFormData.append('eventSummary', formData.eventSummary);
      submissionFormData.append('scoringFormat', formData.scoringFormat);
      submissionFormData.append('dataConsent', formData.dataConsent);
      submissionFormData.append('termsConsent', formData.termsConsent);

      // Add tournament poster if uploaded
      if (tournamentPoster) {
        submissionFormData.append('tournamentPoster', tournamentPoster);
      }

      // Add support documents
      supportDocuments.forEach((file, index) => {
        submissionFormData.append('supportDocuments', file);
      });

      const response = await apiService.submitTournamentApplication(submissionFormData);
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
        tournamentSoftware: '',
        tournamentSoftwareOther: '',
        eventSummary: '',
        scoringFormat: 'traditional',
        dataConsent: false,
        termsConsent: false
      });
      
      // Clear saved categories, support documents, and poster
      setSavedCategories([]);
      setSupportDocuments([]);
      setTournamentPoster(null);

    } catch (error) {
      console.error('Submission error:', error);
      setSubmitError(error.message || 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Profile Update Handlers
  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileUpdateData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);

    // Validate file types (only PDF, DOC, DOCX, JPG, PNG)
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/jpg'];
    const validFiles = files.filter(file => {
      const isValidType = allowedTypes.includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit

      if (!isValidType) {
        alert(`File "${file.name}" is not a supported format. Please upload PDF, DOC, DOCX, JPG, or PNG files only.`);
        return false;
      }
      if (!isValidSize) {
        alert(`File "${file.name}" is too large. Please upload files smaller than 10MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setUploadedDocuments(prev => [...prev, ...validFiles]);
    }
  };

  const removeDocument = (index) => {
    setUploadedDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileUpdateError('');

    try {
      // Create FormData for file upload
      const formData = new FormData();

      // Add profile data
      Object.keys(profileUpdateData).forEach(key => {
        formData.append(key, profileUpdateData[key]);
      });

      // Add organization ID
      formData.append('organizationId', organizationData.organizationId);

      // Add files
      uploadedDocuments.forEach((file, index) => {
        if (file instanceof File) {
          formData.append('documents', file);
        }
      });

      // Call API to update profile
      const response = await apiService.updateOrganizationProfile(formData);

      if (response.success) {
        // Update local organization data
        const updatedOrgData = { ...organizationData, ...response.organization };
        setOrganizationData(updatedOrgData);
        localStorage.setItem('organizationData', JSON.stringify(updatedOrgData));

        alert('Profile updated successfully!');
        setShowUpdateProfileModal(false);
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }

    } catch (error) {
      console.error('Profile update error:', error);
      setProfileUpdateError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleCloseProfileModal = () => {
    setShowUpdateProfileModal(false);
    setProfileUpdateError('');
    setUploadedDocuments([]);
  };

  // Support Documents Handlers
  const handleSupportDocumentUpload = (e) => {
    const files = Array.from(e.target.files);

    // Validate file types (only PDF, DOC, DOCX, JPG, PNG)
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/jpg'];
    const validFiles = files.filter(file => {
      const isValidType = allowedTypes.includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit

      if (!isValidType) {
        alert(`File "${file.name}" is not a supported format. Please upload PDF, DOC, DOCX, JPG, or PNG files only.`);
        return false;
      }
      if (!isValidSize) {
        alert(`File "${file.name}" is too large. Please upload files smaller than 10MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setSupportDocuments(prev => [...prev, ...validFiles]);
    }
  };

  const removeSupportDocument = (index) => {
    setSupportDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handlePosterUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type (only image files)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    const isValidType = allowedTypes.includes(file.type);
    const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit

    if (!isValidType) {
      alert('Please upload an image file (JPG, PNG, or WEBP) for the tournament poster.');
      e.target.value = ''; // Reset input
      return;
    }

    if (!isValidSize) {
      alert('Poster file is too large. Please upload an image smaller than 10MB.');
      e.target.value = ''; // Reset input
      return;
    }

    setTournamentPoster(file);
  };

  const removePoster = () => {
    setTournamentPoster(null);
    // Reset file input
    const fileInput = document.getElementById('tournamentPoster');
    if (fileInput) fileInput.value = '';
  };

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getTournamentsForDate = (date) => {
    // Helper function to format date to YYYY-MM-DD without timezone issues
    const formatDateToLocal = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Helper function to parse date string and handle timezone properly
    const parseDateString = (dateStr) => {
      if (!dateStr) return null;

      // If it's already in YYYY-MM-DD format, create date at local midnight
      if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [year, month, day] = dateStr.split('-');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }

      // Otherwise parse normally and extract date part
      const parsedDate = new Date(dateStr);
      if (isNaN(parsedDate.getTime())) return null;

      return new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
    };

    const dateStr = formatDateToLocal(date);

    return appliedTournaments.filter(app => {
      const startDateObj = parseDateString(app.eventStartDate);
      const endDateObj = parseDateString(app.eventEndDate);

      if (!startDateObj || !endDateObj) return false;

      const startDateStr = formatDateToLocal(startDateObj);
      const endDateStr = formatDateToLocal(endDateObj);

      return dateStr >= startDateStr && dateStr <= endDateStr;
    });
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setCalendarSelectedDate(clickedDate);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
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
          <button
            className="update-profile-btn"
            onClick={() => setShowUpdateProfileModal(true)}
            style={{
              width: '100%',
              padding: '10px 15px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              marginBottom: '10px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
          >
            Update Profile
          </button>

          {/* Messages Button */}
          <div style={{ marginBottom: '10px' }}>
            <InboxButton
              organizationData={organizationData}
              unreadCount={unreadCount}
              onClick={() => setShowInboxModal(true)}
            />
          </div>

          {/* Calendar Button */}
          <button
            className="calendar-btn"
            onClick={() => setShowCalendarModal(true)}
            style={{
              width: '100%',
              padding: '10px 15px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              marginBottom: '10px',
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#218838'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
          >
            Tournament Calendar
          </button>

          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>


        {/* Applied Tournaments Section */}
        <div className="sidebar-section tournaments-section">
          <div style={{
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '2px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'white' }}>
              Applied Tournaments
            </h3>
          </div>

          {isLoadingTournaments ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#7f8c8d'
            }}>
              <div>Loading tournaments...</div>
            </div>
          ) : appliedTournaments.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '2px dashed #dee2e6'
            }}>
              <p style={{ margin: '0 0 8px 0', color: '#6c757d', fontWeight: '500' }}>
                No tournaments applied yet
              </p>
              <p style={{ margin: 0, color: '#adb5bd', fontSize: '13px' }}>
                Submit your first application below!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {appliedTournaments.map((tournament, index) => (
                <div
                  key={tournament.applicationId || index}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '12px',
                    padding: '16px',
                    color: 'white',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                  }}
                >
                  {/* Background decoration */}
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    width: '80px',
                    height: '80px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '50%'
                  }} />

                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      marginBottom: '8px',
                      lineHeight: '1.3',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {tournament.eventTitle || 'Untitled Tournament'}
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                      fontSize: '12px'
                    }}>
                      <span style={{
                        background: 'rgba(255,255,255,0.2)',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontWeight: '500'
                      }}>
                        {tournament.applicationId}
                      </span>
                      <span style={{
                        background: getStatusColor(tournament.status),
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {tournament.status}
                      </span>
                    </div>

                    <div style={{
                      fontSize: '11px',
                      opacity: 0.9,
                      marginBottom: '12px'
                    }}>
                      {tournament.submissionDate ?
                        new Date(tournament.submissionDate).toLocaleDateString('en-MY', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) :
                        'Date N/A'
                      }
                    </div>

                    <button
                      onClick={() => startEditTournament(tournament)}
                      style={{
                        width: '100%',
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        color: '#667eea',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.95)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      Edit Application
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

          <div className="form-group">
            <label htmlFor="tournamentPoster">Tournament Poster</label>
            <input
              type="file"
              id="tournamentPoster"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              onChange={handlePosterUpload}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            />
            <small className="form-note">
              Upload your tournament poster/flyer. Supported formats: JPG, PNG, WEBP (Max 10MB)
            </small>

            {/* Display uploaded poster preview */}
            {tournamentPoster && (
              <div style={{ marginTop: '15px' }}>
                <div style={{
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  padding: '15px',
                  backgroundColor: '#f8f9fa'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px'
                  }}>
                    <span style={{ fontWeight: '600', color: '#333' }}>
                      📄 {tournamentPoster.name}
                    </span>
                    <button
                      type="button"
                      onClick={removePoster}
                      style={{
                        padding: '4px 12px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>
                    Size: {(tournamentPoster.size / 1024).toFixed(2)} KB
                  </div>
                </div>
              </div>
            )}
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

          {/* Approved Tournaments List for Date Planning */}
          {formData.eventStartDate && formData.eventEndDate && (
            <div className="approved-tournaments-section">
              <div className="section-header">
                <h3>Date Conflict Check</h3>
                <p className="section-note">Checking for approved tournaments on your selected dates (for awareness only - you can still proceed with your application)</p>
              </div>

              {isLoadingApprovedTournaments ? (
                <div className="loading-message">Loading tournament schedule...</div>
              ) : (() => {
                // Filter tournaments that overlap with selected dates
                const conflictingTournaments = approvedTournaments.filter(tournament =>
                  checkDateOverlap(
                    formData.eventStartDate,
                    formData.eventEndDate,
                    tournament.eventStartDate,
                    tournament.eventEndDate
                  )
                );

                return conflictingTournaments.length === 0 ? (
                  <div className="no-conflict-message">
                    ✓ No date conflicts found. Your selected dates are available!
                  </div>
                ) : (
                  <>
                    <div className="conflict-warning">
                      ⚠ Notice: {conflictingTournaments.length} approved tournament{conflictingTournaments.length > 1 ? 's' : ''} found on the same dates. You may still proceed with the application, but the MPA may consider the schedule conflict during the review process.
                    </div>
                    <div className="tournaments-list">
                      {conflictingTournaments.map((tournament, index) => {
                        const startDate = tournament.eventStartDate ? new Date(tournament.eventStartDate) : null;
                        const endDate = tournament.eventEndDate ? new Date(tournament.eventEndDate) : null;

                        return (
                          <div key={index} className="tournament-item conflict">
                            <div className="tournament-name">{tournament.eventTitle || 'Untitled Tournament'}</div>
                            <div className="tournament-details">
                              <span className="tournament-date">
                                {startDate && endDate ? (
                                  `${startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} - ${endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
                                ) : (
                                  'Date not available'
                                )}
                              </span>
                              {tournament.state && (
                                <span className="tournament-location"> • {tournament.state}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

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
            <label>Tournament Software Being Used * (Select all that apply)</label>
            <div style={{
              maxHeight: '200px',
              overflowY: 'auto',
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '10px',
              backgroundColor: '#f9f9f9'
            }}>
              {approvedSoftware.map((software) => (
                <div key={software._id} style={{
                  padding: '8px',
                  marginBottom: '5px'
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}>
                    <input
                      type="checkbox"
                      name="tournamentSoftware"
                      value={software.softwareName}
                      checked={formData.tournamentSoftware.includes(software.softwareName)}
                      onChange={handleInputChange}
                      style={{
                        marginRight: '10px',
                        width: '16px',
                        height: '16px',
                        cursor: 'pointer'
                      }}
                    />
                    {software.softwareName}
                  </label>
                </div>
              ))}
              <div style={{
                padding: '8px',
                borderTop: '1px solid #ddd',
                marginTop: '5px',
                paddingTop: '10px'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  <input
                    type="checkbox"
                    name="tournamentSoftware"
                    value="Other"
                    checked={formData.tournamentSoftware.includes('Other')}
                    onChange={handleInputChange}
                    style={{
                      marginRight: '10px',
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer'
                    }}
                  />
                  Other (Please specify)
                </label>
              </div>
            </div>
          </div>

          {formData.tournamentSoftware.includes('Other') && (
            <div className="form-group">
              <label htmlFor="tournamentSoftwareOther">Please specify the software name *</label>
              <input
                type="text"
                id="tournamentSoftwareOther"
                name="tournamentSoftwareOther"
                value={formData.tournamentSoftwareOther}
                onChange={handleInputChange}
                placeholder="Enter software name"
                required
              />
            </div>
          )}

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
          <h3>Upload Support Documents</h3>
          <div className="form-group">
            <label htmlFor="supportDocuments">Upload Supporting Documents</label>
            <input
              type="file"
              id="supportDocuments"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleSupportDocumentUpload}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            />
            <small className="form-note">
              Upload relevant supporting documents such as venue permits, partnership agreements, event proposals, etc.
              Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB each)
            </small>
          </div>

          {/* Display uploaded support documents */}
          {supportDocuments.length > 0 && (
            <div style={{ marginTop: '15px', marginBottom: '15px' }}>
              <h4>Uploaded Support Documents:</h4>
              <div style={{
                border: '1px solid #ddd',
                borderRadius: '4px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {supportDocuments.map((doc, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    marginBottom: index < supportDocuments.length - 1 ? '8px' : '0',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ flex: '1', minWidth: '0' }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#333',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {doc.name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#666',
                        marginTop: '2px'
                      }}>
                        {(doc.size / 1024 / 1024).toFixed(2)} MB • {doc.type.split('/')[1].toUpperCase()}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSupportDocument(index)}
                      style={{
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        padding: '6px 10px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        marginLeft: '10px',
                        flexShrink: '0'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
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

                <div className="form-group">
                  <label htmlFor="edit-tournamentPoster">Tournament Poster</label>
                  {editingTournament?.tournamentPoster && !editTournamentPoster && (
                    <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#e7f3ff', borderRadius: '4px' }}>
                      <small style={{ color: '#0056b3' }}>
                        ✓ Current poster: {editingTournament.tournamentPoster.originalname || 'Poster uploaded'}
                      </small>
                    </div>
                  )}
                  <input
                    type="file"
                    id="edit-tournamentPoster"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    onChange={handleEditPosterUpload}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <small className="form-note">
                    Upload new tournament poster (JPG, PNG, WEBP - Max 10MB) {editingTournament?.tournamentPoster && '- Leave empty to keep existing poster'}
                  </small>

                  {editTournamentPoster && (
                    <div style={{ marginTop: '15px' }}>
                      <div style={{
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        padding: '15px',
                        backgroundColor: '#f8f9fa'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '10px'
                        }}>
                          <span style={{ fontWeight: '600', color: '#333' }}>
                            📄 {editTournamentPoster.name}
                          </span>
                          <button
                            type="button"
                            onClick={removeEditPoster}
                            style={{
                              padding: '4px 12px',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>
                          Size: {(editTournamentPoster.size / 1024).toFixed(2)} KB
                        </div>
                      </div>
                    </div>
                  )}
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

                {/* Date Conflict Check for Edit Modal */}
                {editFormData.eventStartDate && editFormData.eventEndDate && (
                  <div className="approved-tournaments-section">
                    <div className="section-header">
                      <h3>Date Conflict Check</h3>
                      <p className="section-note">Checking for approved tournaments on your selected dates (for awareness only)</p>
                    </div>

                    {isLoadingApprovedTournaments ? (
                      <div className="loading-message">Loading tournament schedule...</div>
                    ) : (() => {
                      // Filter tournaments that overlap with selected dates, excluding current tournament
                      const conflictingTournaments = approvedTournaments.filter(tournament =>
                        tournament.applicationId !== editingTournament.applicationId &&
                        checkDateOverlap(
                          editFormData.eventStartDate,
                          editFormData.eventEndDate,
                          tournament.eventStartDate,
                          tournament.eventEndDate
                        )
                      );

                      return conflictingTournaments.length === 0 ? (
                        <div className="no-conflict-message">
                          ✓ No date conflicts found. Your selected dates are available!
                        </div>
                      ) : (
                        <>
                          <div className="conflict-warning">
                            ⚠ Notice: {conflictingTournaments.length} approved tournament{conflictingTournaments.length > 1 ? 's' : ''} found on the same dates. You may still proceed with the application, but the MPA may consider the schedule conflict during the review process.
                          </div>
                          <div className="tournaments-list">
                            {conflictingTournaments.map((tournament, index) => {
                              const startDate = tournament.eventStartDate ? new Date(tournament.eventStartDate) : null;
                              const endDate = tournament.eventEndDate ? new Date(tournament.eventEndDate) : null;

                              return (
                                <div key={index} className="tournament-item conflict">
                                  <div className="tournament-name">{tournament.eventTitle || 'Untitled Tournament'}</div>
                                  <div className="tournament-details">
                                    <span className="tournament-date">
                                      {startDate && endDate ? (
                                        `${startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} - ${endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
                                      ) : (
                                        'Date not available'
                                      )}
                                    </span>
                                    {tournament.state && (
                                      <span className="tournament-location"> • {tournament.state}</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

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

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-classification">Level of Event *</label>
                    <select
                      id="edit-classification"
                      name="classification"
                      value={editFormData.classification || ''}
                      onChange={handleEditInputChange}
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
                    <label htmlFor="edit-eventType">Type of Event *</label>
                    <select
                      id="edit-eventType"
                      name="eventType"
                      value={editFormData.eventType || ''}
                      onChange={handleEditInputChange}
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="Open">Open</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-category">Category *</label>
                  <input
                    type="text"
                    id="edit-category"
                    name="category"
                    value={editFormData.category || ''}
                    onChange={handleEditInputChange}
                    placeholder="e.g., Men's Singles, Women's Doubles, Mixed Doubles"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-malaysianEntryFee">Malaysian Entry Fee (RM) per player *</label>
                    <input
                      type="number"
                      id="edit-malaysianEntryFee"
                      name="malaysianEntryFee"
                      value={editFormData.malaysianEntryFee || ''}
                      onChange={handleEditInputChange}
                      min="0"
                      max="200"
                      step="0.01"
                    />
                    <small className="form-note" style={{ color: '#dc3545' }}>
                      Note: Not more than RM 200.00
                    </small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-internationalEntryFee">International Entry Fee (RM) per player</label>
                    <input
                      type="number"
                      id="edit-internationalEntryFee"
                      name="internationalEntryFee"
                      value={editFormData.internationalEntryFee || ''}
                      onChange={handleEditInputChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-expectedParticipants">Expected No. of Participants *</label>
                  <input
                    type="number"
                    id="edit-expectedParticipants"
                    name="expectedParticipants"
                    value={editFormData.expectedParticipants || ''}
                    onChange={handleEditInputChange}
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Tournament Software Being Used * (Select all that apply)</label>
                  <div style={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    padding: '10px',
                    backgroundColor: '#f9f9f9'
                  }}>
                    {approvedSoftware.map((software) => (
                      <div key={software._id} style={{
                        padding: '8px',
                        marginBottom: '5px'
                      }}>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}>
                          <input
                            type="checkbox"
                            name="tournamentSoftware"
                            value={software.softwareName}
                            checked={editFormData.tournamentSoftware && editFormData.tournamentSoftware.includes(software.softwareName)}
                            onChange={handleEditInputChange}
                            style={{
                              marginRight: '10px',
                              width: '16px',
                              height: '16px',
                              cursor: 'pointer'
                            }}
                          />
                          {software.softwareName}
                        </label>
                      </div>
                    ))}
                    <div style={{
                      padding: '8px',
                      borderTop: '1px solid #ddd',
                      marginTop: '5px',
                      paddingTop: '10px'
                    }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        <input
                          type="checkbox"
                          name="tournamentSoftware"
                          value="Other"
                          checked={editFormData.tournamentSoftware && editFormData.tournamentSoftware.includes('Other')}
                          onChange={handleEditInputChange}
                          style={{
                            marginRight: '10px',
                            width: '16px',
                            height: '16px',
                            cursor: 'pointer'
                          }}
                        />
                        Other (Please specify)
                      </label>
                    </div>
                  </div>
                </div>

                {editFormData.tournamentSoftware && editFormData.tournamentSoftware.includes('Other') && (
                  <div className="form-group">
                    <label htmlFor="edit-tournamentSoftwareOther">Please specify the software name *</label>
                    <input
                      type="text"
                      id="edit-tournamentSoftwareOther"
                      name="tournamentSoftwareOther"
                      value={editFormData.tournamentSoftwareOther || ''}
                      onChange={handleEditInputChange}
                      placeholder="Enter software name"
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="edit-eventSummary">Brief Summary/Purpose of Event *</label>
                  <textarea
                    id="edit-eventSummary"
                    name="eventSummary"
                    value={editFormData.eventSummary || ''}
                    onChange={handleEditInputChange}
                    rows="5"
                    maxLength="300"
                    required
                  />
                  <small className="form-note">Maximum 300 characters.</small>
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

      {/* Update Profile Modal */}
      {showUpdateProfileModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '0',
            maxWidth: '800px',
            maxHeight: '90vh',
            width: '90%',
            overflow: 'hidden',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <div className="modal-header" style={{
              padding: '20px 30px',
              borderBottom: '1px solid #ddd',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8f9fa'
            }}>
              <h2 style={{ margin: 0, color: '#333' }}>Update Organization Profile</h2>
              <button
                onClick={handleCloseProfileModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body" style={{
              maxHeight: 'calc(90vh - 140px)',
              overflowY: 'auto',
              padding: '30px'
            }}>
              <form onSubmit={handleUpdateProfile}>
                {/* Organization Information */}
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ color: '#333', marginBottom: '20px', borderBottom: '2px solid #007bff', paddingBottom: '10px' }}>
                    Organization Information
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                        Organization Name *
                      </label>
                      <input
                        type="text"
                        name="organizationName"
                        value={profileUpdateData.organizationName}
                        onChange={handleProfileInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                        Registration Number *
                      </label>
                      <input
                        type="text"
                        name="registrationNo"
                        value={profileUpdateData.registrationNo}
                        onChange={handleProfileInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                        Contact Person *
                      </label>
                      <input
                        type="text"
                        name="applicantFullName"
                        value={profileUpdateData.applicantFullName}
                        onChange={handleProfileInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={profileUpdateData.phoneNumber}
                        onChange={handleProfileInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={profileUpdateData.email}
                      onChange={handleProfileInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Address Information */}
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ color: '#333', marginBottom: '20px', borderBottom: '2px solid #007bff', paddingBottom: '10px' }}>
                    Address Information
                  </h3>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      name="addressLine1"
                      value={profileUpdateData.addressLine1}
                      onChange={handleProfileInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      name="addressLine2"
                      value={profileUpdateData.addressLine2}
                      onChange={handleProfileInputChange}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={profileUpdateData.city}
                        onChange={handleProfileInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                        Postcode *
                      </label>
                      <input
                        type="text"
                        name="postcode"
                        value={profileUpdateData.postcode}
                        onChange={handleProfileInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                        State *
                      </label>
                      <select
                        name="state"
                        value={profileUpdateData.state}
                        onChange={handleProfileInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          boxSizing: 'border-box'
                        }}
                      >
                        <option value="">Select State</option>
                        <option value="Johor">Johor</option>
                        <option value="Kedah">Kedah</option>
                        <option value="Kelantan">Kelantan</option>
                        <option value="Kuala Lumpur">Kuala Lumpur</option>
                        <option value="Labuan">Labuan</option>
                        <option value="Malacca">Malacca</option>
                        <option value="Negeri Sembilan">Negeri Sembilan</option>
                        <option value="Pahang">Pahang</option>
                        <option value="Penang">Penang</option>
                        <option value="Perak">Perak</option>
                        <option value="Perlis">Perlis</option>
                        <option value="Putrajaya">Putrajaya</option>
                        <option value="Sabah">Sabah</option>
                        <option value="Sarawak">Sarawak</option>
                        <option value="Selangor">Selangor</option>
                        <option value="Terengganu">Terengganu</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                      Country *
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={profileUpdateData.country}
                      onChange={handleProfileInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Document Upload */}
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ color: '#333', marginBottom: '20px', borderBottom: '2px solid #007bff', paddingBottom: '10px' }}>
                    Organization Documents
                  </h3>

                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="edit-upload-documents" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                      Upload Documents (PDF, DOC, DOCX, JPG, PNG - Max 10MB each)
                    </label>
                    <input
                      type="file"
                      id="edit-upload-documents"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        boxSizing: 'border-box'
                      }}
                    />
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                      You can upload organization certificate, business license, or other relevant documents.
                    </p>
                  </div>

                  {/* Uploaded Documents List */}
                  {uploadedDocuments.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ marginBottom: '10px' }}>Uploaded Documents:</h4>
                      <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', padding: '10px' }}>
                        {uploadedDocuments.map((doc, index) => (
                          <div key={index} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px',
                            borderBottom: '1px solid #eee',
                            marginBottom: '5px'
                          }}>
                            <span style={{ fontSize: '14px' }}>
                              {doc.name || `Document ${index + 1}`}
                              {doc.size && ` (${(doc.size / 1024 / 1024).toFixed(2)} MB)`}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeDocument(index)}
                              style={{
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                padding: '4px 8px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {profileUpdateError && (
                  <div style={{
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: '12px',
                    borderRadius: '4px',
                    marginBottom: '20px'
                  }}>
                    {profileUpdateError}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                  <button
                    type="button"
                    onClick={handleCloseProfileModal}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: isUpdatingProfile ? '#ccc' : '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: isUpdatingProfile ? 'not-allowed' : 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Inbox Modal */}
      <OrganiserInbox
        organizationData={organizationData}
        isOpen={showInboxModal}
        onClose={() => setShowInboxModal(false)}
      />

      {/* Calendar Modal */}
      {showCalendarModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '900px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '2px solid #e9ecef'
            }}>
              <h2 style={{ margin: 0, color: '#495057', fontSize: '24px', fontWeight: '600' }}>
                Tournament Calendar
              </h2>
              <button
                onClick={() => setShowCalendarModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6c757d',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            {/* Calendar Content */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: '24px',
              minHeight: '500px'
            }}>
              {/* Calendar Grid */}
              <div className="calendar-grid">
                <div className="calendar-header" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                  paddingBottom: '15px',
                  borderBottom: '2px solid #e9ecef'
                }}>
                  <button
                    onClick={handlePrevMonth}
                    style={{
                      background: 'none',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    ←
                  </button>
                  <h3 style={{ margin: 0 }}>
                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button
                    onClick={handleNextMonth}
                    style={{
                      background: 'none',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    →
                  </button>
                </div>

                {/* Calendar Grid */}
                <div className="calendar-month" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '1px',
                  backgroundColor: '#dee2e6',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  {/* Day headers */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} style={{
                      padding: '12px',
                      backgroundColor: '#495057',
                      color: 'white',
                      textAlign: 'center',
                      fontWeight: '500',
                      fontSize: '14px'
                    }}>
                      {day}
                    </div>
                  ))}

                  {/* Empty cells for days before month starts */}
                  {Array.from({ length: getFirstDayOfMonth(currentMonth) }, (_, i) => (
                    <div key={`empty-${i}`} style={{
                      padding: '12px',
                      backgroundColor: '#f8f9fa',
                      minHeight: '60px'
                    }} />
                  ))}

                  {/* Calendar days */}
                  {Array.from({ length: getDaysInMonth(currentMonth) }, (_, i) => {
                    const day = i + 1;
                    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                    const tournaments = getTournamentsForDate(date);
                    const isToday = new Date().toDateString() === date.toDateString();
                    const isSelected = calendarSelectedDate.toDateString() === date.toDateString();

                    return (
                      <div
                        key={day}
                        onClick={() => handleDateClick(day)}
                        style={{
                          padding: '8px',
                          backgroundColor: isSelected ? '#007bff' : isToday ? '#e3f2fd' : 'white',
                          minHeight: '60px',
                          cursor: 'pointer',
                          border: isToday ? '2px solid #2196f3' : 'none',
                          position: 'relative',
                          color: isSelected ? 'white' : '#212529'
                        }}
                      >
                        <div style={{ fontWeight: isToday ? '600' : '400', fontSize: '14px' }}>
                          {day}
                        </div>
                        {tournaments.length > 0 && (
                          <div style={{
                            position: 'absolute',
                            bottom: '4px',
                            left: '4px',
                            right: '4px',
                            display: 'flex',
                            gap: '2px',
                            flexWrap: 'wrap'
                          }}>
                            {tournaments.slice(0, 3).map((tournament, idx) => (
                              <div
                                key={idx}
                                style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  backgroundColor: tournament.status === 'Approved' ? '#28a745' :
                                                 tournament.status === 'Pending Review' ? '#ffc107' : '#dc3545'
                                }}
                              />
                            ))}
                            {tournaments.length > 3 && (
                              <div style={{
                                fontSize: '8px',
                                color: isSelected ? 'white' : '#6c757d',
                                marginLeft: '2px'
                              }}>
                                +{tournaments.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="calendar-legend" style={{
                  marginTop: '15px',
                  padding: '10px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#28a745', borderRadius: '50%', marginRight: '5px' }}></span>
                  <small style={{ marginRight: '15px' }}>Approved</small>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#ffc107', borderRadius: '50%', marginRight: '5px' }}></span>
                  <small style={{ marginRight: '15px' }}>Pending</small>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#dc3545', borderRadius: '50%', marginRight: '5px' }}></span>
                  <small>Rejected</small>
                </div>
              </div>

              {/* Selected Date Details */}
              <div className="selected-date-details">
                <h4 style={{ marginTop: 0, color: '#495057' }}>
                  {calendarSelectedDate.toLocaleDateString('default', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h4>

                <div style={{ marginTop: '20px' }}>
                  <h5 style={{ margin: '0 0 15px 0', color: '#6c757d' }}>Your Tournaments</h5>
                  {getTournamentsForDate(calendarSelectedDate).length === 0 ? (
                    <p style={{ color: '#6c757d', fontStyle: 'italic' }}>No tournaments on this date</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {getTournamentsForDate(calendarSelectedDate).map((tournament, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '12px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '6px',
                            borderLeft: `4px solid ${
                              tournament.status === 'Approved' ? '#28a745' :
                              tournament.status === 'Pending Review' ? '#ffc107' : '#dc3545'
                            }`
                          }}
                        >
                          <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>
                            {tournament.eventTitle}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>
                            {tournament.venue}, {tournament.eventCity}
                          </div>
                          <div style={{
                            fontSize: '11px',
                            fontWeight: '500',
                            color: tournament.status === 'Approved' ? '#28a745' :
                                   tournament.status === 'Pending Review' ? '#856404' : '#721c24'
                          }}>
                            {tournament.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentApplication;