import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import { useNotices } from '../contexts/NoticeContext';
import mpaLogo from '../assets/images/mpa.png';
import AdminPanel from './AdminPanel';
import jsPDF from 'jspdf';

const AdminDashboard = ({ setCurrentPage, globalAssessmentSubmissions = [] }) => {
  // Use shared notices context
  const { 
    notices, 
    addNotice, 
    updateNotice, 
    deleteNotice, 
    toggleNoticeActive 
  } = useNotices();
  const [applications, setApplications] = useState([]);
  const [approvedTournaments, setApprovedTournaments] = useState([]);
  const [registeredOrganizations, setRegisteredOrganizations] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [pendingRejectionId, setPendingRejectionId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showMoreInfoModal, setShowMoreInfoModal] = useState(false);
  const [pendingMoreInfoId, setPendingMoreInfoId] = useState(null);
  const [requiredInfoDetails, setRequiredInfoDetails] = useState('');
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('Pending Review');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Current user authority level from localStorage (set during login)
  const [currentUserAuthority, setCurrentUserAuthority] = useState(
    localStorage.getItem('userAuthority') || 'admin'
  );

  // Admin User Management States
  const [adminUsers, setAdminUsers] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordId, setResetPasswordId] = useState(null);
  
  // Create Account States
  const [newAccountData, setNewAccountData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    authorityLevel: '',
    fullName: ''
  });

  // Export Settings States
  const [exportSettings, setExportSettings] = useState({
    format: 'csv',
    includeArchived: false,
    dataType: 'applications',
    isExporting: false
  });

  // Message to Organiser States
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageData, setMessageData] = useState({
    recipientEmail: '',
    recipientName: '',
    subject: '',
    content: '',
    priority: 'normal',
    category: 'general',
    relatedApplicationId: ''
  });
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageError, setMessageError] = useState('');

  // Create Tournament Form States
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

  const [tournamentFormData, setTournamentFormData] = useState({
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

  // State for managing multiple categories in admin create tournament
  const [savedTournamentCategories, setSavedTournamentCategories] = useState([]);

  const [isCreatingTournament, setIsCreatingTournament] = useState(false);
  const [createTournamentError, setCreateTournamentError] = useState('');
  const [tournamentCreated, setTournamentCreated] = useState(false);

  // Tournament Updates Tracking
  const [tournamentUpdates, setTournamentUpdates] = useState([]);

  // Assessment System States
  const [assessmentQuestions, setAssessmentQuestions] = useState([]);
  const [assessmentTimeLimit, setAssessmentTimeLimit] = useState(30);
  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [assessmentTitleMalay, setAssessmentTitleMalay] = useState('');
  const [assessmentSubtitle, setAssessmentSubtitle] = useState('');
  const [assessmentSubtitleMalay, setAssessmentSubtitleMalay] = useState('');
  const [passingScore, setPassingScore] = useState(70); // Percentage required to pass
  const [savedAssessmentForms, setSavedAssessmentForms] = useState([]);
  const [currentDraftId, setCurrentDraftId] = useState(null); // Track current draft being edited
  // Load assessment submissions from database instead of localStorage
  const [assessmentSubmissions, setAssessmentSubmissions] = useState([]);
  const [assessmentManagementExpanded, setAssessmentManagementExpanded] = useState(false);
  const [isLoadingUpdates, setIsLoadingUpdates] = useState(false);

  // Database Assessment Results States
  const [assessmentBatches, setAssessmentBatches] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [dateFilterEnabled, setDateFilterEnabled] = useState(false);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [collapsedBatches, setCollapsedBatches] = useState(new Set());


  // Edit Form Popup States
  const [showEditFormModal, setShowEditFormModal] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [editFormTitle, setEditFormTitle] = useState('');
  const [editFormTitleMalay, setEditFormTitleMalay] = useState('');
  const [editFormSubtitle, setEditFormSubtitle] = useState('');
  const [editFormSubtitleMalay, setEditFormSubtitleMalay] = useState('');
  const [editFormQuestions, setEditFormQuestions] = useState([]);
  const [editFormTimeLimit, setEditFormTimeLimit] = useState(30);
  const [editFormPassingScore, setEditFormPassingScore] = useState(70);

  // Temporary Code Modal States
  const [showTempCodeModal, setShowTempCodeModal] = useState(false);
  const [tempCodeData, setTempCodeData] = useState(null);

  // Security Notice Modal States
  const [showSecurityNoticeModal, setShowSecurityNoticeModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);

  // Temporary Codes Management States
  const [showTempCodesListModal, setShowTempCodesListModal] = useState(false);
  const [temporaryCodesList, setTemporaryCodesList] = useState([]);
  const [isLoadingTempCodes, setIsLoadingTempCodes] = useState(false);

  // Submission Details Modal States
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Sidebar Sub-menu state
  const [createTournamentExpanded, setCreateTournamentExpanded] = useState(false);

  // Load saved assessment forms and submissions on component mount
  useEffect(() => {
    const loadAssessmentForms = async () => {
      try {
        const forms = await apiService.getAllAssessmentForms();
        setSavedAssessmentForms(Array.isArray(forms) ? forms : []);
      } catch (error) {
        console.error('Error loading assessment forms:', error);
        setSavedAssessmentForms([]);
      }
    };

    const loadAssessmentSubmissions = async () => {
      try {
        const submissions = await apiService.getAllAssessmentSubmissions();
        setAssessmentSubmissions(Array.isArray(submissions) ? submissions : []);
      } catch (error) {
        console.error('Error loading assessment submissions:', error);
        setAssessmentSubmissions([]);
      }
    };

    loadAssessmentForms();
    loadAssessmentSubmissions();
  }, []);

  // Toggle batch folder collapse state
  const toggleBatchCollapse = (batchId) => {
    setCollapsedBatches(prev => {
      const newSet = new Set(prev);
      if (newSet.has(batchId)) {
        newSet.delete(batchId);
      } else {
        newSet.add(batchId);
      }
      return newSet;
    });
  };

  // Edit Form Popup Functions
  const openEditFormModal = (form) => {
    setEditingForm(form);
    setEditFormTitle(form.title || '');
    setEditFormTitleMalay(form.titleMalay || '');
    setEditFormSubtitle(form.subtitle || '');
    setEditFormSubtitleMalay(form.subtitleMalay || '');
    setEditFormQuestions([...form.questions]);
    setEditFormTimeLimit(form.timeLimit || 30);
    setEditFormPassingScore(form.passingScore || 70);
    setShowEditFormModal(true);
  };

  const closeEditFormModal = () => {
    setShowEditFormModal(false);
    setEditingForm(null);
    setEditFormTitle('');
    setEditFormTitleMalay('');
    setEditFormSubtitle('');
    setEditFormSubtitleMalay('');
    setEditFormQuestions([]);
    setEditFormTimeLimit(30);
    setEditFormPassingScore(70);
  };

  const saveEditedForm = async () => {
    try {
      if (!editFormTitle.trim()) {
        alert('Please enter an assessment title before saving the form.');
        return;
      }
      if (editFormQuestions.length === 0) {
        alert('Please add at least one question before saving the form.');
        return;
      }

      const formData = {
        code: editingForm.code,
        title: editFormTitle.trim(),
        titleMalay: editFormTitleMalay.trim(),
        subtitle: editFormSubtitle.trim(),
        subtitleMalay: editFormSubtitleMalay.trim(),
        questions: [...editFormQuestions],
        timeLimit: editFormTimeLimit,
        passingScore: editFormPassingScore
      };

      console.log('Updating form:', formData);
      const response = await apiService.saveAssessmentForm(formData);
      const updatedForm = response.data;

      // Update local state
      setSavedAssessmentForms(prev =>
        (Array.isArray(prev) ? prev : []).map(form =>
          form.code === editingForm.code ? updatedForm : form
        )
      );

      // Show security notice popup for edited form
      const securityNotice = `✅ FORM UPDATED SUCCESSFULLY!\n\n` +
        `Form Code: ${updatedForm.code}\n` +
        `Title: ${updatedForm.title}\n` +
        `Questions: ${updatedForm.questions.length}\n\n` +
        `🔒 IMPORTANT SECURITY GUIDELINES:\n\n` +
        `1) Do not share the original assessment or assessment code with participants.\n\n` +
        `2) Click the "Generate Temporary Code" button to obtain a code that starts with "T." This code will expire after 24 hours to ensure the system maintains the highest level of data integrity.\n\n` +
        `The form has been updated with your changes.`;
      alert(securityNotice);
      closeEditFormModal();
    } catch (error) {
      console.error('Error updating assessment form:', error);
      alert('Error updating form. Please try again.');
    }
  };

  const addEditQuestion = () => {
    const newQuestion = {
      id: Date.now(),
      question: '',
      section: '',
      options: [
        { text: '', malay: '' },
        { text: '', malay: '' },
        { text: '', malay: '' },
        { text: '', malay: '' }
      ],
      correctAnswer: ''
    };
    setEditFormQuestions([...editFormQuestions, newQuestion]);
  };

  const updateEditQuestion = (index, field, value) => {
    const updated = [...editFormQuestions];
    if (field === 'options') {
      updated[index].options = value;
    } else {
      updated[index][field] = value;
    }
    setEditFormQuestions(updated);
  };

  const removeEditQuestion = (index) => {
    if (window.confirm('Are you sure you want to remove this question?')) {
      const updated = editFormQuestions.filter((_, i) => i !== index);
      setEditFormQuestions(updated);
    }
  };

  // Load assessment results from database
  const loadAssessmentResults = async () => {
    setIsLoadingResults(true);
    try {
      const fromDate = dateFilterEnabled && selectedDate ? selectedDate : null;

      const batches = await apiService.getAssessmentBatches(fromDate);

      setAssessmentBatches(Array.isArray(batches) ? batches : []);
    } catch (error) {
      console.error('Error loading assessment results:', error);
      setAssessmentBatches([]);
    } finally {
      setIsLoadingResults(false);
    }
  };

  // Generate temporary assessment code
  const generateTempCode = async (form) => {
    if (!form._id && !form.id) {
      alert('Cannot generate temporary code: Form ID not found. Please save the form first.');
      return;
    }

    try {
      const result = await apiService.generateTemporaryAssessmentCode(form._id || form.id);

      if (result && result.tempCode) {
        const expiryDate = new Date(result.expiresAt);
        setTempCodeData({
          ...result,
          expiryDate: expiryDate,
          parentForm: form
        });
        setShowTempCodeModal(true);
      } else {
        alert('Failed to generate temporary code. Please try again.');
      }
    } catch (error) {
      console.error('Error generating temporary code:', error);
      alert('Failed to generate temporary code: ' + (error.message || 'Unknown error'));
    }
  };

  // Copy temporary code to clipboard
  const copyTempCodeToClipboard = () => {
    if (tempCodeData && tempCodeData.tempCode) {
      navigator.clipboard.writeText(tempCodeData.tempCode);
      alert('Temporary code copied to clipboard!');
    }
  };

  // Close temporary code modal
  const closeTempCodeModal = () => {
    setShowTempCodeModal(false);
    setTempCodeData(null);
  };

  // Open temporary codes list modal
  const openTempCodesListModal = async () => {
    setIsLoadingTempCodes(true);
    setShowTempCodesListModal(true);
    try {
      const codes = await apiService.getTemporaryCodes();
      setTemporaryCodesList(codes);
    } catch (error) {
      console.error('Error loading temporary codes:', error);
      alert('Failed to load temporary codes: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoadingTempCodes(false);
    }
  };

  // Close temporary codes list modal
  const closeTempCodesListModal = () => {
    setShowTempCodesListModal(false);
    setTemporaryCodesList([]);
  };

  // Copy temporary code from list
  const copyTempCodeFromList = (code) => {
    navigator.clipboard.writeText(code);
    alert('Temporary code copied to clipboard!');
  };

  // Delete temporary code
  const deleteTempCode = async (tempCodeId, tempCode) => {
    const confirmMessage = `Are you sure you want to delete the temporary code "${tempCode}"?\n\nThis action cannot be undone.`;

    if (window.confirm(confirmMessage)) {
      try {
        await apiService.deleteTemporaryCode(tempCodeId);
        // Remove from local state
        setTemporaryCodesList(prevCodes => prevCodes.filter(code => code._id !== tempCodeId));
        alert('Temporary code deleted successfully!');
      } catch (error) {
        console.error('Error deleting temporary code:', error);
        alert('Failed to delete temporary code: ' + (error.message || 'Unknown error'));
      }
    }
  };

  // Close security notice modal
  const handleCloseSecurityModal = () => {
    setShowSecurityNoticeModal(false);
  };

  // Actually save the form after user confirms security notice
  const handleConfirmSave = async () => {
    try {
      console.log('Starting form save process...');
      console.log('Questions:', assessmentQuestions);
      console.log('Time limit:', assessmentTimeLimit);

      // Validation
      if (!assessmentTitle.trim()) {
        alert('Please provide an assessment title.');
        return;
      }

      if (assessmentQuestions.length === 0) {
        alert('Please add at least one question to the assessment.');
        return;
      }

      // Check if all questions have the required fields
      const invalidQuestions = assessmentQuestions.filter(q =>
        !q.question.trim() || !q.section.trim() || q.options.length === 0 || !q.correctAnswer || !q.correctAnswer.trim()
      );

      if (invalidQuestions.length > 0) {
        alert('Please ensure all questions have a question text, section, at least one option, and one correct answer.');
        return;
      }

      console.log('Validation passed');

      // Get editing state
      const isEditing = window.sessionStorage.getItem('isEditingForm') === 'true';
      const editingFormCode = window.sessionStorage.getItem('editingFormCode');

      console.log('Is editing:', isEditing);
      console.log('Editing form code:', editingFormCode);

      // Prepare form data
      const formData = {
        title: assessmentTitle.trim(),
        titleMalay: assessmentTitleMalay.trim(),
        subtitle: assessmentSubtitle.trim(),
        subtitleMalay: assessmentSubtitleMalay.trim(),
        questions: assessmentQuestions.map(q => ({
          ...q,
          question: q.question.trim(),
          section: q.section.trim()
        })),
        timeLimit: assessmentTimeLimit,
        passingScore: passingScore
      };

      if (isEditing && editingFormCode) {
        // Update existing form
        formData.code = editingFormCode;
        console.log('Updating existing form:', editingFormCode);
        console.log('Form data to update:', formData);
      }

      console.log('Form data to send:', formData);
      console.log('Calling API...');
      const response = await apiService.saveAssessmentForm(formData);
      console.log('API response:', response);

      const savedForm = response.data;
      console.log('Saved form:', savedForm);

      // Update local state
      if (isEditing && editingFormCode) {
        // Update existing form in the list
        setSavedAssessmentForms(prev =>
          (Array.isArray(prev) ? prev : []).map(form =>
            form.code === editingFormCode ? savedForm : form
          )
        );
        alert(`Form updated successfully!\n\nForm Code: ${savedForm.code}\nTitle: ${savedForm.title}\nQuestions: ${savedForm.questions.length}\n\nThe existing form has been updated with your changes.`);

        // Clear editing state
        window.sessionStorage.removeItem('isEditingForm');
        window.sessionStorage.removeItem('editingFormCode');

        // Clear all form fields for next assessment
        setAssessmentTitle('');
        setAssessmentSubtitle('');
        setAssessmentQuestions([]);
        setAssessmentTimeLimit(30);
        setPassingScore(70);
      } else {
        // Add new form to the list
        setSavedAssessmentForms(prev => [...(Array.isArray(prev) ? prev : []), savedForm]);
        alert(`Form saved successfully! Form Code: ${savedForm.code}\n\nUsers can use this code to access the assessment.`);
      }

      // Clear all form fields for next assessment
      setAssessmentTitle('');
      setAssessmentSubtitle('');
      setAssessmentQuestions([]);
      setAssessmentTimeLimit(30);
      setPassingScore(70);

      // Close the security modal
      setShowSecurityNoticeModal(false);
      return savedForm.code;
    } catch (error) {
      console.error('Error saving assessment form:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      alert('Error saving form. Please try again.');
      setShowSecurityNoticeModal(false);
      return null;
    }
  };

  // Delete assessment form
  const deleteAssessmentForm = async (form) => {
    const confirmMessage = `Are you sure you want to delete the assessment form "${form.title || 'Untitled Assessment'}"?\n\nCode: ${form.code}\nThis action cannot be undone and will permanently remove the form from the database.`;

    if (window.confirm(confirmMessage)) {
      try {
        // Delete from database if it has an ID
        if (form._id || form.id) {
          await apiService.deleteAssessmentForm(form._id || form.id);
        }

        // Remove from local state
        const updatedForms = savedAssessmentForms.filter(f => f.code !== form.code);
        setSavedAssessmentForms(updatedForms);

        alert(`Assessment form "${form.title || 'Untitled Assessment'}" has been deleted successfully.`);
      } catch (error) {
        console.error('Error deleting assessment form:', error);
        alert('Failed to delete the assessment form. Please try again.');
      }
    }
  };

  // Load assessment results when view changes to assessment management
  useEffect(() => {
    if (currentView === 'assessment-statistics') {
      loadAssessmentResults();
    }
  }, [currentView]);

  // Reload data when date filter changes
  useEffect(() => {
    if (currentView === 'assessment-statistics') {
      loadAssessmentResults();
    }
  }, [selectedDate, dateFilterEnabled]);

  // Handle date filter toggle
  const handleDateFilterToggle = () => {
    setDateFilterEnabled(!dateFilterEnabled);
    if (dateFilterEnabled) {
      setSelectedDate('');
    }
  };

  // Generate PDF report of all assessment results
  const downloadAssessmentResultsPDF = () => {
    try {
      const doc = new jsPDF();

      // Convert logo to base64 and add to PDF
      const addLogoToPDF = () => {
        // Create a canvas to convert the image to base64
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = function() {
          canvas.width = this.width;
          canvas.height = this.height;
          ctx.drawImage(this, 0, 0);
          const dataURL = canvas.toDataURL('image/png');

          // Add logo to PDF (top right corner)
          const imgWidth = 25;
          const imgHeight = (this.height / this.width) * imgWidth;
          doc.addImage(dataURL, 'PNG', 170, 10, imgWidth, imgHeight);

          // Continue with rest of PDF generation
          generatePDFContent();
        };

        img.onerror = function() {
          // If logo fails to load, continue without it
          generatePDFContent();
        };

        img.src = mpaLogo;
      };

      const generatePDFContent = () => {
        // Title
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Assessment Results Report', 20, 25);

        // Subtitle
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Malaysia Pickleball Association', 20, 35);

        // Date generated
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, 45);

        let yPosition = 60;

        // Check if there are results to display
        if (assessmentBatches.length === 0) {
          doc.setFontSize(12);
          doc.text('No assessment results available.', 20, yPosition);
        } else {
          // Process each batch
          assessmentBatches.forEach((batch, batchIndex) => {
            // Batch header
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(`Batch: ${batch._id}`, 20, yPosition);
            yPosition += 10;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Form Code: ${batch.formCode} | Date: ${batch.batchDate} | Average Score: ${Math.round(batch.averageScore)}%`, 20, yPosition);
            yPosition += 15;

            // Table headers
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('No.', 20, yPosition);
            doc.text('Name', 35, yPosition);
            doc.text('IC Number', 100, yPosition);
            doc.text('Score', 140, yPosition);
            doc.text('Percentage', 160, yPosition);
            doc.text('Status', 185, yPosition);
            yPosition += 5;

            // Draw line under headers
            doc.line(20, yPosition, 200, yPosition);
            yPosition += 8;

            // Process submissions in this batch
            batch.submissions.forEach((submission, index) => {
              // Check if we need a new page
              if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
              }

              doc.setFont('helvetica', 'normal');
              doc.text((index + 1).toString(), 20, yPosition);
              doc.text(submission.participantName || 'Unknown', 35, yPosition);
              doc.text('N/A', 100, yPosition); // IC Number not available in current data structure
              doc.text(`${submission.correctAnswers || 0}/${submission.totalQuestions || 0}`, 140, yPosition);
              doc.text(`${submission.score || 0}%`, 160, yPosition);

              // Status with color
              const passed = (submission.score || 0) >= 70;
              doc.setTextColor(passed ? 0 : 255, passed ? 128 : 0, 0);
              doc.text(passed ? 'PASS' : 'FAIL', 185, yPosition);
              doc.setTextColor(0, 0, 0); // Reset to black

              yPosition += 8;
            });

            yPosition += 10; // Space between batches
          });
        }

        // Footer
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text('Malaysia Pickleball Association - Assessment Results Report', 20, 290);

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `Assessment_Results_${timestamp}.pdf`;

        // Save the PDF
        doc.save(filename);
      };

      // Start the PDF generation with logo
      addLogoToPDF();

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    }
  };

  // Calculate total batches from selected date
  const getTotalBatchesFromDate = () => {
    return assessmentBatches.length;
  };

  // Function to open submission details modal
  const openSubmissionDetails = (submission) => {
    setSelectedSubmission(submission);
    setShowSubmissionModal(true);
  };

  // Notice Management States
  const [editingNotice, setEditingNotice] = useState(null);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeFormData, setNoticeFormData] = useState({
    id: null,
    type: 'info',
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    active: true,
    actions: []
  });

  // Calendar state
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateTournaments, setSelectedDateTournaments] = useState([]);

  // Edit Tournament States
  const [editingTournament, setEditingTournament] = useState(null);
  const [editFormData, setEditFormData] = useState({
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
    expectedParticipants: '',
    eventSummary: '',
    scoringFormat: 'traditional',
    dataConsent: false,
    termsConsent: false
  });
  const [isUpdatingTournament, setIsUpdatingTournament] = useState(false);
  const [editTournamentError, setEditTournamentError] = useState('');
  const [tournamentUpdated, setTournamentUpdated] = useState(false);


  useEffect(() => {
    loadApplications();
    loadApprovedTournaments();
    loadRegisteredOrganizations();
    loadAdminUsers();
    loadTournamentUpdates();
  }, []);

  // Role-based access control - redirect assessment_admin to assessments view
  useEffect(() => {
    if (currentUserAuthority === 'assessment_admin') {
      const allowedViews = ['assessment-management', 'assessment-list', 'assessment-statistics', 'saved-forms'];
      if (!allowedViews.includes(currentView)) {
        setCurrentView('assessment-statistics');
      }
    }
  }, [currentUserAuthority, currentView]);

  // Notice Management Functions
  const handleCreateNotice = () => {
    setNoticeFormData({
      id: null,
      type: 'info',
      title: '',
      content: '',
      date: new Date().toISOString().split('T')[0],
      active: true,
      actions: []
    });
    setEditingNotice(null);
    setShowNoticeModal(true);
  };

  const handleEditNotice = (notice) => {
    setNoticeFormData({
      ...notice,
      date: notice.date || new Date().toISOString().split('T')[0]
    });
    setEditingNotice(notice.id);
    setShowNoticeModal(true);
  };

  const handleSaveNotice = () => {
    if (!noticeFormData.title.trim() || !noticeFormData.content.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    if (editingNotice) {
      // Update existing notice
      updateNotice(editingNotice, noticeFormData);
    } else {
      // Create new notice
      addNotice(noticeFormData);
    }
    
    setShowNoticeModal(false);
    setEditingNotice(null);
  };

  const handleDeleteNotice = (noticeId) => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      deleteNotice(noticeId);
    }
  };

  const handleToggleNoticeActive = (noticeId) => {
    toggleNoticeActive(noticeId);
  };

  // Tournament category management functions
  const handleSaveTournamentCategory = () => {
    if (!tournamentFormData.category || !tournamentFormData.malaysianEntryFee) {
      alert('Please fill in Category and Malaysian Entry Fee before saving.');
      return;
    }
    const newCategory = {
      id: Date.now(),
      category: tournamentFormData.category,
      malaysianEntryFee: parseFloat(tournamentFormData.malaysianEntryFee),
      internationalEntryFee: tournamentFormData.internationalEntryFee ? parseFloat(tournamentFormData.internationalEntryFee) : 0
    };
    setSavedTournamentCategories(prev => [...prev, newCategory]);
    // Clear the category fields
    setTournamentFormData(prev => ({
      ...prev,
      category: '',
      malaysianEntryFee: '',
      internationalEntryFee: ''
    }));
  };

  const handleRemoveTournamentCategory = (categoryId) => {
    setSavedTournamentCategories(prev => prev.filter(cat => cat.id !== categoryId));
  };

  const loadApplications = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await apiService.getAllApplications();
      setApplications(data);
    } catch (error) {
      console.error('Failed to load applications:', error);
      setError('Failed to load applications. Please check if the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadApprovedTournaments = async () => {
    try {
      const data = await apiService.getApprovedTournaments();
      setApprovedTournaments(data);
    } catch (error) {
      console.error('Failed to load approved tournaments:', error);
    }
  };

  const loadRegisteredOrganizations = async () => {
    try {
      const data = await apiService.getRegisteredOrganizations();
      setRegisteredOrganizations(data);
    } catch (error) {
      console.error('Failed to load registered organizations:', error);
    }
  };

  const loadAdminUsers = async () => {
    try {
      const data = await apiService.getAllAdminUsers();
      if (data.success) {
        setAdminUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to load admin users:', error);
    }
  };

  const loadTournamentUpdates = async () => {
    try {
      setIsLoadingUpdates(true);
      // For now, we'll simulate tournament updates by tracking recent application changes
      // In a real implementation, you'd have a dedicated API endpoint for tournament updates
      const data = await apiService.getAllApplications();
      
      // Generate mock updates based on recent applications and changes
      const updates = [];
      const now = new Date();
      const last24Hours = new Date(now.getTime() - (24 * 60 * 60 * 1000));
      
      // Add recent submissions as updates
      data.forEach(app => {
        const submissionDate = new Date(app.submissionDate);
        if (submissionDate > last24Hours) {
          updates.push({
            id: `new-${app.applicationId}`,
            type: 'new',
            tournamentId: app.applicationId,
            tournamentName: app.eventTitle,
            organizerName: app.organiserName,
            change: 'New tournament application submitted',
            timestamp: submissionDate,
            details: {
              eventDate: app.eventStartDate,
              venue: app.venue,
              status: app.status
            }
          });
        }

        // Add status changes as updates
        if (app.status === 'Approved' || app.status === 'Rejected') {
          updates.push({
            id: `status-${app.applicationId}`,
            type: 'status_change',
            tournamentId: app.applicationId,
            tournamentName: app.eventTitle,
            organizerName: app.organiserName,
            change: `Tournament status changed to ${app.status}`,
            timestamp: new Date(submissionDate.getTime() + (Math.random() * 2 * 60 * 60 * 1000)), // Random time after submission
            details: {
              previousStatus: 'Pending Review',
              newStatus: app.status,
              venue: app.venue
            }
          });
        }
      });

      // Sort by timestamp (newest first) and limit to 10 most recent
      updates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setTournamentUpdates(updates.slice(0, 10));
    } catch (error) {
      console.error('Failed to load tournament updates:', error);
      setTournamentUpdates([]);
    } finally {
      setIsLoadingUpdates(false);
    }
  };

  const handleSuspendOrganization = async (orgId, orgName) => {
    if (!window.confirm(`Are you sure you want to suspend "${orgName}"? This will prevent them from accessing the system.`)) {
      return;
    }

    try {
      await apiService.suspendOrganization(orgId);
      // Update local state
      setRegisteredOrganizations(prevOrgs => 
        prevOrgs.map(org => 
          org._id === orgId ? { ...org, status: 'suspended' } : org
        )
      );
      alert(`Organization "${orgName}" has been suspended successfully.`);
    } catch (error) {
      console.error('Failed to suspend organization:', error);
      alert(`Failed to suspend organization: ${error.message}. Please try again.`);
    }
  };

  const handleUnsuspendOrganization = async (orgId, orgName) => {
    if (!window.confirm(`Are you sure you want to unsuspend "${orgName}"? This will restore their access to the system.`)) {
      return;
    }

    try {
      await apiService.reactivateOrganization(orgId);
      // Update local state
      setRegisteredOrganizations(prevOrgs => 
        prevOrgs.map(org => 
          org._id === orgId ? { ...org, status: 'active' } : org
        )
      );
      alert(`Organization "${orgName}" has been unsuspended successfully.`);
    } catch (error) {
      console.error('Failed to unsuspend organization:', error);
      alert(`Failed to unsuspend organization: ${error.message}. Please try again.`);
    }
  };

  const handleDeleteOrganization = async (orgId, orgName, organizationId) => {
    const confirmMessage = `⚠️ DANGER: This will permanently delete "${orgName}" (${organizationId}) from the system.\n\nThis action CANNOT be undone and will:\n- Remove all organization data\n- Delete all associated records\n- Make the organization ID unavailable\n\nType "DELETE" to confirm:`;
    
    const userInput = prompt(confirmMessage);
    
    if (userInput !== 'DELETE') {
      alert('Deletion cancelled. You must type "DELETE" exactly to confirm.');
      return;
    }

    try {
      await apiService.deleteOrganization(orgId);
      // Remove from local state
      setRegisteredOrganizations(prevOrgs => 
        prevOrgs.filter(org => org._id !== orgId)
      );
      alert(`Organization "${orgName}" (${organizationId}) has been permanently deleted.`);
    } catch (error) {
      console.error('Failed to delete organization:', error);
      alert(`Failed to delete organization: ${error.message}. Please try again.`);
    }
  };

  // Message handling functions
  const handleSendMessageToOrganiser = (orgEmail, orgName, applicationId = null) => {
    setMessageData({
      recipientEmail: orgEmail,
      recipientName: orgName,
      subject: applicationId ? `Re: Tournament Application ${applicationId}` : '',
      content: '',
      priority: 'normal',
      category: applicationId ? 'tournament' : 'general',
      relatedApplicationId: applicationId || ''
    });
    setShowMessageModal(true);
    setMessageError('');
  };

  const handleMessageInputChange = (e) => {
    const { name, value } = e.target;
    setMessageData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setIsSendingMessage(true);
    setMessageError('');

    try {
      const adminUsername = localStorage.getItem('adminUsername') || 'Admin';

      const messagePayload = {
        fromType: 'admin',
        fromId: adminUsername,
        fromName: `Admin - ${adminUsername}`,
        toType: 'organiser',
        toId: messageData.recipientEmail,
        toName: messageData.recipientName,
        subject: messageData.subject,
        content: messageData.content,
        priority: messageData.priority,
        category: messageData.category,
        relatedApplicationId: messageData.relatedApplicationId || null
      };

      await apiService.sendMessage(messagePayload);

      alert(`Message sent successfully to ${messageData.recipientName}!`);
      setShowMessageModal(false);

      // Reset form
      setMessageData({
        recipientEmail: '',
        recipientName: '',
        subject: '',
        content: '',
        priority: 'normal',
        category: 'general',
        relatedApplicationId: ''
      });

    } catch (error) {
      console.error('Failed to send message:', error);
      setMessageError(error.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleCloseMessageModal = () => {
    setShowMessageModal(false);
    setMessageError('');
    setMessageData({
      recipientEmail: '',
      recipientName: '',
      subject: '',
      content: '',
      priority: 'normal',
      category: 'general',
      relatedApplicationId: ''
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending Review':
        return '#ffa500';
      case 'Approved':
        return '#28a745';
      case 'Rejected':
        return '#dc3545';
      case 'Under Review':
        return '#007bff';
      default:
        return '#6c757d';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const addTournamentUpdate = (tournamentId, tournamentName, organizerName, changeDescription, details = {}) => {
    const newUpdate = {
      id: `update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'change',
      tournamentId: tournamentId,
      tournamentName: tournamentName,
      organizerName: organizerName,
      change: changeDescription,
      timestamp: new Date(),
      details: details
    };
    
    setTournamentUpdates(prev => [newUpdate, ...prev].slice(0, 10)); // Keep only 10 most recent
  };

  const updateApplicationStatus = async (id, newStatus) => {
    try {
      // If status is being changed to "Rejected", require rejection reason
      if (newStatus === 'Rejected') {
        setPendingRejectionId(id);
        setShowRejectionModal(true);
        return; // Show modal first
      } else if (newStatus === 'More Info Required') {
        setPendingMoreInfoId(id);
        setShowMoreInfoModal(true);
        return; // Show modal first
      } else {
        // For other status changes, proceed normally
        await apiService.updateApplicationStatus(id, newStatus);
        
        // Find the application to get details for the update
        const app = applications.find(app => app.id === id || app.applicationId === id);
        const previousStatus = app?.status || 'Unknown';
        
        const updatedApplications = applications.map(app => 
          (app.id === id || app.applicationId === id) ? { ...app, status: newStatus } : app
        );
        setApplications(updatedApplications);
        
        // Add tournament update
        if (app) {
          addTournamentUpdate(
            app.applicationId || id,
            app.eventTitle || 'Unknown Tournament',
            app.organiserName || 'Unknown Organizer',
            `Tournament status changed from ${previousStatus} to ${newStatus}`,
            {
              previousStatus,
              newStatus,
              venue: app.venue,
              eventDate: app.eventStartDate
            }
          );
        }
        
        // Reload approved tournaments if status changed to Approved
        if (newStatus === 'Approved') {
          loadApprovedTournaments();
        }
      }
    } catch (error) {
      console.error('Failed to update application status:', error);
      alert('Failed to update application status. Please try again.');
    }
  };

  const handleRejectionSubmit = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }

    try {
      // Find the application to get details for the update
      const app = applications.find(app => app.id === pendingRejectionId || app.applicationId === pendingRejectionId);
      const previousStatus = app?.status || 'Unknown';
      
      // Update local state with rejection reason
      const updatedApplications = applications.map(app => 
        (app.id === pendingRejectionId || app.applicationId === pendingRejectionId) ? { 
          ...app, 
          status: 'Rejected',
          remarks: rejectionReason.trim()
        } : app
      );
      setApplications(updatedApplications);
      
      await apiService.updateApplicationStatus(pendingRejectionId, 'Rejected', rejectionReason.trim());
      
      // Add tournament update for rejection
      if (app) {
        addTournamentUpdate(
          app.applicationId || pendingRejectionId,
          app.eventTitle || 'Unknown Tournament',
          app.organiserName || 'Unknown Organizer',
          `Tournament application rejected: ${rejectionReason.trim()}`,
          {
            previousStatus,
            newStatus: 'Rejected',
            venue: app.venue,
            eventDate: app.eventStartDate,
            rejectionReason: rejectionReason.trim()
          }
        );
      }
      
      // Reload approved tournaments in case a rejected app was previously approved
      loadApprovedTournaments();
      
      // Close modal and reset
      setShowRejectionModal(false);
      setPendingRejectionId(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Failed to update application status:', error);
      alert('Failed to update application status. Please try again.');
    }
  };

  const handleMoreInfoSubmit = async () => {
    if (!requiredInfoDetails.trim()) {
      alert('Please specify what additional information is required.');
      return;
    }

    try {
      // Find the application to get details for the update
      const app = applications.find(app => app.id === pendingMoreInfoId || app.applicationId === pendingMoreInfoId);
      const previousStatus = app?.status || 'Unknown';

      // Update local state with required info details
      const updatedApplications = applications.map(app =>
        (app.id === pendingMoreInfoId || app.applicationId === pendingMoreInfoId) ? {
          ...app,
          status: 'More Info Required',
          requiredInfo: requiredInfoDetails.trim()
        } : app
      );
      setApplications(updatedApplications);

      await apiService.updateApplicationStatus(pendingMoreInfoId, 'More Info Required', requiredInfoDetails.trim());

      // Add tournament update for more info required
      if (app) {
        addTournamentUpdate(
          app.applicationId || pendingMoreInfoId,
          app.eventTitle || 'Unknown Tournament',
          app.organiserName || 'Unknown Organizer',
          `Additional information requested: ${requiredInfoDetails.trim()}`,
          {
            previousStatus,
            newStatus: 'More Info Required',
            venue: app.venue,
            eventDate: app.eventStartDate,
            requiredInfo: requiredInfoDetails.trim()
          }
        );
      }

      // Close modal and reset
      setShowMoreInfoModal(false);
      setPendingMoreInfoId(null);
      setRequiredInfoDetails('');

      // Show success message
      alert(`Additional information has been requested successfully. An email notification has been sent to the organizer at ${app && app.email ? app.email : 'their registered email address'}.`);
    } catch (error) {
      console.error('Failed to update application status:', error);
      alert('Failed to update application status. Please try again.');
    }
  };

  const handleMoreInfoCancel = () => {
    setShowMoreInfoModal(false);
    setPendingMoreInfoId(null);
    setRequiredInfoDetails('');
  };

  const handleRejectionCancel = () => {
    setShowRejectionModal(false);
    setPendingRejectionId(null);
    setRejectionReason('');
  };

  const deleteApplication = async (applicationId) => {
    if (!window.confirm('Are you sure you want to permanently delete this application? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('Attempting to delete application with ID:', applicationId);
      await apiService.deleteApplication(applicationId);
      // Remove from local state
      setApplications(prevApps => prevApps.filter(app => 
        app.applicationId !== applicationId && app.id !== applicationId
      ));
      alert('Application deleted successfully.');
    } catch (error) {
      console.error('Failed to delete application:', error);
      console.error('Error details:', error.message);
      alert(`Failed to delete application: ${error.message}. Please try again.`);
    }
  };



  const showApplicationDetails = (application) => {
    setSelectedApplication(application);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedApplication(null);
  };

  // Admin User Management Functions
  const handleToggleAdminStatus = async (adminId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    const actionText = newStatus === 'disabled' ? 'disable' : 'enable';
    
    if (!window.confirm(`Are you sure you want to ${actionText} this admin account?`)) {
      return;
    }

    try {
      const response = await apiService.updateAdminUserStatus(adminId, newStatus);
      
      if (response.success) {
        // Refresh admin users list
        await loadAdminUsers();
        alert(`Admin account has been ${newStatus === 'disabled' ? 'disabled' : 'enabled'} successfully.`);
      } else {
        alert(response.message || 'Failed to update admin status');
      }
    } catch (error) {
      console.error('Error updating admin status:', error);
      alert(error.message || 'Failed to update admin status. Please try again.');
    }
  };

  const handleDeleteAdmin = async (adminId, username) => {
    const confirmMessage = `⚠️ DANGER: This will permanently delete the admin account "${username}" from the system.\n\nThis action CANNOT be undone.\n\nType "DELETE" to confirm:`;
    
    const userInput = prompt(confirmMessage);
    
    if (userInput !== 'DELETE') {
      alert('Deletion cancelled. You must type "DELETE" exactly to confirm.');
      return;
    }

    try {
      const response = await apiService.deleteAdminUser(adminId);
      
      if (response.success) {
        // Refresh admin users list
        await loadAdminUsers();
        alert(`Admin account "${username}" has been permanently deleted.`);
      } else {
        alert(response.message || 'Failed to delete admin account');
      }
    } catch (error) {
      console.error('Error deleting admin user:', error);
      alert(error.message || 'Failed to delete admin account. Please try again.');
    }
  };

  const handleEditAdmin = (admin) => {
    setSelectedAdmin({ ...admin });
    setShowEditAdminModal(true);
  };

  const handleSaveAdminEdit = () => {
    if (!selectedAdmin.username.trim() || !selectedAdmin.email.trim()) {
      alert('Username and email are required.');
      return;
    }

    setAdminUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === selectedAdmin.id ? { ...selectedAdmin } : user
      )
    );

    setShowEditAdminModal(false);
    setSelectedAdmin(null);
    alert('Admin account updated successfully.');
  };

  const handleResetPassword = (adminId) => {
    setResetPasswordId(adminId);
    setShowResetPasswordModal(true);
  };

  const handleConfirmPasswordReset = () => {
    const admin = adminUsers.find(user => user.id === resetPasswordId);
    if (admin) {
      // In a real app, this would call an API
      alert(`Password reset email has been sent to ${admin.email}`);
    }
    setShowResetPasswordModal(false);
    setResetPasswordId(null);
  };

  const getAdminStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#28a745';
      case 'disabled':
        return '#6c757d';
      case 'suspended':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getAuthorityLevelDisplay = (level) => {
    switch (level) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'assessment_admin':
        return 'Assessment Admin';
      default:
        return level;
    }
  };

  // Check if current user has access to specific sections
  const hasAccessTo = (section) => {
    switch (currentUserAuthority) {
      case 'super_admin':
        return true; // Super admin has access to everything
      case 'admin':
        return section !== 'admin_management'; // Admin has access except admin management
      case 'assessment_admin':
        // Assessment admin only has access to assessment-related features
        return ['assessments', 'assessment-management', 'assessment-list', 'assessment-statistics', 'saved-forms'].includes(section);
      default:
        return false;
    }
  };


  // Create Account Functions
  const handleCreateAccount = async () => {
    // Validation
    if (!newAccountData.username.trim()) {
      alert('Username is required.');
      return;
    }
    
    if (!newAccountData.email.trim()) {
      alert('Email is required.');
      return;
    }
    
    if (!newAccountData.password.trim()) {
      alert('Password is required.');
      return;
    }
    
    if (newAccountData.password !== newAccountData.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    
    if (!newAccountData.authorityLevel) {
      alert('Authority level is required.');
      return;
    }

    try {
      // Create new admin user via API
      const userData = {
        username: newAccountData.username.trim(),
        password: newAccountData.password.trim(),
        email: newAccountData.email.trim(),
        fullName: newAccountData.fullName.trim() || null,
        authorityLevel: newAccountData.authorityLevel
      };

      console.log('Creating admin user:', userData);
      const response = await apiService.createAdminUser(userData);

      if (response.success) {
        // Refresh admin users list
        await loadAdminUsers();
        
        // Reset form
        setNewAccountData({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          authorityLevel: '',
          fullName: ''
        });

        alert(`Admin account "${userData.username}" created successfully with ${getAuthorityLevelDisplay(userData.authorityLevel)} privileges.`);
      } else {
        alert(response.message || 'Failed to create admin account');
      }
    } catch (error) {
      console.error('Error creating admin user:', error);
      alert(error.message || 'Failed to create admin account. Please try again.');
    }
  };

  const handleNewAccountInputChange = (field, value) => {
    setNewAccountData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Export Functions
  const handleExportSettingChange = (field, value) => {
    setExportSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const convertToCSV = (data, headers) => {
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    );
    return [csvHeaders, ...csvRows].join('\n');
  };

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const prepareApplicationsData = () => {
    let data = [...applications];
    
    // Filter archived if needed
    if (!exportSettings.includeArchived) {
      data = data.filter(app => app.status !== 'Archived');
    }

    return data.map(app => ({
      'Application ID': app.applicationId || '',
      'Event Title': app.eventTitle || '',
      'Organizer Name': app.organiserName || '',
      'Organizer Email': app.organiserEmail || '',
      'Event Start Date': app.eventStartDate ? new Date(app.eventStartDate).toLocaleDateString('en-MY') : '',
      'Event End Date': app.eventEndDate ? new Date(app.eventEndDate).toLocaleDateString('en-MY') : '',
      'Location': app.city && app.state ? `${app.city}, ${app.state}` : (app.state || app.city || ''),
      'Venue': app.venue || '',
      'Status': app.status || '',
      'Submission Date': new Date(app.submissionDate).toLocaleDateString(),
      'Category': app.category || '',
      'Expected Participants': app.expectedParticipants || '',
      'Contact Person': app.contactPerson || '',
      'Contact Phone': app.contactPhone || ''
    }));
  };

  const prepareOrganizationsData = () => {
    return registeredOrganizations.map(org => ({
      'Organization ID': org.organizationId || '',
      'Organization Name': org.organizationName || '',
      'Email': org.email || '',
      'Contact Person': org.contactPerson || '',
      'Contact Phone': org.contactPhone || '',
      'Address': org.address || '',
      'Status': org.status || '',
      'Registration Date': new Date(org.registrationDate).toLocaleDateString(),
      'Website': org.website || '',
      'Description': org.description || ''
    }));
  };

  const prepareAdminUsersData = () => {
    if (currentUserAuthority !== 'super_admin') {
      return [];
    }
    
    return adminUsers.map(admin => ({
      'Username': admin.username || '',
      'Email': admin.email || '',
      'Full Name': admin.fullName || '',
      'Authority Level': admin.authorityLevel || '',
      'Status': admin.status || '',
      'Created Date': new Date(admin.createdAt).toLocaleDateString(),
      'Last Login': admin.lastLogin ? new Date(admin.lastLogin).toLocaleDateString() : 'Never'
    }));
  };

  // Tournament form handlers
  const handleTournamentInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTournamentFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTournamentStateChange = (e) => {
    const selectedState = e.target.value;
    setTournamentFormData(prev => ({
      ...prev,
      state: selectedState,
      city: ''
    }));
  };

  const handleTournamentDateChange = (e) => {
    const { name, value } = e.target;
    const formattedValue = value ? formatDateForDisplay(value) : '';
    
    if (name === 'eventStartDate') {
      setTournamentFormData(prev => ({
        ...prev,
        eventStartDate: value,
        eventStartDateFormatted: formattedValue
      }));
    } else if (name === 'eventEndDate') {
      setTournamentFormData(prev => ({
        ...prev,
        eventEndDate: value,
        eventEndDateFormatted: formattedValue
      }));
    }
  };

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
    
    // If it's an ISO timestamp (with T and Z), extract just the date part
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(dateStr)) {
      return dateStr.split('T')[0];
    }
    
    // Try to parse the date
    let date = new Date(dateStr);
    
    // If that fails, try parsing with different formats
    if (isNaN(date.getTime())) {
      const formats = [
        dateStr,
        dateStr.replace(/\//g, '-'),
        dateStr.replace(/\./g, '-')
      ];
      
      for (const format of formats) {
        date = new Date(format);
        if (!isNaN(date.getTime())) break;
      }
    }
    
    if (isNaN(date.getTime())) {
      console.warn('Could not parse date:', dateStr);
      return ''; // Invalid date
    }
    
    // Return in YYYY-MM-DD format for HTML date input
    return date.toISOString().split('T')[0];
  };

  // Edit Tournament handlers
  const startEditTournament = (tournament) => {
    console.log('Editing tournament data:', tournament); // Debug log
    
    
    // Debug date handling
    const startDateRaw = tournament.eventStartDate || tournament.event_start_date || tournament.startDate || '';
    const endDateRaw = tournament.eventEndDate || tournament.event_end_date || tournament.endDate || '';
    console.log('Raw start date:', startDateRaw);
    console.log('Raw end date:', endDateRaw);
    console.log('Formatted start date for input:', formatDateForInput(startDateRaw));
    console.log('Formatted end date for input:', formatDateForInput(endDateRaw));
    
    setEditingTournament(tournament);
    setEditFormData({
      organiserName: tournament.organiserName || tournament.organizer || '',
      registrationNo: tournament.registrationNo || tournament.registration_no || '',
      telContact: tournament.telContact || tournament.tel_contact || tournament.phone || '',
      personInCharge: tournament.personInCharge || tournament.person_in_charge || tournament.contact_person || tournament.contactPerson || tournament.applicantFullName || tournament.fullName || tournament.organizer_name || tournament.organizerName || '',
      email: tournament.email || tournament.email_address || tournament.contactEmail || tournament.organizer_email || tournament.organizerEmail || tournament.contact_email || '',
      organisingPartner: tournament.organisingPartner || tournament.organizing_partner || '',
      eventTitle: tournament.eventTitle || tournament.event_title || tournament.title || '',
      eventStartDate: formatDateForInput(tournament.eventStartDate || tournament.event_start_date || tournament.startDate || ''),
      eventEndDate: formatDateForInput(tournament.eventEndDate || tournament.event_end_date || tournament.endDate || ''),
      eventStartDateFormatted: formatDateForDisplay(tournament.eventStartDate || tournament.event_start_date || tournament.startDate || ''),
      eventEndDateFormatted: formatDateForDisplay(tournament.eventEndDate || tournament.event_end_date || tournament.endDate || ''),
      state: tournament.state || tournament.location_state || '',
      city: tournament.city || tournament.location_city || '',
      venue: tournament.venue || tournament.event_venue || '',
      classification: tournament.classification || tournament.event_type || tournament.level || '',
      expectedParticipants: (tournament.expectedParticipants || tournament.expected_participants || tournament.participants || '')?.toString() || '',
      eventSummary: tournament.eventSummary || tournament.event_summary || tournament.summary || tournament.description || '',
      scoringFormat: tournament.scoringFormat || tournament.scoring_format || 'traditional',
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
      city: ''
    }));
  };

  const handleEditDateChange = (e) => {
    const { name, value } = e.target;
    const formattedValue = value ? formatDateForDisplay(value) : '';
    
    if (name === 'eventStartDate') {
      setEditFormData(prev => ({
        ...prev,
        eventStartDate: value,
        eventStartDateFormatted: formattedValue
      }));
    } else if (name === 'eventEndDate') {
      setEditFormData(prev => ({
        ...prev,
        eventEndDate: value,
        eventEndDateFormatted: formattedValue
      }));
    }
  };

  const handleUpdateTournament = async (e) => {
    e.preventDefault();
    setIsUpdatingTournament(true);
    setEditTournamentError('');
    
    try {
      const submissionData = {
        organiserName: editFormData.organiserName?.trim() || '',
        registrationNo: editFormData.registrationNo?.trim() || '',
        telContact: editFormData.telContact?.trim() || '',
        personInCharge: editFormData.personInCharge?.trim() || '',
        email: editFormData.email?.trim() || '',
        organisingPartner: editFormData.organisingPartner?.trim() || '',
        eventTitle: editFormData.eventTitle?.trim() || '',
        eventStartDate: editFormData.eventStartDate?.trim() || '',
        eventEndDate: editFormData.eventEndDate?.trim() || '',
        state: editFormData.state?.trim() || '',
        city: editFormData.city?.trim() || '',
        venue: editFormData.venue?.trim() || '',
        classification: editFormData.classification?.trim() || '',
        expectedParticipants: editFormData.expectedParticipants ? parseInt(editFormData.expectedParticipants) || 0 : 0,
        eventSummary: editFormData.eventSummary?.trim() || '',
        scoringFormat: editFormData.scoringFormat?.trim() || 'traditional',
        dataConsent: editFormData.dataConsent,
        termsConsent: editFormData.termsConsent
      };

      // Validate required fields
      const requiredFields = {
        organiserName: 'Organizer Name',
        eventTitle: 'Event Title',
        eventStartDate: 'Start Date',
        venue: 'Venue',
        state: 'State',
        city: 'City',
        classification: 'Classification',
        telContact: 'Contact Number',
        email: 'Email',
        personInCharge: 'Person in Charge'
      };

      const missingFields = [];
      Object.keys(requiredFields).forEach(field => {
        if (!submissionData[field] || submissionData[field].toString().trim() === '') {
          missingFields.push(requiredFields[field]);
        }
      });

      if (missingFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      }

      // Safety check - ensure tournament still exists
      const tournamentId = editingTournament.applicationId || editingTournament.id;
      if (!tournamentId) {
        throw new Error('Tournament ID not found. The tournament may have been deleted.');
      }
      
      // Verify tournament still exists in current applications
      const currentTournament = applications.find(app => 
        (app.applicationId === tournamentId || app.id === tournamentId)
      );
      if (!currentTournament) {
        throw new Error('Tournament no longer exists. It may have been deleted by another admin.');
      }
      
      console.log('Updating tournament with ID:', tournamentId, 'Data:', submissionData);
      
      // Create the update payload with the original tournament ID
      const updatePayload = {
        ...submissionData,
        applicationId: tournamentId, // Keep the same ID
        id: tournamentId, // Keep the same ID
        isUpdate: true // Flag to indicate this is an update, not a new submission
      };

      try {
        // Try using the dedicated tournament update API first
        if (apiService.updateTournamentApplication && typeof apiService.updateTournamentApplication === 'function') {
          console.log('Using dedicated updateTournamentApplication API');
          const response = await apiService.updateTournamentApplication(tournamentId, updatePayload);
          console.log('Tournament updated via dedicated API:', response);
        } else if (apiService.updateApplicationStatus && typeof apiService.updateApplicationStatus === 'function') {
          // Use status update API with additional data
          console.log('Using updateApplicationStatus with additional tournament data');
          await apiService.updateApplicationStatus(tournamentId, editingTournament.status || 'Approved', 'Tournament details updated by admin', updatePayload);
        } else {
          console.log('No update API found - will update local state only');
          console.warn('Changes may not persist after page refresh');
        }
        
        // Always update local state regardless of API success/failure
        const updatedApplications = applications.map(app => 
          (app.applicationId === tournamentId || app.id === tournamentId) 
            ? { ...app, ...submissionData, lastModified: new Date().toISOString() } 
            : app
        );
        setApplications(updatedApplications);
        
      } catch (apiError) {
        console.error('API update failed:', apiError);
        
        // Still update local state even if API fails
        const updatedApplications = applications.map(app => 
          (app.applicationId === tournamentId || app.id === tournamentId) 
            ? { ...app, ...submissionData, lastModified: new Date().toISOString() } 
            : app
        );
        setApplications(updatedApplications);
        
        // Show a warning but don't fail the operation
        console.warn('Tournament updated locally but may not be persisted to server');
      }
      
      // Detect and display changes made
      const changes = [];
      const fieldsToCheck = {
        eventTitle: 'Tournament Name',
        organiserName: 'Organizer Name',
        venue: 'Venue',
        eventStartDate: 'Start Date',
        eventEndDate: 'End Date',
        state: 'State',
        city: 'City',
        classification: 'Classification',
        expectedParticipants: 'Expected Participants',
        telContact: 'Contact Number',
        email: 'Email',
        personInCharge: 'Person in Charge',
        eventSummary: 'Event Summary'
      };

      Object.keys(fieldsToCheck).forEach(key => {
        const oldValue = editingTournament[key];
        const newValue = submissionData[key];
        
        // Special handling for date fields
        if (key === 'eventStartDate' || key === 'eventEndDate') {
          // Helper function to format date to YYYY-MM-DD without timezone issues
          const formatDateToLocal = (dateStr) => {
            if (!dateStr) return '';
            if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
              return dateStr; // Already in correct format
            }
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '';
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          };

          // Convert both dates to YYYY-MM-DD format for comparison
          const oldDateStr = formatDateToLocal(oldValue);
          const newDateStr = formatDateToLocal(newValue);
          
          if (oldDateStr !== newDateStr && newDateStr !== '') {
            changes.push(`${fieldsToCheck[key]}: "${oldDateStr}" → "${newDateStr}"`);
          }
        } else {
          // Regular string comparison for non-date fields
          const oldStr = oldValue != null ? String(oldValue) : '';
          const newStr = newValue != null ? String(newValue) : '';
          
          if (oldStr !== newStr && newStr !== '' && newValue != null) {
            changes.push(`${fieldsToCheck[key]}: "${oldValue}" → "${newValue}"`);
          }
        }
      });

      // Add tournament update entry to track the edit operation
      const changesText = changes.length > 0 
        ? `Admin edited tournament: ${changes.map(change => change.split(':')[0]).join(', ')} updated`
        : 'Admin edited tournament: No field changes detected';
      
      addTournamentUpdate(
        tournamentId, // Use the same tournament ID
        editFormData.eventTitle,
        editFormData.organiserName,
        changesText,
        {
          venue: editFormData.venue,
          eventDate: editFormData.eventStartDate,
          classification: editFormData.classification,
          updateType: 'EDIT',
          originalTournamentId: tournamentId,
          changesCount: changes.length,
          changeDetails: changes
        }
      );

      // Create detailed success message
      const successMessage = [
        `✅ TOURNAMENT EDIT SUCCESSFUL`,
        ``,
        `Tournament: ${editFormData.eventTitle}`,
        `Tournament ID: ${tournamentId} (SAME ID - NO NEW TOURNAMENT CREATED)`,
        `Status: Successfully Updated`,
        ``,
        `📝 CHANGES MADE:`,
        changes.length > 0 ? changes.join('\n') : 'No field changes detected',
        ``,
        `🔔 EMAIL NOTIFICATION:`,
        `An update confirmation email has been sent to ${editFormData.email}`,
        `Email contains tournament name, ID, and all changes made.`,
        ``,
        `Changes are now active in the system.`
      ].join('\n');
      
      alert(successMessage);
      
      setTournamentUpdated(true);
      
      // Delay reload to allow server to process the changes
      setTimeout(() => {
        loadApplications();
        loadApprovedTournaments();
      }, 1000);
      
    } catch (error) {
      console.error('Tournament update error:', error);
      setEditTournamentError(error.message || 'Failed to update tournament. Please try again.');
    } finally {
      setIsUpdatingTournament(false);
    }
  };

  const cancelEditTournament = () => {
    setEditingTournament(null);
    setEditFormData({});
    setEditTournamentError('');
    setTournamentUpdated(false);
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

    return applications.filter(app => {
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
    const tournamentsOnDate = getTournamentsForDate(clickedDate);
    setSelectedDateTournaments(tournamentsOnDate);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleCreateTournament = async (e) => {
    e.preventDefault();
    setIsCreatingTournament(true);
    setCreateTournamentError('');
    
    // Validate that at least one category is saved
    if (savedTournamentCategories.length === 0) {
      alert('Please save at least one tournament category before submitting.');
      setIsCreatingTournament(false);
      return;
    }
    
    try {
      const submissionData = {
        organiserName: tournamentFormData.organiserName,
        registrationNo: tournamentFormData.registrationNo,
        telContact: tournamentFormData.telContact,
        personInCharge: tournamentFormData.personInCharge,
        email: tournamentFormData.email,
        organisingPartner: tournamentFormData.organisingPartner,
        eventTitle: tournamentFormData.eventTitle,
        eventStartDate: tournamentFormData.eventStartDate,
        eventEndDate: tournamentFormData.eventEndDate,
        state: tournamentFormData.state,
        city: tournamentFormData.city,
        venue: tournamentFormData.venue,
        classification: tournamentFormData.classification,
        eventType: tournamentFormData.eventType,
        categories: savedTournamentCategories,
        expectedParticipants: parseInt(tournamentFormData.expectedParticipants),
        eventSummary: tournamentFormData.eventSummary,
        scoringFormat: tournamentFormData.scoringFormat,
        dataConsent: tournamentFormData.dataConsent,
        termsConsent: tournamentFormData.termsConsent,
        status: 'Approved',
        createdByAdmin: true
      };

      const response = await apiService.submitTournamentApplication(submissionData);
      
      alert(`Tournament created successfully! Application ID: ${response.application.applicationId}`);
      
      // Add tournament update for new tournament creation
      addTournamentUpdate(
        response.application.applicationId,
        tournamentFormData.eventTitle,
        tournamentFormData.organiserName,
        'New tournament created by admin and auto-approved',
        {
          venue: tournamentFormData.venue,
          eventDate: tournamentFormData.eventStartDate,
          status: 'Approved',
          classification: tournamentFormData.classification
        }
      );
      
      setTournamentCreated(true);
      loadApplications();
      loadApprovedTournaments();
      
      setTournamentFormData({
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
      
      setSavedTournamentCategories([]);
      
    } catch (error) {
      console.error('Tournament creation error:', error);
      setCreateTournamentError(error.message || 'Failed to create tournament. Please try again.');
    } finally {
      setIsCreatingTournament(false);
    }
  };

  const handleExportData = async () => {
    if (exportSettings.isExporting) return;

    try {
      setExportSettings(prev => ({ ...prev, isExporting: true }));

      let data = [];
      let filename = '';
      let headers = [];

      // Prepare data based on type
      switch (exportSettings.dataType) {
        case 'applications':
          data = prepareApplicationsData();
          filename = `tournament-applications-${new Date().toISOString().split('T')[0]}`;
          headers = Object.keys(data[0] || {});
          break;
        case 'organizations':
          data = prepareOrganizationsData();
          filename = `registered-organizations-${new Date().toISOString().split('T')[0]}`;
          headers = Object.keys(data[0] || {});
          break;
        case 'admins':
          if (currentUserAuthority !== 'super_admin') {
            alert('Only Super Admins can export admin user data.');
            return;
          }
          data = prepareAdminUsersData();
          filename = `admin-users-${new Date().toISOString().split('T')[0]}`;
          headers = Object.keys(data[0] || {});
          break;
        default:
          data = prepareApplicationsData();
          filename = `tournament-applications-${new Date().toISOString().split('T')[0]}`;
          headers = Object.keys(data[0] || {});
      }

      if (data.length === 0) {
        alert('No data available to export.');
        return;
      }

      // Export based on format
      switch (exportSettings.format) {
        case 'csv':
          const csvContent = convertToCSV(data, headers);
          downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
          break;
        case 'excel':
          // For now, export as CSV with .xlsx extension (basic implementation)
          // In production, you'd use a library like xlsx or exceljs
          const excelContent = convertToCSV(data, headers);
          downloadFile(excelContent, `${filename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;');
          alert('Note: Excel export is currently in CSV format. For true Excel format, additional libraries are needed.');
          break;
        case 'json':
          const jsonContent = JSON.stringify(data, null, 2);
          downloadFile(jsonContent, `${filename}.json`, 'application/json;charset=utf-8;');
          break;
        default:
          const defaultContent = convertToCSV(data, headers);
          downloadFile(defaultContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
      }

      alert(`Successfully exported ${data.length} records as ${exportSettings.format.toUpperCase()}`);

    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed: ' + error.message);
    } finally {
      setExportSettings(prev => ({ ...prev, isExporting: false }));
    }
  };

  const renderNoticeManagement = () => (
    <div className="notice-management-view">
      <div className="dashboard-header">
        <h2>Notice Management</h2>
        <p className="dashboard-subtitle">Manage announcements and notices for the homepage portal</p>
        <button 
          className="create-notice-btn"
          onClick={handleCreateNotice}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            marginTop: '10px'
          }}
        >
          + Create New Notice
        </button>
      </div>

      <div className="notices-list" style={{ marginTop: '20px' }}>
        {notices.map((notice) => (
          <div 
            key={notice.id} 
            className="notice-item" 
            style={{
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '15px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <span 
                    className={`notice-type-badge ${notice.type}`}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      color: 'white',
                      backgroundColor: 
                        notice.type === 'urgent' ? '#dc3545' :
                        notice.type === 'important' ? '#fd7e14' :
                        notice.type === 'info' ? '#0dcaf0' : '#6c757d',
                      marginRight: '10px'
                    }}
                  >
                    {notice.type}
                  </span>
                  <span style={{ 
                    color: notice.active ? '#28a745' : '#dc3545',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {notice.active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                  <span style={{ color: '#6c757d', fontSize: '12px', marginLeft: '10px' }}>
                    {notice.date}
                  </span>
                </div>
                
                <h4 style={{ margin: '0 0 10px 0', color: '#212529' }}>{notice.title}</h4>
                <p style={{ margin: '0', color: '#6c757d', lineHeight: '1.5' }}>{notice.content}</p>
              </div>
              
              <div className="notice-actions" style={{ display: 'flex', gap: '8px', marginLeft: '15px' }}>
                <button
                  onClick={() => handleEditNotice(notice)}
                  style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggleNoticeActive(notice.id)}
                  style={{
                    backgroundColor: notice.active ? '#ffc107' : '#28a745',
                    color: notice.active ? '#212529' : 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {notice.active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDeleteNotice(notice.id)}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {notices.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            color: '#6c757d', 
            padding: '40px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            No notices found. Create your first notice to get started.
          </div>
        )}
      </div>

      {/* Notice Modal */}
      {showNoticeModal && (
        <div 
          className="modal-overlay" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
          onClick={() => setShowNoticeModal(false)}
        >
          <div 
            className="modal-content" 
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '30px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '85vh',
              overflow: 'auto',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              border: '1px solid #ddd'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ 
              margin: '0 0 25px 0',
              color: '#333',
              fontSize: '24px',
              fontWeight: '600',
              textAlign: 'center',
              borderBottom: '2px solid #f0f0f0',
              paddingBottom: '15px'
            }}>
              {editingNotice ? 'Edit Notice' : 'Create New Notice'}
            </h3>
            
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                color: '#333',
                fontSize: '14px'
              }}>
                Notice Type *
              </label>
              <select
                value={noticeFormData.type}
                onChange={(e) => setNoticeFormData(prev => ({ ...prev, type: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                <option value="general">General</option>
                <option value="info">Info</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                color: '#333',
                fontSize: '14px'
              }}>
                Title *
              </label>
              <input
                type="text"
                value={noticeFormData.title}
                onChange={(e) => setNoticeFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter notice title"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                color: '#333',
                fontSize: '14px'
              }}>
                Content *
              </label>
              <textarea
                value={noticeFormData.content}
                onChange={(e) => setNoticeFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter notice content"
                rows="5"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                color: '#333',
                fontSize: '14px'
              }}>
                Date
              </label>
              <input
                type="date"
                value={noticeFormData.date}
                onChange={(e) => setNoticeFormData(prev => ({ ...prev, date: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '25px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                backgroundColor: '#f8f9fa'
              }}>
                <div>
                  <label style={{ 
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#333',
                    margin: 0,
                    display: 'block'
                  }}>
                    Active (visible on homepage)
                  </label>
                  <p style={{ 
                    fontSize: '12px', 
                    color: '#666', 
                    margin: '2px 0 0 0' 
                  }}>
                    Enable this notice to appear in the homepage portal
                  </p>
                </div>
                <label className="toggle-switch" style={{
                  position: 'relative',
                  display: 'inline-block',
                  width: '50px',
                  height: '24px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={noticeFormData.active}
                    onChange={(e) => setNoticeFormData(prev => ({ ...prev, active: e.target.checked }))}
                    style={{
                      opacity: 0,
                      width: 0,
                      height: 0
                    }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: noticeFormData.active ? '#007bff' : '#ccc',
                    transition: '0.3s',
                    borderRadius: '24px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '18px',
                      width: '18px',
                      left: noticeFormData.active ? '29px' : '3px',
                      bottom: '3px',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      transition: '0.3s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }} />
                  </span>
                </label>
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              justifyContent: 'flex-end',
              borderTop: '1px solid #f0f0f0',
              paddingTop: '20px',
              marginTop: '20px'
            }}>
              <button
                onClick={() => setShowNoticeModal(false)}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotice}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {editingNotice ? 'Update Notice' : 'Create Notice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => {
    const totalApplications = applications.length;
    const approvedApplications = applications.filter(app => app.status === 'Approved').length;
    const pendingApplications = applications.filter(app => app.status === 'Pending Review').length;
    const rejectedApplications = applications.filter(app => app.status === 'Rejected').length;
    const approvalRate = totalApplications > 0 ? ((approvedApplications / totalApplications) * 100).toFixed(1) : 0;
    const totalParticipants = applications.reduce((sum, app) => sum + parseInt(app.expectedParticipants || 0), 0);

    return (
      <div style={{
        padding: '24px',
        backgroundColor: '#f8f9fa',
        minHeight: '100vh'
      }}>
        {/* Header Section */}
        <div style={{
          marginBottom: '32px',
          backgroundColor: '#fff',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #2563eb'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#1f2937',
            margin: '0 0 8px 0'
          }}>
            Analytics Dashboard
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            margin: '0'
          }}>
            Comprehensive insights and statistics for tournament applications
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          {/* Total Applications */}
          <div style={{
            backgroundColor: '#fff',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '16px'
            }}>
              <div>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6b7280',
                  margin: '0 0 8px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Total Applications
                </h3>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: '#1f2937',
                  lineHeight: '1'
                }}>
                  {totalApplications}
                </div>
              </div>
              <div style={{
                backgroundColor: '#dbeafe',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#1d4ed8'
              }}>
                +12% month
              </div>
            </div>
            <div style={{
              height: '4px',
              backgroundColor: '#e5e7eb',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                backgroundColor: '#2563eb',
                width: '75%',
                borderRadius: '2px'
              }}></div>
            </div>
          </div>

          {/* Approval Rate */}
          <div style={{
            backgroundColor: '#fff',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '16px'
            }}>
              <div>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6b7280',
                  margin: '0 0 8px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Approval Rate
                </h3>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: '#1f2937',
                  lineHeight: '1'
                }}>
                  {approvalRate}%
                </div>
              </div>
              <div style={{
                backgroundColor: '#dcfce7',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#166534'
              }}>
                +5% month
              </div>
            </div>
            <div style={{
              height: '4px',
              backgroundColor: '#e5e7eb',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                backgroundColor: '#16a34a',
                width: `${approvalRate}%`,
                borderRadius: '2px'
              }}></div>
            </div>
          </div>

          {/* Processing Time */}
          <div style={{
            backgroundColor: '#fff',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '16px'
            }}>
              <div>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6b7280',
                  margin: '0 0 8px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Avg. Processing Time
                </h3>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: '#1f2937',
                  lineHeight: '1'
                }}>
                  2.3 <span style={{ fontSize: '16px', color: '#6b7280' }}>days</span>
                </div>
              </div>
              <div style={{
                backgroundColor: '#fef3c7',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#92400e'
              }}>
                -0.5 days
              </div>
            </div>
            <div style={{
              height: '4px',
              backgroundColor: '#e5e7eb',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                backgroundColor: '#f59e0b',
                width: '60%',
                borderRadius: '2px'
              }}></div>
            </div>
          </div>

          {/* Total Participants */}
          <div style={{
            backgroundColor: '#fff',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '16px'
            }}>
              <div>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6b7280',
                  margin: '0 0 8px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Expected Participants
                </h3>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: '#1f2937',
                  lineHeight: '1'
                }}>
                  {totalParticipants.toLocaleString()}
                </div>
              </div>
              <div style={{
                backgroundColor: '#fce7f3',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#be185d'
              }}>
                +18% month
              </div>
            </div>
            <div style={{
              height: '4px',
              backgroundColor: '#e5e7eb',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                backgroundColor: '#ec4899',
                width: '85%',
                borderRadius: '2px'
              }}></div>
            </div>
          </div>
        </div>

        {/* Status Overview and Breakdown */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {/* Status Distribution */}
          <div style={{
            backgroundColor: '#fff',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937',
              margin: '0 0 20px 0'
            }}>
              Application Status Distribution
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Approved */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: '#16a34a'
                  }}></div>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Approved</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{approvedApplications}</span>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>({((approvedApplications / Math.max(totalApplications, 1)) * 100).toFixed(0)}%)</span>
                </div>
              </div>

              {/* Pending */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: '#f59e0b'
                  }}></div>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Pending Review</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{pendingApplications}</span>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>({((pendingApplications / Math.max(totalApplications, 1)) * 100).toFixed(0)}%)</span>
                </div>
              </div>

              {/* Rejected */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: '#dc2626'
                  }}></div>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Rejected</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{rejectedApplications}</span>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>({((rejectedApplications / Math.max(totalApplications, 1)) * 100).toFixed(0)}%)</span>
                </div>
              </div>
            </div>

            {/* Visual Bar */}
            <div style={{
              marginTop: '20px',
              height: '8px',
              backgroundColor: '#f3f4f6',
              borderRadius: '4px',
              overflow: 'hidden',
              display: 'flex'
            }}>
              <div style={{
                backgroundColor: '#16a34a',
                width: `${(approvedApplications / Math.max(totalApplications, 1)) * 100}%`,
                height: '100%'
              }}></div>
              <div style={{
                backgroundColor: '#f59e0b',
                width: `${(pendingApplications / Math.max(totalApplications, 1)) * 100}%`,
                height: '100%'
              }}></div>
              <div style={{
                backgroundColor: '#dc2626',
                width: `${(rejectedApplications / Math.max(totalApplications, 1)) * 100}%`,
                height: '100%'
              }}></div>
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{
            backgroundColor: '#fff',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937',
              margin: '0 0 20px 0'
            }}>
              Application Trends
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                padding: '16px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                borderLeft: '4px solid #2563eb'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>This Month</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  {applications.filter(app => {
                    const appDate = new Date(app.dateApplied);
                    const now = new Date();
                    return appDate.getMonth() === now.getMonth() && appDate.getFullYear() === now.getFullYear();
                  }).length} new applications submitted
                </div>
              </div>

              <div style={{
                padding: '16px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                borderLeft: '4px solid #16a34a'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>Processing Performance</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  Average review time improved by 0.5 days
                </div>
              </div>

              <div style={{
                padding: '16px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                borderLeft: '4px solid #f59e0b'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>Peak Season</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  Tournament season approaching - expect 25% increase
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assessment Analytics Section */}
        <div style={{
          marginTop: '48px',
          marginBottom: '32px',
          backgroundColor: '#fff',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #7c3aed'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1f2937',
            margin: '0 0 8px 0'
          }}>
            Assessment Analytics
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            margin: '0'
          }}>
            Performance insights and statistics for assessment submissions
          </p>
        </div>

        {/* Assessment Key Metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          {/* Total Submissions */}
          <div style={{
            backgroundColor: '#fff',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '16px'
            }}>
              <div>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6b7280',
                  margin: '0 0 8px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Total Submissions
                </h3>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: '#1f2937',
                  lineHeight: '1'
                }}>
                  {assessmentSubmissions.length}
                </div>
              </div>
              <div style={{
                backgroundColor: '#ede9fe',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#7c3aed'
              }}>
                {assessmentSubmissions.filter(sub => {
                  const subDate = new Date(sub.submittedAt || sub.batchDate);
                  const now = new Date();
                  return subDate.getMonth() === now.getMonth() && subDate.getFullYear() === now.getFullYear();
                }).length} this month
              </div>
            </div>
            <div style={{
              height: '4px',
              backgroundColor: '#e5e7eb',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                backgroundColor: '#7c3aed',
                width: '70%',
                borderRadius: '2px'
              }}></div>
            </div>
          </div>

          {/* Average Score */}
          <div style={{
            backgroundColor: '#fff',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '16px'
            }}>
              <div>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6b7280',
                  margin: '0 0 8px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Average Score
                </h3>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: '#1f2937',
                  lineHeight: '1'
                }}>
                  {assessmentSubmissions.length > 0 ?
                    Math.round(assessmentSubmissions.reduce((sum, sub) => sum + (sub.score || 0), 0) / assessmentSubmissions.length) : 0}%
                </div>
              </div>
              <div style={{
                backgroundColor: '#dcfce7',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#166534'
              }}>
                +3% avg
              </div>
            </div>
            <div style={{
              height: '4px',
              backgroundColor: '#e5e7eb',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                backgroundColor: '#16a34a',
                width: `${assessmentSubmissions.length > 0 ?
                  Math.round(assessmentSubmissions.reduce((sum, sub) => sum + (sub.score || 0), 0) / assessmentSubmissions.length) : 0}%`,
                borderRadius: '2px'
              }}></div>
            </div>
          </div>

          {/* Pass Rate */}
          <div style={{
            backgroundColor: '#fff',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '16px'
            }}>
              <div>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6b7280',
                  margin: '0 0 8px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Pass Rate (&ge;70%)
                </h3>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: '#1f2937',
                  lineHeight: '1'
                }}>
                  {assessmentSubmissions.length > 0 ?
                    Math.round((assessmentSubmissions.filter(sub => (sub.score || 0) >= 70).length / assessmentSubmissions.length) * 100) : 0}%
                </div>
              </div>
              <div style={{
                backgroundColor: '#dbeafe',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#1d4ed8'
              }}>
                {assessmentSubmissions.filter(sub => (sub.score || 0) >= 70).length} passed
              </div>
            </div>
            <div style={{
              height: '4px',
              backgroundColor: '#e5e7eb',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                backgroundColor: '#2563eb',
                width: `${assessmentSubmissions.length > 0 ?
                  Math.round((assessmentSubmissions.filter(sub => (sub.score || 0) >= 70).length / assessmentSubmissions.length) * 100) : 0}%`,
                borderRadius: '2px'
              }}></div>
            </div>
          </div>

          {/* Unique Participants */}
          <div style={{
            backgroundColor: '#fff',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '16px'
            }}>
              <div>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6b7280',
                  margin: '0 0 8px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Unique Participants
                </h3>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: '#1f2937',
                  lineHeight: '1'
                }}>
                  {new Set(assessmentSubmissions.map(sub => sub.participantName || 'Unknown')).size}
                </div>
              </div>
              <div style={{
                backgroundColor: '#fef3c7',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#92400e'
              }}>
                Active users
              </div>
            </div>
            <div style={{
              height: '4px',
              backgroundColor: '#e5e7eb',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                backgroundColor: '#f59e0b',
                width: '65%',
                borderRadius: '2px'
              }}></div>
            </div>
          </div>
        </div>

        {/* Assessment Performance Analysis */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {/* Score Distribution */}
          <div style={{
            backgroundColor: '#fff',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937',
              margin: '0 0 20px 0'
            }}>
              Score Distribution
            </h3>

            {(() => {
              const excellent = assessmentSubmissions.filter(sub => (sub.score || 0) >= 80).length;
              const good = assessmentSubmissions.filter(sub => (sub.score || 0) >= 70 && (sub.score || 0) < 80).length;
              const needsImprovement = assessmentSubmissions.filter(sub => (sub.score || 0) < 70).length;
              const total = Math.max(assessmentSubmissions.length, 1);

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Excellent */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: '#16a34a'
                      }}></div>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Excellent (80-100%)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{excellent}</span>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>({Math.round((excellent / total) * 100)}%)</span>
                    </div>
                  </div>

                  {/* Good */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: '#2563eb'
                      }}></div>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Good (70-79%)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{good}</span>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>({Math.round((good / total) * 100)}%)</span>
                    </div>
                  </div>

                  {/* Needs Improvement */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: '#dc2626'
                      }}></div>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Needs Improvement (&lt;70%)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{needsImprovement}</span>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>({Math.round((needsImprovement / total) * 100)}%)</span>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div style={{
                    marginTop: '20px',
                    height: '8px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    display: 'flex'
                  }}>
                    <div style={{
                      backgroundColor: '#16a34a',
                      width: `${(excellent / total) * 100}%`,
                      height: '100%'
                    }}></div>
                    <div style={{
                      backgroundColor: '#2563eb',
                      width: `${(good / total) * 100}%`,
                      height: '100%'
                    }}></div>
                    <div style={{
                      backgroundColor: '#dc2626',
                      width: `${(needsImprovement / total) * 100}%`,
                      height: '100%'
                    }}></div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Assessment Activity */}
          <div style={{
            backgroundColor: '#fff',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937',
              margin: '0 0 20px 0'
            }}>
              Assessment Activity
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                padding: '16px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                borderLeft: '4px solid #7c3aed'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>Recent Activity</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  {assessmentSubmissions.filter(sub => {
                    const subDate = new Date(sub.submittedAt || sub.batchDate);
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    return subDate >= yesterday;
                  }).length} assessments completed in last 24 hours
                </div>
              </div>

              <div style={{
                padding: '16px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                borderLeft: '4px solid #16a34a'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>Performance Trend</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  {assessmentSubmissions.filter(sub => (sub.score || 0) >= 70).length > assessmentSubmissions.length / 2 ?
                    'Above average performance maintained' : 'Performance improvement needed'}
                </div>
              </div>

              <div style={{
                padding: '16px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                borderLeft: '4px solid #f59e0b'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>Form Codes Active</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  {new Set(assessmentSubmissions.map(sub => sub.formCode)).size} unique assessment forms in use
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Footer */}
        <div style={{
          backgroundColor: '#fff',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#1f2937',
            margin: '0 0 8px 0'
          }}>
            System Overview
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: '0',
            lineHeight: '1.5'
          }}>
            Dashboard last updated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()} |
            Total active tournaments tracked: {applications.filter(app => app.status === 'Approved').length} |
            Total assessments completed: {assessmentSubmissions.length} |
            System uptime: 99.9%
          </p>
        </div>
      </div>
    );
  };

  const renderRegisteredOrganizations = () => (
    <div className="registered-organizations-view">

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        padding: '0 0.5rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#374151',
            margin: '0'
          }}>
            Total Organizations: {registeredOrganizations.length}
          </h3>
          <div style={{
            height: '1px',
            width: '60px',
            backgroundColor: '#e5e7eb'
          }}></div>
          <span style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            fontWeight: '500'
          }}>
            Active: {registeredOrganizations.filter(org => org.status !== 'suspended').length}
          </span>
          <span style={{
            fontSize: '0.875rem',
            color: '#ef4444',
            fontWeight: '500'
          }}>
            Suspended: {registeredOrganizations.filter(org => org.status === 'suspended').length}
          </span>
        </div>
      </div>

      {registeredOrganizations.length === 0 ? (
        <div style={{
          backgroundColor: '#f9fafb',
          border: '2px dashed #d1d5db',
          borderRadius: '12px',
          padding: '3rem 2rem',
          textAlign: 'center',
          margin: '2rem 0'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            No Organizations Found
          </h3>
          <p style={{
            fontSize: '1rem',
            color: '#6b7280',
            margin: '0'
          }}>
            Organizations will appear here once they complete the registration process.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gap: '1.5rem',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))'
        }}>
          {registeredOrganizations.map((org, index) => (
            <div key={org._id} style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
              e.currentTarget.style.transform = 'translateY(0px)';
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div style={{ flex: '1' }}>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#111827',
                    margin: '0 0 0.25rem 0',
                    lineHeight: '1.4'
                  }}>
                    {org.organizationName}
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: '0',
                    fontWeight: '500'
                  }}>
                    ID: {org.organizationId}
                  </p>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{
                    backgroundColor: org.status === 'suspended' ? '#fef2f2' : '#f0fdf4',
                    color: org.status === 'suspended' ? '#dc2626' : '#16a34a',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.025em',
                    border: `1px solid ${org.status === 'suspended' ? '#fecaca' : '#bbf7d0'}`
                  }}>
                    {org.status === 'suspended' ? 'Suspended' : 'Active'}
                  </span>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div>
                  <p style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    margin: '0 0 0.25rem 0'
                  }}>
                    Applicant
                  </p>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#374151',
                    margin: '0',
                    fontWeight: '500'
                  }}>
                    {org.applicantFullName}
                  </p>
                </div>
                <div>
                  <p style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    margin: '0 0 0.25rem 0'
                  }}>
                    Documents
                  </p>
                  <span style={{
                    fontSize: '0.875rem',
                    color: org.documents && org.documents.length > 0 ? '#16a34a' : '#ea580c',
                    fontWeight: '600',
                    backgroundColor: org.documents && org.documents.length > 0 ? '#f0fdf4' : '#fff7ed',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '6px',
                    border: `1px solid ${org.documents && org.documents.length > 0 ? '#bbf7d0' : '#fed7aa'}`
                  }}>
                    {org.documents && org.documents.length > 0 ?
                      `${org.documents.length} Files` : 'No Files'
                    }
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <p style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: '0 0 0.25rem 0'
                }}>
                  Contact Email
                </p>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#374151',
                  margin: '0',
                  fontWeight: '500'
                }}>
                  {org.email}
                </p>
              </div>

              <div style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
                paddingTop: '1rem',
                borderTop: '1px solid #f3f4f6'
              }}>
                <button
                  onClick={() => showApplicationDetails(org)}
                  style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    flex: '1'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
                >
                  View Details
                </button>
                <button
                  onClick={() => handleSendMessageToOrganiser(org.email, org.organizationName)}
                  style={{
                    backgroundColor: '#06b6d4',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    flex: '1'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#0891b2'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#06b6d4'}
                >
                  Message
                </button>
                {org.status === 'suspended' ? (
                  <button
                    onClick={() => handleUnsuspendOrganization(org._id, org.organizationName)}
                    style={{
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      flex: '1'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
                  >
                    Unsuspend
                  </button>
                ) : (
                  <button
                    onClick={() => handleSuspendOrganization(org._id, org.organizationName)}
                    style={{
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      flex: '1'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#d97706'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#f59e0b'}
                  >
                    Suspend
                  </button>
                )}
                <button
                  onClick={() => handleDeleteOrganization(org._id, org.organizationName, org.organizationId)}
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    minWidth: '80px'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="settings-view">
      <div className="dashboard-header">
        <h2>Settings</h2>
        <p className="dashboard-subtitle">Configure system preferences and options</p>
      </div>

      <div className="settings-sections">
        <div className="settings-card">
          <h3>Account Settings</h3>
          <div className="setting-item">
            <label>Username</label>
            <input type="text" value="admin" disabled />
          </div>
          <div className="setting-item">
            <label>Email Notifications</label>
            <select>
              <option>Enabled</option>
              <option>Disabled</option>
            </select>
          </div>
          <button className="settings-btn">Update Account</button>
        </div>

        {currentUserAuthority === 'super_admin' && (
          <div className="settings-card">
            <h3>Create New Account</h3>
            <p className="settings-description">Create new admin accounts with specific authority levels for this portal</p>
            <div className="setting-item">
              <label>Username *</label>
              <input 
                type="text" 
                placeholder="Enter username" 
                value={newAccountData.username}
                onChange={(e) => handleNewAccountInputChange('username', e.target.value)}
              />
            </div>
            <div className="setting-item">
              <label>Email Address *</label>
              <input 
                type="email" 
                placeholder="Enter email address" 
                value={newAccountData.email}
                onChange={(e) => handleNewAccountInputChange('email', e.target.value)}
              />
            </div>
            <div className="setting-item">
              <label>Password *</label>
              <input 
                type="password" 
                placeholder="Enter password" 
                value={newAccountData.password}
                onChange={(e) => handleNewAccountInputChange('password', e.target.value)}
              />
            </div>
            <div className="setting-item">
              <label>Confirm Password *</label>
              <input 
                type="password" 
                placeholder="Confirm password" 
                value={newAccountData.confirmPassword}
                onChange={(e) => handleNewAccountInputChange('confirmPassword', e.target.value)}
              />
            </div>
            <div className="setting-item">
              <label>Authority Level *</label>
              <select 
                value={newAccountData.authorityLevel}
                onChange={(e) => handleNewAccountInputChange('authorityLevel', e.target.value)}
              >
                <option value="">Select Authority Level</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="assessment_admin">Assessment Admin</option>
              </select>
              <small className="authority-info">
                • <strong>Super Admin:</strong> Full access to all features and settings<br/>
                • <strong>Admin:</strong> Standard admin access with limited system settings<br/>
                • <strong>Assessment Admin:</strong> Access to assessment management only
              </small>
            </div>
            <div className="setting-item">
              <label>Full Name</label>
              <input 
                type="text" 
                placeholder="Enter full name (optional)" 
                value={newAccountData.fullName}
                onChange={(e) => handleNewAccountInputChange('fullName', e.target.value)}
              />
            </div>
            <button 
              className="settings-btn create-account-btn"
              onClick={handleCreateAccount}
              type="button"
            >
              Create Account
            </button>
          </div>
        )}

        {currentUserAuthority === 'super_admin' && (
          <div className="settings-card admin-management">
            <h3>Admin User Management</h3>
            <p className="settings-description">Manage all admin accounts, their permissions, and access levels</p>
          
          <div className="admin-stats">
            <div className="admin-stat-item">
              <span className="stat-number">{adminUsers.filter(user => user.status === 'active').length}</span>
              <span className="stat-label">Active Admins</span>
            </div>
            <div className="admin-stat-item">
              <span className="stat-number">{adminUsers.filter(user => user.status === 'disabled').length}</span>
              <span className="stat-label">Disabled</span>
            </div>
            <div className="admin-stat-item">
              <span className="stat-number">{adminUsers.filter(user => user.authorityLevel === 'super_admin').length}</span>
              <span className="stat-label">Super Admins</span>
            </div>
          </div>

          <div className="admin-table-container">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Username</th>
                  <th>Authority Level</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((admin, index) => (
                  <tr key={admin._id} className={admin.status === 'disabled' ? 'disabled-admin' : ''}>
                    <td>{index + 1}</td>
                    <td className="username-cell">
                      <span 
                        className="clickable-username" 
                        onClick={() => handleEditAdmin(admin)}
                        title="Click to view/edit admin details"
                      >
                        {admin.username}
                      </span>
                    </td>
                    <td>
                      <span className={`authority-badge ${admin.authorityLevel}`}>
                        {getAuthorityLevelDisplay(admin.authorityLevel)}
                      </span>
                    </td>
                    <td>
                      <span 
                        className="admin-status-badge"
                        style={{ backgroundColor: getAdminStatusColor(admin.status) }}
                      >
                        {admin.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="last-login-cell">
                      {admin.lastLogin ? new Date(admin.lastLogin).toLocaleDateString('en-MY', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'Never'}
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button 
                          onClick={() => handleEditAdmin(admin)}
                          className="admin-action-btn edit-btn"
                          title="Edit Admin"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleToggleAdminStatus(admin._id, admin.status)}
                          className={`admin-action-btn ${admin.status === 'active' ? 'disable-btn' : 'enable-btn'}`}
                          title={admin.status === 'active' ? 'Disable Admin' : 'Enable Admin'}
                        >
                          {admin.status === 'active' ? 'Disable' : 'Enable'}
                        </button>
                        <button 
                          onClick={() => handleResetPassword(admin._id)}
                          className="admin-action-btn reset-btn"
                          title="Reset Password"
                        >
                          Reset Pwd
                        </button>
                        <button 
                          onClick={() => handleDeleteAdmin(admin._id, admin.username)}
                          className="admin-action-btn delete-btn"
                          title="Delete Admin"
                          disabled={admin.authorityLevel === 'super_admin'}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        <div className="settings-card">
          <h3>System Settings</h3>
          <div className="setting-item">
            <label>Auto-Archive Applications</label>
            <select>
              <option>After 30 days</option>
              <option>After 60 days</option>
              <option>After 90 days</option>
              <option>Never</option>
            </select>
          </div>
          <div className="setting-item">
            <label>Default Application Status</label>
            <select>
              <option>Pending Review</option>
              <option>Under Review</option>
            </select>
          </div>
          <button className="settings-btn">Save Settings</button>
        </div>

        <div className="settings-card">
          <h3>Export Settings</h3>
          <div className="setting-item">
            <label>Data Type</label>
            <select 
              value={exportSettings.dataType}
              onChange={(e) => handleExportSettingChange('dataType', e.target.value)}
            >
              <option value="applications">Tournament Applications</option>
              <option value="organizations">Registered Organizations</option>
              {currentUserAuthority === 'super_admin' && (
                <option value="admins">Admin Users</option>
              )}
            </select>
          </div>
          <div className="setting-item">
            <label>Export Format</label>
            <select 
              value={exportSettings.format}
              onChange={(e) => handleExportSettingChange('format', e.target.value)}
            >
              <option value="csv">CSV (.csv)</option>
              <option value="excel">Excel (.xlsx)</option>
              <option value="json">JSON (.json)</option>
            </select>
          </div>
          <div className="setting-item">
            <label>Include Archived</label>
            <input 
              type="checkbox" 
              checked={exportSettings.includeArchived}
              onChange={(e) => handleExportSettingChange('includeArchived', e.target.checked)}
            />
            <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '5px' }}>
              Include archived/rejected items in export
            </small>
          </div>
          <button 
            className="settings-btn"
            onClick={handleExportData}
            disabled={exportSettings.isExporting}
            style={{ 
              opacity: exportSettings.isExporting ? 0.6 : 1,
              cursor: exportSettings.isExporting ? 'not-allowed' : 'pointer'
            }}
          >
            {exportSettings.isExporting ? 'Exporting...' : 'Export Data'}
          </button>
        </div>

        <div className="settings-card danger">
          <h3>Danger Zone</h3>
          <div className="setting-item">
            <label>Clear All Applications</label>
            <p className="danger-text">This action cannot be undone</p>
            <button className="danger-btn">Clear All Data</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAssessmentManagement = () => {
    // Show security notice modal before saving
    const handleSaveForm = () => {
      // Validate form first
      if (!assessmentTitle.trim() || assessmentQuestions.length === 0) {
        alert('Please provide an assessment title and at least one question.');
        return;
      }

      // Show security notice modal
      setShowSecurityNoticeModal(true);
    };

    // Draft management functions
    const loadDraftIntoForm = (draft) => {
      console.log('Loading draft into form:', draft);

      // Set all form fields from the draft
      setAssessmentTitle(draft.title || '');
      setAssessmentTitleMalay(draft.titleMalay || '');
      setAssessmentSubtitle(draft.subtitle || '');
      setAssessmentSubtitleMalay(draft.subtitleMalay || '');
      setAssessmentQuestions(draft.questions || []);
      setAssessmentTimeLimit(draft.timeLimit || 30);
      setPassingScore(draft.passingScore || 70);

      // Set this as the current draft being edited
      setCurrentDraftId(draft._id);

      console.log('Draft loaded successfully');
    };

    const deleteDraft = async (draftId) => {
      try {
        await apiService.deleteAssessmentForm(draftId);

        // Remove from saved forms list
        setSavedAssessmentForms(prev => prev.filter(form => form._id !== draftId));

        // If this was the current draft, clear it
        if (currentDraftId === draftId) {
          clearCurrentDraft();
        }

        alert('Draft deleted successfully');
      } catch (error) {
        console.error('Error deleting draft:', error);
        alert('Error deleting draft. Please try again.');
      }
    };

    const clearCurrentDraft = () => {
      console.log('Clearing current draft selection');

      // Clear all form fields
      setAssessmentTitle('');
      setAssessmentTitleMalay('');
      setAssessmentSubtitle('');
      setAssessmentSubtitleMalay('');
      setAssessmentQuestions([]);
      setAssessmentTimeLimit(30);
      setPassingScore(70);

      // Clear current draft ID
      setCurrentDraftId(null);

      console.log('Form cleared for new assessment');
    };

    const handleSaveDraft = async () => {
      try {
        console.log('Starting draft save process...');

        // Basic validation for draft
        if (!assessmentTitle.trim()) {
          alert('Please provide an assessment title to save as draft.');
          return false;
        }

        const formData = {
          title: assessmentTitle,
          titleMalay: assessmentTitleMalay || '',
          subtitle: assessmentSubtitle || '',
          subtitleMalay: assessmentSubtitleMalay || '',
          questions: assessmentQuestions,
          timeLimit: assessmentTimeLimit,
          passingScore: passingScore,
          isDraft: true // Mark as draft
        };

        console.log('Form data for draft:', formData);

        let savedForm;
        if (currentDraftId) {
          // Update existing draft
          console.log('Updating existing draft with ID:', currentDraftId);
          savedForm = await apiService.updateAssessmentForm(currentDraftId, formData);
          console.log('Updated draft:', savedForm);

          if (savedForm && savedForm.data) {
            // Update the form in the saved forms list
            setSavedAssessmentForms(prev =>
              prev.map(form => form._id === currentDraftId ? savedForm.data : form)
            );
          }
        } else {
          // Create new draft
          console.log('Creating new draft');
          savedForm = await apiService.saveAssessmentForm(formData);
          console.log('Saved draft:', savedForm);

          if (savedForm && savedForm.data) {
            // Set the current draft ID for future updates
            setCurrentDraftId(savedForm.data._id);

            // Add to saved forms list
            setSavedAssessmentForms(prev => [...prev, savedForm.data]);
          }
        }

        if (savedForm && savedForm.success && savedForm.data) {
          console.log('Draft saved successfully');
          alert('Draft saved successfully! You can continue editing in Assessment Management.');
          // Keep the form in Assessment Management for continued editing
          // Don't clear the form fields so user can continue working
          return true;
        }

        return false;
      } catch (error) {
        console.error('Error saving draft:', error);
        alert('Error saving draft. Please try again.');
        return false;
      }
    };

    return (
      <div className="assessment-management-view">
        <div className="dashboard-header">
          <h2>Assessment Management</h2>
          <p className="dashboard-subtitle">Manage assessment questions, forms, and submissions</p>
        </div>

        {/* Draft Selection Section */}
        <div className="draft-selection-section" style={{ marginBottom: '20px', backgroundColor: 'rgba(0, 123, 255, 0.05)', border: '1px solid rgba(0, 123, 255, 0.2)', borderRadius: '8px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#007bff' }}>Continue Working on Draft</h3>
          {savedAssessmentForms.filter(form => form.isDraft).length === 0 ? (
            <p style={{ margin: 0, color: '#666', fontStyle: 'italic' }}>No drafts available. Create a new assessment form below.</p>
          ) : (
            <div>
              <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>
                Select a draft to continue editing:
              </p>
              <div style={{ display: 'grid', gap: '10px' }}>
                {savedAssessmentForms.filter(form => form.isDraft).map((draft) => (
                  <div key={draft._id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 15px',
                    backgroundColor: currentDraftId === draft._id ? 'rgba(0, 123, 255, 0.1)' : 'white',
                    border: currentDraftId === draft._id ? '2px solid #007bff' : '1px solid #dee2e6',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => loadDraftIntoForm(draft)}>
                    <div>
                      <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                        {draft.title} {draft.titleMalay && `(${draft.titleMalay})`}
                        {currentDraftId === draft._id && <span style={{ marginLeft: '8px', color: '#007bff', fontSize: '12px' }}>● Currently editing</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {draft.questions?.length || 0} questions • Created {new Date(draft.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{
                        backgroundColor: '#ffc107',
                        color: '#212529',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>DRAFT</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Are you sure you want to delete the draft "${draft.title}"?`)) {
                            deleteDraft(draft._id);
                          }
                        }}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                        title="Delete draft"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {currentDraftId && (
                <button
                  type="button"
                  onClick={clearCurrentDraft}
                  style={{
                    marginTop: '10px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Clear Selection & Start New Form
                </button>
              )}
            </div>
          )}
        </div>

        <div className="assessment-admin-wrapper">
          <AdminPanel
            questions={assessmentQuestions}
            setQuestions={setAssessmentQuestions}
            timeLimit={assessmentTimeLimit}
            setTimeLimit={setAssessmentTimeLimit}
            assessmentTitle={assessmentTitle}
            setAssessmentTitle={setAssessmentTitle}
            assessmentTitleMalay={assessmentTitleMalay}
            setAssessmentTitleMalay={setAssessmentTitleMalay}
            assessmentSubtitle={assessmentSubtitle}
            setAssessmentSubtitle={setAssessmentSubtitle}
            assessmentSubtitleMalay={assessmentSubtitleMalay}
            setAssessmentSubtitleMalay={setAssessmentSubtitleMalay}
            passingScore={passingScore}
            setPassingScore={setPassingScore}
            submissions={assessmentSubmissions}
            savedForms={savedAssessmentForms}
            onSaveForm={handleSaveForm}
            onSaveDraft={handleSaveDraft}
          />
        </div>
      </div>
    );
  };

  const renderAssessmentList = () => {
    return (
      <div className="assessment-list-view">
        <div className="dashboard-header">
          <h2>Assessment List</h2>
          <p className="dashboard-subtitle">View and manage all assessment submissions and user performance</p>
        </div>

        <form className="tournament-form">

          {/* Assessment Submissions List */}
          <div className="form-section" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>All Assessment Submissions ({assessmentSubmissions.length})</h3>
              {assessmentSubmissions.length > 0 && (
                <button
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    if (window.confirm('Are you sure you want to clear all assessment submissions? This action cannot be undone.')) {
                      try {
                        const response = await apiService.clearAllAssessmentSubmissions();
                        setAssessmentSubmissions([]);
                        alert(`Successfully cleared ${response.deletedCount || 0} assessment submissions.`);
                      } catch (error) {
                        console.error('Error clearing submissions:', error);
                        alert('Error clearing submissions. Please try again.');
                      }
                    }
                  }}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Clear All Submissions
                </button>
              )}
            </div>
            {assessmentSubmissions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(0, 0, 0, 0.5)' }}>
                <p>No assessment submissions yet.</p>
                <p style={{ fontSize: '14px', marginTop: '10px' }}>Submissions will appear here once users complete assessments.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', marginTop: '20px' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#495057',
                        borderBottom: '2px solid #dee2e6',
                        fontSize: '14px'
                      }}>#</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#495057',
                        borderBottom: '2px solid #dee2e6',
                        fontSize: '14px'
                      }}>Name</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#495057',
                        borderBottom: '2px solid #dee2e6',
                        fontSize: '14px'
                      }}>IC Number</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#495057',
                        borderBottom: '2px solid #dee2e6',
                        fontSize: '14px'
                      }}>Score</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#495057',
                        borderBottom: '2px solid #dee2e6',
                        fontSize: '14px'
                      }}>Percentage</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#495057',
                        borderBottom: '2px solid #dee2e6',
                        fontSize: '14px'
                      }}>Date</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#495057',
                        borderBottom: '2px solid #dee2e6',
                        fontSize: '14px'
                      }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessmentSubmissions.map((submission, index) => (
                      <tr
                        key={submission.id}
                        onClick={() => openSubmissionDetails(submission)}
                        style={{
                          borderBottom: '1px solid #dee2e6',
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: '#f8f9fa' }
                        }}
                        title="Click to view submission details"
                      >
                        <td style={{
                          padding: '12px 16px',
                          fontSize: '14px',
                          color: '#495057',
                          fontWeight: '500'
                        }}>
                          {index + 1}
                        </td>
                        <td style={{
                          padding: '12px 16px',
                          fontSize: '14px',
                          color: '#212529',
                          fontWeight: '500'
                        }}>
                          {submission.userInfo?.fullName || 'Unknown User'}
                        </td>
                        <td style={{
                          padding: '12px 16px',
                          fontSize: '14px',
                          color: '#495057'
                        }}>
                          {submission.userInfo?.icNumber || 'N/A'}
                        </td>
                        <td style={{
                          padding: '12px 16px',
                          fontSize: '14px',
                          color: '#495057',
                          textAlign: 'center',
                          fontWeight: '500'
                        }}>
                          {submission.results?.score || 0}/{submission.results?.totalQuestions || 0}
                        </td>
                        <td style={{
                          padding: '12px 16px',
                          fontSize: '14px',
                          textAlign: 'center',
                          fontWeight: '600',
                          color: submission.results?.percentage >= 70 ? '#28a745' : '#dc3545'
                        }}>
                          {submission.results?.percentage || 0}%
                        </td>
                        <td style={{
                          padding: '12px 16px',
                          fontSize: '14px',
                          color: '#495057',
                          textAlign: 'center'
                        }}>
                          {submission.completedAt ? new Date(submission.completedAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td style={{
                          padding: '12px 16px',
                          textAlign: 'center'
                        }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            backgroundColor: (submission.results?.percentage >= 70) ? '#d4edda' : '#f8d7da',
                            color: (submission.results?.percentage >= 70) ? '#155724' : '#721c24',
                            border: `1px solid ${(submission.results?.percentage >= 70) ? '#c3e6cb' : '#f5c6cb'}`
                          }}>
                            {(submission.results?.percentage >= 70) ? 'PASS' : 'FAIL'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </form>
      </div>
    );
  };

  const renderAssessmentStatistics = () => {

    return (
      <div className="assessment-statistics-view">
        <div className="dashboard-header">
          <h2>Assessment Statistics</h2>
          <p className="dashboard-subtitle">View detailed statistics and analytics for assessments</p>
        </div>

        <form className="tournament-form">


          {/* Date Filter Section */}
          <div className="form-section" style={{ padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '20px' }}>Batch Filter</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={dateFilterEnabled}
                  onChange={handleDateFilterToggle}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                  Filter batches from specific date
                </span>
              </label>

              {dateFilterEnabled && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 'bold' }}>From Date:</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: '2px solid #000',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              )}

              {dateFilterEnabled && selectedDate && (
                <div style={{
                  backgroundColor: '#e8f4f8',
                  border: '2px solid #007bff',
                  borderRadius: '8px',
                  padding: '10px 15px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#007bff'
                }}>
                  Showing {getTotalBatchesFromDate()} batches from {new Date(selectedDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {/* Assessment Results - Organized by Batch */}
          <div className="form-section" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Assessment Results ({assessmentBatches.reduce((acc, batch) => acc + batch.submissionCount, 0)} total submissions)</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                {assessmentBatches.length > 0 && (
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault();
                      if (window.confirm('Are you sure you want to clear all assessment submissions from the database? This action cannot be undone.')) {
                        try {
                          const response = await apiService.clearAllAssessmentSubmissions();
                          console.log('Clear submissions response:', response);
                          setAssessmentBatches([]);
                          alert(`Successfully cleared ${response.deletedCount || 0} assessment submissions from the database.`);
                        } catch (error) {
                          console.error('Error clearing submissions:', error);
                          const errorMessage = error.message || 'Unknown error occurred';
                          alert(`Error clearing submissions: ${errorMessage}. Please check the console for more details and try again.`);
                        }
                      }
                    }}
                    style={{
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Clear All Submissions
                  </button>
                )}
                <button
                  type="button"
                  onClick={loadAssessmentResults}
                  className="home-btn"
                  disabled={isLoadingResults}
                  style={{ padding: '8px 16px', fontSize: '14px', marginRight: '10px' }}
                >
                  {isLoadingResults ? 'Loading...' : 'Refresh'}
                </button>
                <button
                  type="button"
                  onClick={downloadAssessmentResultsPDF}
                  className="home-btn"
                  disabled={isLoadingResults || assessmentBatches.length === 0}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    backgroundColor: '#28a745',
                    borderColor: '#28a745'
                  }}
                  title="Download all assessment results as PDF"
                >
                  📄 Download PDF
                </button>
              </div>
            </div>

            {isLoadingResults ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(0, 0, 0, 0.5)' }}>
                <p>Loading assessment results...</p>
              </div>
            ) : assessmentBatches.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(0, 0, 0, 0.5)' }}>
                <p>{dateFilterEnabled && selectedDate ? `No assessment batches found from ${new Date(selectedDate).toLocaleDateString()}` : 'No assessment submissions yet.'}</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '20px' }}>
                {assessmentBatches.map((batch) => (
                  <div key={batch._id} style={{
                    background: '#f8f8f8',
                    border: '2px solid #000',
                    borderRadius: '12px',
                    padding: '20px'
                  }}>
                    {/* Batch Header - Folder Style */}
                    <div
                      onClick={() => toggleBatchCollapse(batch._id)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '15px',
                        paddingBottom: '15px',
                        borderBottom: '1px solid #000',
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'background-color 0.2s',
                        padding: '10px',
                        borderRadius: '8px',
                        backgroundColor: collapsedBatches.has(batch._id) ? '#f0f0f0' : 'transparent'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = collapsedBatches.has(batch._id) ? '#f0f0f0' : 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          fontSize: '18px',
                          color: '#f39c12',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px'
                        }}>
                          {collapsedBatches.has(batch._id) ? '📂' : '📁'}
                        </div>
                        <div>
                          <h4 style={{ margin: '0 0 5px 0', color: '#000', fontSize: '18px', fontWeight: 'bold' }}>
                            {batch._id}
                          </h4>
                          <div style={{ color: '#666', fontSize: '14px' }}>
                            Form: {batch.formCode} • Date: {batch.batchDate} • {batch.submissionCount} participants
                          </div>
                          {batch.formTitle && (
                            <div style={{ color: '#000', fontSize: '13px', fontStyle: 'italic', marginTop: '2px' }}>
                              "{batch.formTitle}"
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#000', fontWeight: 'bold', fontSize: '16px' }}>
                          Avg: {Math.round(batch.averageScore)}%
                        </div>
                        <div style={{ color: '#666', fontSize: '12px' }}>
                          {batch.submissions.filter(s => s.score >= 70).length} passed / {batch.submissionCount} total
                        </div>
                        <div style={{ color: '#999', fontSize: '11px', marginTop: '4px' }}>
                          {collapsedBatches.has(batch._id) ? 'Click to expand' : 'Click to collapse'}
                        </div>
                      </div>
                    </div>

                    {/* Batch Submissions */}
                    {!collapsedBatches.has(batch._id) && (
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {batch.submissions.map((submission) => (
                        <div
                          key={submission._id}
                          onClick={() => openSubmissionDetails(submission)}
                          style={{
                            background: 'white',
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            borderRadius: '8px',
                            padding: '15px',
                            display: 'grid',
                            gridTemplateColumns: '2fr 1fr 1fr 100px 120px',
                            gap: '15px',
                            alignItems: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          title="Click to view submission details"
                        >
                          <div>
                            <div style={{ color: '#333', fontWeight: 'bold', fontSize: '16px', marginBottom: '2px' }}>
                              {submission.participantName}
                            </div>
                            <div style={{ color: '#666', fontSize: '13px' }}>
                              ID: {submission.submissionId}
                            </div>
                            <div style={{ color: '#666', fontSize: '12px' }}>
                              {new Date(submission.completedAt).toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', color: '#333' }}>
                              <strong>{submission.correctAnswers}/{submission.totalQuestions}</strong>
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              Time: {Math.floor(submission.timeSpent / 60)}m {submission.timeSpent % 60}s
                            </div>
                          </div>
                          <div>
                            <span style={{
                              background: submission.score >= 70 ? '#000' : '#fff',
                              color: submission.score >= 70 ? '#fff' : '#000',
                              border: '1px solid #000',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>
                              {submission.score >= 70 ? 'PASSED' : 'FAILED'}
                            </span>
                          </div>
                          <div style={{
                            background: submission.score >= 70 ? '#000' : '#fff',
                            color: submission.score >= 70 ? '#fff' : '#000',
                            border: '2px solid #000',
                            padding: '10px 12px',
                            borderRadius: '20px',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            textAlign: 'center'
                          }}>
                            {`${submission.score}%`}
                          </div>
                          <div>
                            {/* No manual review needed - all scoring is automatic */}
                          </div>
                        </div>
                      ))}
                    </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </div>
    );
  };

  const renderSavedForms = () => {

    return (
      <div className="saved-forms-view">
        <div className="dashboard-header">
          <h2>Saved Assessment Forms</h2>
          <p className="dashboard-subtitle">Manage and view all saved assessment forms with their codes</p>
        </div>

        <form className="tournament-form">
          {/* Saved Forms Section */}
          <div className="form-section" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>All Saved Forms ({savedAssessmentForms.filter(form => !form.isTemporary).length})</h3>
              <button
                type="button"
                onClick={openTempCodesListModal}
                style={{
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                title="View and manage all generated temporary codes"
              >
                📋 Manage Temporary Codes
              </button>
            </div>
            {savedAssessmentForms.filter(form => !form.isTemporary).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(0, 0, 0, 0.5)' }}>
                <p style={{ fontSize: '18px', marginBottom: '8px' }}>No saved forms yet</p>
                <p style={{ fontSize: '14px' }}>Create and save assessment forms in the "Manage Questions" section</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {savedAssessmentForms.filter(form => !form.isTemporary).map((form) => (
                  <div key={form.code} style={{
                    background: 'rgba(0, 0, 0, 0.02)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    padding: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                        <div style={{ color: '#333', fontWeight: 'bold', fontSize: '18px' }}>
                          {form.title || 'Untitled Assessment'}
                        </div>
                        <span style={{
                          backgroundColor: form.active !== false ? '#d4edda' : '#f8d7da',
                          color: form.active !== false ? '#155724' : '#721c24',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                          border: `1px solid ${form.active !== false ? '#c3e6cb' : '#f5c6cb'}`
                        }}>
                          {form.active !== false ? 'ENABLED' : 'DISABLED'}
                        </span>
                      </div>
                      <div style={{ color: '#28a745', fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>
                        Code: {form.code}
                      </div>
                      <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                        {form.questions.length} questions • {form.timeLimit} minutes • Created: {new Date(form.createdAt).toLocaleDateString()}
                      </div>
                      {form.questions.length > 0 && (
                        <div style={{ color: '#666', fontSize: '12px' }}>
                          Sections: {[...new Set(form.questions.map(q => q.section))].join(', ')}
                        </div>
                      )}
                      {form.active === false && (
                        <div style={{ color: '#dc3545', fontSize: '12px', fontStyle: 'italic', marginTop: '5px' }}>
                          ⚠️ This form is disabled and cannot be accessed by users
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        color: '#6c757d'
                      }}>
                        Share this code with users to take the assessment
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const action = form.active !== false ? 'disable' : 'enable';
                          if (window.confirm(`Are you sure you want to ${action} this assessment form?\n\n${action === 'disable' ? 'Users will not be able to access this form when disabled.' : 'Users will be able to access this form when enabled.'}`)) {
                            const updatedForms = savedAssessmentForms.map(f =>
                              f.code === form.code ? { ...f, active: form.active === false } : f
                            );
                            setSavedAssessmentForms(updatedForms);
                            alert(`Assessment form "${form.title}" has been ${action}d successfully.`);
                          }
                        }}
                        style={{
                          padding: '8px 16px',
                          fontSize: '14px',
                          backgroundColor: form.active !== false ? '#ffc107' : '#28a745',
                          color: form.active !== false ? '#212529' : 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          marginRight: '10px',
                          fontWeight: 'bold'
                        }}
                      >
                        {form.active !== false ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditFormModal(form)}
                        className="edit-btn"
                        style={{
                          padding: '8px 16px',
                          fontSize: '14px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          marginRight: '10px'
                        }}
                      >
                        Edit Form
                      </button>
                      <button
                        type="button"
                        onClick={() => generateTempCode(form)}
                        style={{
                          padding: '8px 16px',
                          fontSize: '14px',
                          backgroundColor: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          marginRight: '10px',
                          fontWeight: 'bold'
                        }}
                        title="Generate 24-hour temporary assessment code"
                      >
                        Generate Temp Code
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(form.code);
                          alert('Assessment code copied to clipboard!');
                        }}
                        className="view-btn-table"
                        style={{ padding: '8px 16px', fontSize: '14px', marginRight: '10px' }}
                      >
                        Copy Code
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteAssessmentForm(form)}
                        style={{
                          padding: '8px 16px',
                          fontSize: '14px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                        title="Delete this assessment form permanently"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-sidebar">
        <div className="sidebar-nav">
          {hasAccessTo('dashboard') && (
            <button
              className={`sidebar-nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentView('dashboard')}
              style={{
                fontSize: '16px',
                fontWeight: '500',
                padding: '12px 20px',
                color: '#fff',
                backgroundColor: 'transparent',
                border: 'none',
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              Dashboard
            </button>
          )}

          {hasAccessTo('calendar') && (
            <button
              className={`sidebar-nav-item ${currentView === 'calendar' ? 'active' : ''}`}
              onClick={() => setCurrentView('calendar')}
              style={{
                fontSize: '16px',
                fontWeight: '500',
                padding: '12px 20px',
                color: '#fff',
                backgroundColor: 'transparent',
                border: 'none',
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              Calendar
            </button>
          )}
          
          {/* Create Tournament with Sub-options */}
          {hasAccessTo('tournaments') && (
            <div className="sidebar-nav-group">
            <button
              className={`sidebar-nav-item ${currentView === 'create-tournament' || currentView === 'edit-tournament' ? 'active' : ''}`}
              onClick={() => {
                setCreateTournamentExpanded(!createTournamentExpanded);
                if (!createTournamentExpanded) {
                  setCurrentView('create-tournament');
                }
              }}
              style={{
                fontSize: '16px',
                fontWeight: '500',
                padding: '12px 20px',
                color: '#fff',
                backgroundColor: 'transparent',
                border: 'none',
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>Create Tournament</span>
              <span style={{
                fontSize: '12px',
                transition: 'transform 0.2s ease',
                transform: createTournamentExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
              }}>
                ▼
              </span>
            </button>
            
            {createTournamentExpanded && (
              <div className="sidebar-sub-menu" style={{ marginLeft: '20px' }}>
                <button
                  className={`sidebar-nav-item sub-item ${currentView === 'create-tournament' ? 'active' : ''}`}
                  onClick={() => setCurrentView('create-tournament')}
                  style={{
                    fontSize: '14px',
                    fontWeight: '400',
                    padding: '10px 15px',
                    color: '#fff',
                    backgroundColor: 'transparent',
                    border: 'none',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  New Tournament
                </button>
                <button
                  className={`sidebar-nav-item sub-item ${currentView === 'edit-tournament' ? 'active' : ''}`}
                  onClick={() => setCurrentView('edit-tournament')}
                  style={{
                    fontSize: '14px',
                    fontWeight: '400',
                    padding: '10px 15px',
                    color: '#fff',
                    backgroundColor: 'transparent',
                    border: 'none',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  Edit Tournament
                </button>
              </div>
            )}
          </div>
          )}
          
          {hasAccessTo('applications') && (
            <button
              className={`sidebar-nav-item ${currentView === 'applications' ? 'active' : ''}`}
              onClick={() => setCurrentView('applications')}
              style={{
                fontSize: '16px',
                fontWeight: '500',
                padding: '12px 20px',
                color: '#fff',
                backgroundColor: 'transparent',
                border: 'none',
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              Applications
            </button>
          )}

          {hasAccessTo('organizations') && (
            <button
              className={`sidebar-nav-item ${currentView === 'registered-organizations' ? 'active' : ''}`}
              onClick={() => setCurrentView('registered-organizations')}
              style={{
                fontSize: '16px',
                fontWeight: '500',
                padding: '12px 20px',
                color: '#fff',
                backgroundColor: 'transparent',
                border: 'none',
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              Registered Organizations
            </button>
          )}

          {hasAccessTo('analytics') && (
            <button
              className={`sidebar-nav-item ${currentView === 'analytics' ? 'active' : ''}`}
              onClick={() => setCurrentView('analytics')}
              style={{
                fontSize: '16px',
                fontWeight: '500',
                padding: '12px 20px',
                color: '#fff',
                backgroundColor: 'transparent',
                border: 'none',
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              Analytics
            </button>
          )}

          {hasAccessTo('notices') && (
            <button
              className={`sidebar-nav-item ${currentView === 'notice-management' ? 'active' : ''}`}
              onClick={() => setCurrentView('notice-management')}
              style={{
                fontSize: '16px',
                fontWeight: '500',
                padding: '12px 20px',
                color: '#fff',
                backgroundColor: 'transparent',
                border: 'none',
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              Notice Management
            </button>
          )}
          {/* Assessment Management with Sub-options */}
          {hasAccessTo('assessments') && (
            <div className="sidebar-nav-group">
            <button
              className={`sidebar-nav-item ${currentView === 'assessment-management' || currentView === 'assessment-list' || currentView === 'assessment-statistics' || currentView === 'saved-forms' ? 'active' : ''}`}
              onClick={() => {
                setAssessmentManagementExpanded(!assessmentManagementExpanded);
                if (!assessmentManagementExpanded) {
                  setCurrentView('assessment-management');
                }
              }}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'transparent',
                border: 'none',
                color: currentView === 'assessment-management' || currentView === 'assessment-list' || currentView === 'assessment-statistics' || currentView === 'saved-forms' ? '#fff' : '#ccc',
                cursor: 'pointer',
                padding: '12px 20px',
                width: '100%',
                textAlign: 'left',
                fontSize: '16px',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              <span style={{ flex: 1, minWidth: 0 }}>Assessment Management</span>
              <span style={{
                transform: assessmentManagementExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease',
                fontSize: '12px',
                marginLeft: '8px',
                flexShrink: 0
              }}>
                ▼
              </span>
            </button>

            {assessmentManagementExpanded && (
              <div className="sidebar-sub-menu" style={{ marginLeft: '20px' }}>
                <button
                  className={`sidebar-nav-item sub-item ${currentView === 'assessment-management' ? 'active' : ''}`}
                  onClick={() => setCurrentView('assessment-management')}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: currentView === 'assessment-management' ? '#fff' : '#ccc',
                    cursor: 'pointer',
                    padding: '10px 20px',
                    width: '100%',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '400',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Manage Questions
                </button>
                <button
                  className={`sidebar-nav-item sub-item ${currentView === 'assessment-list' ? 'active' : ''}`}
                  onClick={() => setCurrentView('assessment-list')}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: currentView === 'assessment-list' ? '#fff' : '#ccc',
                    cursor: 'pointer',
                    padding: '10px 20px',
                    width: '100%',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '400',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Assessment List
                </button>
                <button
                  className={`sidebar-nav-item sub-item ${currentView === 'assessment-statistics' ? 'active' : ''}`}
                  onClick={() => setCurrentView('assessment-statistics')}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: currentView === 'assessment-statistics' ? '#fff' : '#ccc',
                    cursor: 'pointer',
                    padding: '10px 20px',
                    width: '100%',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '400',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Statistics
                </button>
                <button
                  className={`sidebar-nav-item sub-item ${currentView === 'saved-forms' ? 'active' : ''}`}
                  onClick={() => setCurrentView('saved-forms')}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: currentView === 'saved-forms' ? '#fff' : '#ccc',
                    cursor: 'pointer',
                    padding: '10px 20px',
                    width: '100%',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '400',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>Saved Forms</span>
                  <span style={{
                    backgroundColor: '#007bff',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '2px 6px',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>
                    {savedAssessmentForms.length}
                  </span>
                </button>
              </div>
            )}
          </div>
          )}
          {hasAccessTo('settings') && (
            <button
              className={`sidebar-nav-item ${currentView === 'settings' ? 'active' : ''}`}
              onClick={() => setCurrentView('settings')}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: currentView === 'settings' ? '#fff' : '#ccc',
              cursor: 'pointer',
              padding: '12px 20px',
              width: '100%',
              textAlign: 'left',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
          >
Settings
          </button>
          )}
        </div>
      </div>

      <div className="dashboard-content">
        {currentView === 'dashboard' && (
          <>
            <div className="dashboard-header">
              <h2>Admin Dashboard</h2>
              <p className="dashboard-subtitle">Manage tournament applications by status</p>
            </div>

            <div className="dashboard-stats">
              <div className="stat-card">
                <div className="stat-number">{applications.length}</div>
                <div className="stat-label">Total Applications</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{applications.filter(app => app.status === 'Pending Review').length}</div>
                <div className="stat-label">Pending Review</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{applications.filter(app => app.status === 'Under Review').length}</div>
                <div className="stat-label">Under Review</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{applications.filter(app => app.status === 'Approved').length}</div>
                <div className="stat-label">Approved</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{applications.filter(app => app.status === 'Rejected').length}</div>
                <div className="stat-label">Rejected</div>
              </div>
            </div>

            {error && (
              <div className="error-message" style={{ 
                color: '#d32f2f', 
                backgroundColor: '#ffebee', 
                padding: '15px', 
                borderRadius: '4px', 
                marginBottom: '20px',
                border: '1px solid #ffcdd2' 
              }}>
                {error}
                <button 
                  onClick={loadApplications} 
                  style={{ marginLeft: '10px', padding: '5px 10px' }}
                >
                  Retry
                </button>
              </div>
            )}

            {isLoading ? (
              <div className="loading-message" style={{ textAlign: 'center', padding: '20px' }}>
                <p>Loading applications...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="no-applications">
                <p>No applications found.</p>
                <p>Applications will appear here once users submit tournament applications.</p>
              </div>
            ) : (
              <div className="status-columns-container">
                {/* Pending Review Column */}
                <div className="status-column">
                  <h3 className="status-column-header pending">
                    Pending Review ({applications.filter(app => app.status === 'Pending Review').length})
                  </h3>
                  <div className="status-column-content">
                    {applications.filter(app => app.status === 'Pending Review').length > 0 ? (
                      <div className="tournament-list">
                        {applications.filter(app => app.status === 'Pending Review').map((app, index) => (
                          <div 
                            key={app.applicationId || app.id} 
                            className="tournament-item"
                            onClick={() => showApplicationDetails(app)}
                            title="Click to view details"
                          >
                            <span className="tournament-number">{index + 1}.</span>
                            {app.eventTitle || 'No Event Title'}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-column">No pending applications</div>
                    )}
                  </div>
                </div>

                {/* Under Review Column */}
                <div className="status-column">
                  <h3 className="status-column-header under-review">
                    Under Review ({applications.filter(app => app.status === 'Under Review').length})
                  </h3>
                  <div className="status-column-content">
                    {applications.filter(app => app.status === 'Under Review').length > 0 ? (
                      <div className="tournament-list">
                        {applications.filter(app => app.status === 'Under Review').map((app, index) => (
                          <div 
                            key={app.applicationId || app.id} 
                            className="tournament-item"
                            onClick={() => showApplicationDetails(app)}
                            title="Click to view details"
                          >
                            <span className="tournament-number">{index + 1}.</span>
                            {app.eventTitle || 'No Event Title'}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-column">No applications under review</div>
                    )}
                  </div>
                </div>

                {/* Approved Column */}
                <div className="status-column">
                  <h3 className="status-column-header approved">
                    Approved ({applications.filter(app => app.status === 'Approved').length})
                  </h3>
                  <div className="status-column-content">
                    {applications.filter(app => app.status === 'Approved').length > 0 ? (
                      <div className="tournament-list">
                        {applications.filter(app => app.status === 'Approved').map((app, index) => (
                          <div 
                            key={app.applicationId || app.id} 
                            className="tournament-item"
                            onClick={() => showApplicationDetails(app)}
                            title="Click to view details"
                          >
                            <span className="tournament-number">{index + 1}.</span>
                            {app.eventTitle || 'No Event Title'}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-column">No approved applications</div>
                    )}
                  </div>
                </div>

                {/* Rejected Column */}
                <div className="status-column rejected">
                  <h3 className="status-column-header rejected">
                    Rejected ({applications.filter(app => app.status === 'Rejected').length})
                  </h3>
                  <div className="status-column-content">
                    {applications.filter(app => app.status === 'Rejected').length > 0 ? (
                      <div className="tournament-list">
                        {applications.filter(app => app.status === 'Rejected').map((app, index) => (
                          <div 
                            key={app.applicationId || app.id} 
                            className="tournament-item"
                            onClick={() => showApplicationDetails(app)}
                            title="Click to view details"
                          >
                            <span className="tournament-number">{index + 1}.</span>
                            {app.eventTitle || 'No Event Title'}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-column">No rejected applications</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tournament Updates Card Section */}
            <div 
              className="tournament-updates-card"
              style={{
                backgroundColor: 'white',
                border: '1px solid #e9ecef',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                margin: '20px 0',
                overflow: 'hidden'
              }}
            >
              <div 
                className="updates-card-body"
                style={{
                  padding: '20px'
                }}
              >
                <div 
                  className="updates-header-content"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                  }}
                >
                  <div 
                    className="updates-title"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <h3 style={{ margin: '0', color: '#2c3e50', fontSize: '18px' }}>Notice: Tournament Updates</h3>
                    <span 
                      className="updates-count"
                      style={{
                        backgroundColor: '#007bff',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      {tournamentUpdates.length} update{tournamentUpdates.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <button 
                    className="refresh-updates-btn-header"
                    onClick={loadTournamentUpdates}
                    disabled={isLoadingUpdates}
                    title="Refresh updates"
                    style={{
                      backgroundColor: isLoadingUpdates ? '#f8f9fa' : '#007bff',
                      color: isLoadingUpdates ? '#6c757d' : 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      cursor: isLoadingUpdates ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoadingUpdates) {
                        e.target.style.backgroundColor = '#0056b3';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLoadingUpdates) {
                        e.target.style.backgroundColor = '#007bff';
                      }
                    }}
                  >
                    {isLoadingUpdates ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
                {isLoadingUpdates ? (
                  <div 
                    className="loading-updates-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '40px',
                      color: '#6c757d'
                    }}
                  >
                    <div 
                      className="loading-spinner-card"
                      style={{
                        width: '24px',
                        height: '24px',
                        border: '3px solid #f1f3f4',
                        borderTop: '3px solid #007bff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginBottom: '12px'
                      }}
                    ></div>
                    <span style={{ fontSize: '14px' }}>Loading tournament updates...</span>
                  </div>
                ) : tournamentUpdates.length === 0 ? (
                  <div 
                    className="no-updates-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '40px',
                      textAlign: 'center'
                    }}
                  >
                    <div className="no-updates-text">
                      <p style={{ margin: '0 0 8px 0', color: '#495057', fontSize: '16px', fontWeight: '500' }}>
                        No recent tournament updates
                      </p>
                      <small style={{ color: '#6c757d', fontSize: '14px' }}>
                        Updates will appear here when tournaments are modified
                      </small>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="updates-scrollable-list"
                    style={{
                      maxHeight: '400px',
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      padding: '10px',
                      borderRadius: '8px',
                      backgroundColor: '#f8f9fa'
                    }}
                  >
                    {tournamentUpdates.map((update, index) => (
                      <div 
                        key={update.id} 
                        className={`update-list-item ${update.type}`}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderBottom: index === tournamentUpdates.length - 1 ? 'none' : '1px solid #e9ecef',
                          borderRadius: '0',
                          padding: '15px 5px',
                          marginBottom: '0',
                          boxShadow: 'none',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#f1f3f4';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                        }}
                      >
                        <div className="update-card-content">
                          <div className="update-card-header-row">
                            <div className="update-type-badge">
                              <span className="tournament-name-badge">{update.tournamentName}</span>
                            </div>
                            <span 
                              className="update-timestamp"
                              style={{
                                fontSize: '12px',
                                color: '#6c757d',
                                fontWeight: '500'
                              }}
                            >
                              {update.timestamp.toLocaleDateString('en-MY', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          
                          <div 
                            className="update-description-card"
                            style={{
                              margin: '8px 0',
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#2c3e50'
                            }}
                          >
                            {update.change}
                          </div>
                          
                          <div 
                            className="update-details-card"
                            style={{
                              fontSize: '13px',
                              color: '#6c757d',
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '12px',
                              alignItems: 'center'
                            }}
                          >
                            <span className="organizer-badge">
                              {update.organizerName}
                            </span>
                            {update.details.venue && (
                              <span className="venue-badge">
                                {update.details.venue}
                              </span>
                            )}
                            {update.details.eventDate && (
                              <span className="event-date-badge">
                                {new Date(update.details.eventDate).toLocaleDateString('en-MY', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            )}
                          </div>
                          
                          {update.details.newStatus && (
                            <div 
                              className="status-change-card"
                              style={{
                                marginTop: '10px',
                                padding: '8px 12px',
                                backgroundColor: '#f1f3f4',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '13px'
                              }}
                            >
                              <span style={{ color: '#6c757d' }}>Status:</span>
                              <span style={{ color: '#495057', fontWeight: '500' }}>
                                {update.details.previousStatus}
                              </span>
                              <span style={{ color: '#6c757d' }}>→</span>
                              <span 
                                style={{ 
                                  color: update.details.newStatus === 'Approved' ? '#28a745' : 
                                        update.details.newStatus === 'Rejected' ? '#dc3545' : 
                                        '#007bff',
                                  fontWeight: '600'
                                }}
                              >
                                {update.details.newStatus}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div 
                className="updates-card-footer"
                style={{
                  padding: '12px 20px',
                  borderTop: '1px solid #e9ecef',
                  backgroundColor: '#f8f9fa',
                  borderBottomLeftRadius: '12px',
                  borderBottomRightRadius: '12px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <small 
                  style={{
                    color: '#6c757d',
                    fontSize: '12px',
                    textAlign: 'center'
                  }}
                >
                  Updates are automatically tracked for all tournament changes • Last updated: {new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
                </small>
              </div>
            </div>
          </>
        )}
        
        {currentView === 'calendar' && (
          <>
            <div className="dashboard-header">
              <h2>Tournament Calendar</h2>
            </div>
            
            <div className="calendar-container" style={{ 
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '30px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: '30px',
              minHeight: '600px'
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

                {selectedDateTournaments.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '20px', 
                    color: '#6c757d',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px' 
                  }}>
                    <p style={{ margin: 0 }}>No tournaments on this date</p>
                  </div>
                ) : (
                  <div className="tournaments-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {selectedDateTournaments.map(tournament => (
                      <div key={tournament.applicationId} style={{
                        border: '1px solid #dee2e6',
                        borderRadius: '6px',
                        padding: '15px',
                        marginBottom: '10px',
                        backgroundColor: tournament.status === 'Approved' ? '#d4edda' : 
                                       tournament.status === 'Pending Review' ? '#fff3cd' : '#f8d7da',
                        borderLeft: `4px solid ${
                          tournament.status === 'Approved' ? '#28a745' : 
                          tournament.status === 'Pending Review' ? '#ffc107' : '#dc3545'
                        }`
                      }}>
                        <h5 style={{ margin: '0 0 8px 0', color: '#212529', fontSize: '16px' }}>
                          {tournament.eventTitle}
                        </h5>
                        <p style={{ margin: '0 0 4px 0', color: '#6c757d', fontSize: '13px' }}>
                          <strong>🏢</strong> {tournament.organiserName}
                        </p>
                        <p style={{ margin: '0 0 4px 0', color: '#6c757d', fontSize: '13px' }}>
                          <strong>📍</strong> {tournament.venue}
                        </p>
                        <p style={{ margin: '0 0 8px 0', color: '#6c757d', fontSize: '13px' }}>
                          <strong>📅</strong> {new Date(tournament.eventStartDate).toLocaleDateString()} - {new Date(tournament.eventEndDate).toLocaleDateString()}
                        </p>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '500',
                          backgroundColor: tournament.status === 'Approved' ? '#28a745' : 
                                         tournament.status === 'Pending Review' ? '#ffc107' : '#dc3545',
                          color: 'white'
                        }}>
                          {tournament.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        
        {currentView === 'applications' && (
          <>
            <div className="dashboard-header">
              <h2>Applications Management</h2>
              <p className="dashboard-subtitle">Filter applications by status using the buttons below</p>
            </div>

            {/* Status Filter Buttons */}
            <div className="status-filter-buttons">
              <button 
                className={`status-filter-btn ${selectedStatusFilter === 'Pending Review' ? 'active' : ''}`}
                onClick={() => setSelectedStatusFilter('Pending Review')}
              >
                📁 Pending Review ({applications.filter(app => app.status === 'Pending Review').length})
              </button>
              <button 
                className={`status-filter-btn ${selectedStatusFilter === 'Under Review' ? 'active' : ''}`}
                onClick={() => setSelectedStatusFilter('Under Review')}
              >
                📂 Under Review ({applications.filter(app => app.status === 'Under Review').length})
              </button>
              <button 
                className={`status-filter-btn approved-folder ${selectedStatusFilter === 'ApprovedTournaments' ? 'active' : ''}`}
                onClick={() => setSelectedStatusFilter('ApprovedTournaments')}
                title="Sanctioned tournaments ready for event organization"
              >
                🏆 Approved Tournaments ({approvedTournaments.length})
              </button>
              <button 
                className={`status-filter-btn ${selectedStatusFilter === 'Approved' ? 'active' : ''}`}
                onClick={() => setSelectedStatusFilter('Approved')}
              >
                ✅ Approved ({applications.filter(app => app.status === 'Approved').length})
              </button>
              <button 
                className={`status-filter-btn ${selectedStatusFilter === 'Rejected' ? 'active' : ''}`}
                onClick={() => setSelectedStatusFilter('Rejected')}
              >
                ❌ Rejected ({applications.filter(app => app.status === 'Rejected').length})
              </button>
              <button 
                className={`status-filter-btn ${selectedStatusFilter === 'All' ? 'active' : ''}`}
                onClick={() => setSelectedStatusFilter('All')}
              >
                📋 All Applications ({applications.length})
              </button>
            </div>

            {error && (
              <div className="error-message" style={{ 
                color: '#d32f2f', 
                backgroundColor: '#ffebee', 
                padding: '15px', 
                borderRadius: '4px', 
                marginBottom: '20px',
                border: '1px solid #ffcdd2' 
              }}>
                {error}
                <button 
                  onClick={loadApplications} 
                  style={{ marginLeft: '10px', padding: '5px 10px' }}
                >
                  Retry
                </button>
              </div>
            )}

            {isLoading ? (
              <div className="loading-message" style={{ textAlign: 'center', padding: '20px' }}>
                <p>Loading applications...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="no-applications">
                <p>No applications found.</p>
                <p>Applications will appear here once users submit tournament applications.</p>
              </div>
            ) : (
                <div className="applications-table-container">
                  <table className="applications-table">
                    <thead>
                      <tr>
                        <th>No.</th>
                        <th>Tournament Name</th>
                        <th>ID Number</th>
                        <th>{selectedStatusFilter === 'ApprovedTournaments' ? 'Event Date' : 'Status'}</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedStatusFilter === 'ApprovedTournaments' 
                        ? approvedTournaments 
                        : applications.filter(app => selectedStatusFilter === 'All' || app.status === selectedStatusFilter)
                      ).map((app, index) => {
                          const appId = app.applicationId || app.id;
                          return (
                            <tr key={appId} data-status={app.status}>
                              <td>{index + 1}</td>
                              <td>
                                <span 
                                  className="clickable-link" 
                                  onClick={() => showApplicationDetails(app)}
                                  title="Click to view details"
                                >
                                  {app.eventTitle || 'No Event Title'}
                                </span>
                              </td>
                              <td>
                                <span 
                                  className="clickable-link" 
                                  onClick={() => showApplicationDetails(app)}
                                  title="Click to view details"
                                >
                                  {appId}
                                </span>
                              </td>
                              <td>
                                {selectedStatusFilter === 'ApprovedTournaments' ? (
                                  <span>
                                    {app.eventStartDate ? new Date(app.eventStartDate).toLocaleDateString('en-MY', {
                                      year: 'numeric',
                                      month: 'short', 
                                      day: 'numeric'
                                    }) : 'Date TBA'}
                                    {app.eventEndDate && app.eventStartDate !== app.eventEndDate && (
                                      <> - {new Date(app.eventEndDate).toLocaleDateString('en-MY', {
                                        year: 'numeric',
                                        month: 'short', 
                                        day: 'numeric'
                                      })}</>
                                    )}
                                  </span>
                                ) : (
                                  <span 
                                    className="status-badge-table" 
                                    style={{ backgroundColor: getStatusColor(app.status) }}
                                  >
                                    {app.status}
                                  </span>
                                )}
                              </td>
                              <td>
                                <div className="table-actions">
                                  {selectedStatusFilter === 'ApprovedTournaments' ? (
                                    <>
                                      <button 
                                        onClick={() => showApplicationDetails(app)}
                                        className="view-btn-table"
                                        title="View Tournament Details"
                                      >
                                        View Details
                                      </button>
                                      <span className="sanctioned-badge" title="Officially sanctioned tournament">
                                        ✅ Sanctioned
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <select 
                                        value={app.status} 
                                        onChange={(e) => updateApplicationStatus(appId, e.target.value)}
                                        className="status-select-table"
                                        disabled={app.status === 'Rejected'}
                                      >
                                        <option value="Pending Review">Pending Review</option>
                                        <option value="Under Review">Under Review</option>
                                        <option value="Approved">Approved</option>
                                        <option value="Rejected">Rejected</option>
                                        <option value="More Info Required">More Info Required</option>
                                      </select>
                                      <button 
                                        onClick={() => showApplicationDetails(app)}
                                        className="view-btn-table"
                                        title="View Details"
                                      >
                                        View
                                      </button>
                                      {selectedStatusFilter === 'All' && (
                                        <button 
                                          onClick={() => deleteApplication(appId)}
                                          className="delete-btn-table"
                                          title="Delete Application"
                                        >
                                          Delete
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
            )}
          </>
        )}
        
        {currentView === 'create-tournament' && (
          <div className="create-tournament-view">
            <div className="dashboard-header">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', width: '100%' }}>
                <img src={mpaLogo} alt="Malaysia Pickleball Association" style={{ height: '100px', width: 'auto' }} />
                <div style={{ textAlign: 'center' }}>
                  <h2>Create Tournament</h2>
                  <p className="dashboard-subtitle">Create and directly approve tournament applications</p>
                </div>
              </div>
            </div>

            {!tournamentCreated ? (
              <>
                
                <form onSubmit={handleCreateTournament} className="tournament-form">
                <div className="form-section">
                  <h3>Organiser Information</h3>
                  <div className="form-group">
                    <label htmlFor="organiserName">Organiser Name *</label>
                    <input
                      type="text"
                      id="organiserName"
                      name="organiserName"
                      value={tournamentFormData.organiserName}
                      onChange={handleTournamentInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="registrationNo">PJS/ROS/Company Registration No. *</label>
                    <input
                      type="text"
                      id="registrationNo"
                      name="registrationNo"
                      value={tournamentFormData.registrationNo}
                      onChange={handleTournamentInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="telContact">Tel. Contact *</label>
                    <input
                      type="tel"
                      id="telContact"
                      name="telContact"
                      value={tournamentFormData.telContact}
                      onChange={handleTournamentInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="personInCharge">Person in Charge *</label>
                    <input
                      type="text"
                      id="personInCharge"
                      name="personInCharge"
                      value={tournamentFormData.personInCharge}
                      onChange={handleTournamentInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={tournamentFormData.email}
                      onChange={handleTournamentInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="organisingPartner">Organising Partner (if applicable)</label>
                    <input
                      type="text"
                      id="organisingPartner"
                      name="organisingPartner"
                      value={tournamentFormData.organisingPartner}
                      onChange={handleTournamentInputChange}
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
                      value={tournamentFormData.eventTitle}
                      onChange={handleTournamentInputChange}
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
                        value={tournamentFormData.eventStartDate}
                        onChange={handleTournamentDateChange}
                        className="date-picker-hidden"
                        required
                      />
                      <input
                        type="text"
                        className="date-display-input"
                        value={tournamentFormData.eventStartDateFormatted}
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
                        value={tournamentFormData.eventEndDate}
                        onChange={handleTournamentDateChange}
                        min={tournamentFormData.eventStartDate}
                        className="date-picker-hidden"
                        required
                      />
                      <input
                        type="text"
                        className="date-display-input"
                        value={tournamentFormData.eventEndDateFormatted}
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
                          value={tournamentFormData.state}
                          onChange={handleTournamentStateChange}
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
                          value={tournamentFormData.city}
                          onChange={handleTournamentInputChange}
                          required
                          disabled={!tournamentFormData.state}
                        >
                          <option value="">Select City</option>
                          {tournamentFormData.state && malaysianStatesAndCities[tournamentFormData.state].map(city => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                        {!tournamentFormData.state && (
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
                        value={tournamentFormData.venue}
                        onChange={handleTournamentInputChange}
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
                        value={tournamentFormData.classification}
                        onChange={handleTournamentInputChange}
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
                        value={tournamentFormData.eventType}
                        onChange={handleTournamentInputChange}
                        required
                      >
                        <option value="">Select Type</option>
                        <option value="Open">Open</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="form-section">
                  <h3>Tournament Categories & Entry Fees</h3>
                  <p className="section-note">Add tournament categories with their respective entry fees. You can add multiple categories.</p>
                  
                  <div className="form-row">
                    <div className="form-group" style={{ flex: '2' }}>
                      <label htmlFor="category">Category *</label>
                      <input
                        type="text"
                        id="category"
                        name="category"
                        value={tournamentFormData.category}
                        onChange={handleTournamentInputChange}
                        placeholder="e.g., Men's Singles, Women's Doubles, Mixed Doubles"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="malaysianEntryFee">Malaysian Entry Fee (RM) per player *</label>
                      <input
                        type="number"
                        id="malaysianEntryFee"
                        name="malaysianEntryFee"
                        value={tournamentFormData.malaysianEntryFee}
                        onChange={handleTournamentInputChange}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                      <small className="form-note" style={{ color: '#dc3545' }}>Note: Not more than RM 200.00</small>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="internationalEntryFee">International Entry Fee (RM) per player</label>
                      <input
                        type="number"
                        id="internationalEntryFee"
                        name="internationalEntryFee"
                        value={tournamentFormData.internationalEntryFee}
                        onChange={handleTournamentInputChange}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                      <small className="form-note" style={{ color: '#dc3545' }}>Note: Only required if international players are involved</small>
                    </div>
                    
                    <div className="form-group">
                      <label style={{ visibility: 'hidden' }}>Save</label>
                      <button 
                        type="button" 
                        onClick={handleSaveTournamentCategory}
                        style={{
                          padding: '10px 20px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          width: 'auto'
                        }}
                      >
                        Save Category
                      </button>
                    </div>
                  </div>
                  
                  {savedTournamentCategories.length > 0 && (
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
                                fontWeight: 'bold',
                                color: '#333'
                              }}>Category</th>
                              <th style={{
                                padding: '12px',
                                textAlign: 'center',
                                borderBottom: '2px solid #ddd',
                                fontWeight: 'bold',
                                color: '#333',
                                width: '150px'
                              }}>Malaysian Fee (RM)</th>
                              <th style={{
                                padding: '12px',
                                textAlign: 'center',
                                borderBottom: '2px solid #ddd',
                                fontWeight: 'bold',
                                color: '#333',
                                width: '150px'
                              }}>International Fee (RM)</th>
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
                            {savedTournamentCategories.map((category, index) => (
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
                                  borderRight: '1px solid #ddd',
                                  fontWeight: 'bold',
                                  color: '#007bff'
                                }}>RM {category.malaysianEntryFee.toFixed(2)}</td>
                                <td style={{
                                  padding: '12px',
                                  textAlign: 'center',
                                  borderBottom: '1px solid #ddd',
                                  borderRight: '1px solid #ddd',
                                  fontWeight: 'bold',
                                  color: '#28a745'
                                }}>RM {category.internationalEntryFee.toFixed(2)}</td>
                                <td style={{
                                  padding: '12px',
                                  textAlign: 'center',
                                  borderBottom: '1px solid #ddd'
                                }}>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTournamentCategory(category.id)}
                                    style={{
                                      backgroundColor: '#dc3545',
                                      color: 'white',
                                      border: 'none',
                                      padding: '5px 10px',
                                      borderRadius: '3px',
                                      fontSize: '12px',
                                      cursor: 'pointer'
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
                </div>
                
                <div className="form-section">
                  <div className="form-group">
                    <label htmlFor="expectedParticipants">Expected No. of Participants *</label>
                    <input
                      type="number"
                      id="expectedParticipants"
                      name="expectedParticipants"
                      value={tournamentFormData.expectedParticipants}
                      onChange={handleTournamentInputChange}
                      min="1"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="eventSummary">Brief Summary/Purpose of Event *</label>
                    <textarea
                      id="eventSummary"
                      name="eventSummary"
                      value={tournamentFormData.eventSummary}
                      onChange={handleTournamentInputChange}
                      rows="5"
                      maxLength="300"
                      required
                    />
                    <div className="character-counter-wrapper">
                      <small className="form-note">Maximum 300 characters. Do not include your factsheet.</small>
                      <small className={`character-counter ${
                        tournamentFormData.eventSummary.length >= 300 ? 'at-limit' : 
                        tournamentFormData.eventSummary.length >= 250 ? 'near-limit' : ''
                      }`}>
                        {tournamentFormData.eventSummary.length}/300
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
                  <h3>Mandatory Compliance</h3>
                  <div className="remarks-info">
                    <ul className="remarks-list">
                      <li>Endorsement logos (state, national & PJS/KBS) must be displayed on your event banners/at the venue etc.</li>
                      <li>Traditional scoring up to 11 pts or more; Rally Scoring (minimum up to 21 pts) is acceptable for the first round-robins and novice only.</li>
                      <li>The fee for each category is capped at RM200 per Malaysian player and must not be exceeded.</li>
                    </ul>
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
                          checked={tournamentFormData.dataConsent}
                          onChange={handleTournamentInputChange}
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
                          checked={tournamentFormData.termsConsent}
                          onChange={handleTournamentInputChange}
                          required
                        />
                        <span className="checkmark"></span>
                        I have read, understood, and agree to abide by the Terms and Conditions set forth by Malaysia Pickleball Association (MPA) for tournament participation and organization. I acknowledge that failure to comply with these terms may result in disqualification or other appropriate actions.
                      </label>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  {createTournamentError && (
                    <div className="error-message" style={{ 
                      color: '#d32f2f', 
                      backgroundColor: '#ffebee', 
                      padding: '10px', 
                      borderRadius: '4px', 
                      marginBottom: '15px',
                      border: '1px solid #ffcdd2' 
                    }}>
                      {createTournamentError}
                    </div>
                  )}
                  <button 
                    type="submit" 
                    className={`submit-btn ${(!tournamentFormData.dataConsent || !tournamentFormData.termsConsent || isCreatingTournament) ? 'disabled' : ''}`}
                    disabled={!tournamentFormData.dataConsent || !tournamentFormData.termsConsent || isCreatingTournament}
                  >
                    {isCreatingTournament ? 'Creating Tournament...' : 'Create Tournament (Auto-Approved)'}
                  </button>
                </div>
              </form>
              </>
            ) : (
              <div className="submission-success">
                <div className="success-message">
                  <h3>Tournament Created Successfully!</h3>
                  <p>The tournament has been created and automatically approved.</p>
                  <p>It will now appear in the approved tournaments list.</p>
                </div>
                <div className="form-actions">
                  <button type="button" className="home-btn" onClick={() => {
                    setTournamentCreated(false);
                    setCurrentView('applications');
                  }}>
                    View Applications
                  </button>
                  <button type="button" className="submit-btn" onClick={() => {
                    setTournamentCreated(false);
                  }}>
                    Create Another Tournament
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'edit-tournament' && (
          <div className="edit-tournament-view">
            {editingTournament ? (
              <div className="edit-tournament-form-view">
                <div className="dashboard-header">
                  <h2>Edit Tournament: {editingTournament.eventTitle}</h2>
                  <p className="dashboard-subtitle">
                    Tournament ID: {editingTournament.applicationId || editingTournament.id} • 
                    Modify tournament details below
                  </p>
                </div>

                {!tournamentUpdated ? (
                  editFormData.eventTitle || editFormData.organiserName ? (
                  <form onSubmit={handleUpdateTournament} className="tournament-form">
                    <div className="form-section">
                      <h3>Organiser Information</h3>
                      <div className="form-group">
                        <label htmlFor="edit-organiserName">Organiser Name *</label>
                        <input
                          type="text"
                          id="edit-organiserName"
                          name="organiserName"
                          value={editFormData.organiserName}
                          onChange={handleEditInputChange}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="edit-registrationNo">PJS/ROS/Company Registration No. *</label>
                        <input
                          type="text"
                          id="edit-registrationNo"
                          name="registrationNo"
                          value={editFormData.registrationNo}
                          onChange={handleEditInputChange}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="edit-telContact">Tel. Contact *</label>
                        <input
                          type="tel"
                          id="edit-telContact"
                          name="telContact"
                          value={editFormData.telContact}
                          onChange={handleEditInputChange}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="edit-personInCharge">Person in Charge *</label>
                        <input
                          type="text"
                          id="edit-personInCharge"
                          name="personInCharge"
                          value={editFormData.personInCharge}
                          onChange={handleEditInputChange}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="edit-email">Email Address *</label>
                        <input
                          type="email"
                          id="edit-email"
                          name="email"
                          value={editFormData.email}
                          onChange={handleEditInputChange}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="edit-organisingPartner">Organising Partner (if applicable)</label>
                        <input
                          type="text"
                          id="edit-organisingPartner"
                          name="organisingPartner"
                          value={editFormData.organisingPartner}
                          onChange={handleEditInputChange}
                        />
                      </div>
                    </div>
                    
                    <div className="form-section">
                      <h3>Event Details</h3>
                      <div className="form-group">
                        <label htmlFor="edit-eventTitle">Title of Event *</label>
                        <input
                          type="text"
                          id="edit-eventTitle"
                          name="eventTitle"
                          value={editFormData.eventTitle}
                          onChange={handleEditInputChange}
                          required
                        />
                        <small className="form-note">Note: Should Not Include the National/State Title (e.g. Malaysia Open/Closed, State Open/Closed etc)</small>
                      </div>
                      
                      <div className="form-group date-input-group">
                        <label htmlFor="edit-eventStartDate">Event Start Date *</label>
                        <div className="date-input-wrapper">
                          <input
                            type="date"
                            id="edit-eventStartDate"
                            name="eventStartDate"
                            value={editFormData.eventStartDate}
                            onChange={handleEditDateChange}
                            className="date-picker-hidden"
                            required
                          />
                          <input
                            type="text"
                            className="date-display-input"
                            value={editFormData.eventStartDateFormatted}
                            placeholder="Click to select date"
                            readOnly
                            onClick={() => document.getElementById('edit-eventStartDate').showPicker()}
                          />
                        </div>
                      </div>
                      
                      <div className="form-group date-input-group">
                        <label htmlFor="edit-eventEndDate">Event End Date *</label>
                        <div className="date-input-wrapper">
                          <input
                            type="date"
                            id="edit-eventEndDate"
                            name="eventEndDate"
                            value={editFormData.eventEndDate}
                            onChange={handleEditDateChange}
                            min={editFormData.eventStartDate}
                            className="date-picker-hidden"
                            required
                          />
                          <input
                            type="text"
                            className="date-display-input"
                            value={editFormData.eventEndDateFormatted}
                            placeholder="Click to select date"
                            readOnly
                            onClick={() => document.getElementById('edit-eventEndDate').showPicker()}
                          />
                        </div>
                        <small className="form-note">End date must be on or after start date</small>
                      </div>
                      
                      <div className="form-group">
                        <label>Location *</label>
                        <div className="location-row">
                          <div className="form-subgroup">
                            <label htmlFor="edit-state">State</label>
                            <select
                              id="edit-state"
                              name="state"
                              value={editFormData.state}
                              onChange={handleEditStateChange}
                              required
                            >
                              <option value="">Select State</option>
                              {Object.keys(malaysianStatesAndCities).map(state => (
                                <option key={state} value={state}>{state}</option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="form-subgroup">
                            <label htmlFor="edit-city">City</label>
                            <select
                              id="edit-city"
                              name="city"
                              value={editFormData.city}
                              onChange={handleEditInputChange}
                              required
                              disabled={!editFormData.state}
                            >
                              <option value="">Select City</option>
                              {editFormData.state && malaysianStatesAndCities[editFormData.state].map(city => (
                                <option key={city} value={city}>{city}</option>
                              ))}
                            </select>
                            {!editFormData.state && (
                              <small className="form-note">Please select a state first</small>
                            )}
                          </div>
                        </div>
                        
                        <div className="form-subgroup">
                          <label htmlFor="edit-venue">Venue</label>
                          <input
                            type="text"
                            id="edit-venue"
                            name="venue"
                            value={editFormData.venue}
                            onChange={handleEditInputChange}
                            required
                          />
                          <small className="form-note">Note: The venue must be fully covered and is required to hold a valid government occupancy permit.</small>
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="edit-classification">Level of Event *</label>
                        <select
                          id="edit-classification"
                          name="classification"
                          value={editFormData.classification}
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
                        <label htmlFor="edit-expectedParticipants">Expected No. of Participants *</label>
                        <input
                          type="number"
                          id="edit-expectedParticipants"
                          name="expectedParticipants"
                          value={editFormData.expectedParticipants}
                          onChange={handleEditInputChange}
                          min="1"
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="edit-eventSummary">Brief Summary/Purpose of Event *</label>
                        <textarea
                          id="edit-eventSummary"
                          name="eventSummary"
                          value={editFormData.eventSummary}
                          onChange={handleEditInputChange}
                          rows="5"
                          maxLength="300"
                          required
                        />
                        <div className="character-counter-wrapper">
                          <small className="form-note">Maximum 300 characters. Do not include your factsheet.</small>
                          <small className={`character-counter ${
                            editFormData.eventSummary.length >= 300 ? 'at-limit' : 
                            editFormData.eventSummary.length >= 250 ? 'near-limit' : ''
                          }`}>
                            {editFormData.eventSummary.length}/300
                          </small>
                        </div>
                      </div>
                    </div>

                    <div className="form-actions">
                      {editTournamentError && (
                        <div className="error-message" style={{ 
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
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          type="button" 
                          className="cancel-btn"
                          onClick={cancelEditTournament}
                          style={{
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '12px 24px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className={`submit-btn ${isUpdatingTournament ? 'disabled' : ''}`}
                          disabled={isUpdatingTournament}
                        >
                          {isUpdatingTournament ? 'Updating Tournament...' : 'Update Tournament'}
                        </button>
                      </div>
                    </div>
                  </form>
                  ) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
                      <p>Loading tournament data...</p>
                    </div>
                  )
                ) : (
                  <div className="submission-success">
                    <div className="success-message">
                      <h3>Tournament Updated Successfully!</h3>
                      <p>The tournament "{editingTournament.eventTitle}" has been updated.</p>
                      <p>Changes have been saved and applied to the system.</p>
                    </div>
                    <div className="form-actions">
                      <button type="button" className="home-btn" onClick={() => {
                        cancelEditTournament();
                      }}>
                        Back to Tournament List
                      </button>
                      <button type="button" className="submit-btn" onClick={() => {
                        setTournamentUpdated(false);
                      }}>
                        Edit Another Tournament
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="dashboard-header">
                  <h2>Edit Tournament</h2>
                  <p className="dashboard-subtitle">Select a tournament to edit from the list below</p>
                </div>

            <div 
              className="tournaments-list-card"
              style={{
                backgroundColor: 'white',
                border: '1px solid #e9ecef',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                margin: '20px 0',
                overflow: 'hidden'
              }}
            >
              <div 
                className="tournaments-list-header"
                style={{
                  padding: '20px',
                  borderBottom: '1px solid #e9ecef',
                  backgroundColor: '#f8f9fa'
                }}
              >
                <h3 style={{ margin: '0', color: '#2c3e50', fontSize: '18px' }}>All Tournaments</h3>
                <p style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: '14px' }}>
                  {applications.length} tournament{applications.length !== 1 ? 's' : ''} available for editing
                </p>
              </div>

              <div 
                className="tournaments-list-body"
                style={{
                  padding: '20px'
                }}
              >
                {applications.length === 0 ? (
                  <div 
                    className="no-tournaments-edit"
                    style={{
                      textAlign: 'center',
                      padding: '40px',
                      color: '#6c757d'
                    }}
                  >
                    <p style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '500' }}>
                      No tournaments available
                    </p>
                    <small style={{ fontSize: '14px' }}>
                      Create tournaments first to be able to edit them
                    </small>
                  </div>
                ) : (
                  <div 
                    className="tournaments-list-container"
                    style={{
                      maxHeight: '500px',
                      overflowY: 'auto',
                      overflowX: 'hidden'
                    }}
                  >
                    <div className="tournaments-table-wrapper">
                      <table 
                        className="tournaments-edit-table"
                        style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          fontSize: '14px'
                        }}
                      >
                        <thead>
                          <tr style={{ backgroundColor: '#f8f9fa' }}>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e9ecef', color: '#495057', fontWeight: '600' }}>No.</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e9ecef', color: '#495057', fontWeight: '600' }}>Tournament Name</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e9ecef', color: '#495057', fontWeight: '600' }}>Tournament ID</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e9ecef', color: '#495057', fontWeight: '600' }}>Status</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e9ecef', color: '#495057', fontWeight: '600' }}>Event Date</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e9ecef', color: '#495057', fontWeight: '600' }}>Organizer</th>
                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e9ecef', color: '#495057', fontWeight: '600' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {applications.map((tournament, index) => (
                            <tr 
                              key={tournament.applicationId || tournament.id}
                              style={{
                                borderBottom: '1px solid #e9ecef',
                                transition: 'background-color 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.target.closest('tr').style.backgroundColor = '#f8f9fa';
                              }}
                              onMouseLeave={(e) => {
                                e.target.closest('tr').style.backgroundColor = 'transparent';
                              }}
                            >
                              <td style={{ padding: '12px', color: '#6c757d' }}>{index + 1}</td>
                              <td style={{ padding: '12px', fontWeight: '500', color: '#2c3e50' }}>
                                {tournament.eventTitle || 'Untitled Tournament'}
                              </td>
                              <td style={{ padding: '12px', fontFamily: 'monospace', color: '#007bff', fontSize: '13px' }}>
                                {tournament.applicationId || tournament.id}
                              </td>
                              <td style={{ padding: '12px' }}>
                                <span 
                                  style={{
                                    backgroundColor: tournament.status === 'Approved' ? '#28a745' : 
                                                   tournament.status === 'Rejected' ? '#dc3545' : 
                                                   tournament.status === 'Under Review' ? '#007bff' : '#ffc107',
                                    color: 'white',
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: '600'
                                  }}
                                >
                                  {tournament.status}
                                </span>
                              </td>
                              <td style={{ padding: '12px', color: '#495057' }}>
                                {tournament.eventStartDate ? 
                                  new Date(tournament.eventStartDate).toLocaleDateString('en-MY', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  }) : 'Not specified'
                                }
                              </td>
                              <td style={{ padding: '12px', color: '#495057' }}>
                                {tournament.organiserName || 'Unknown'}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center' }}>
                                <button
                                  style={{
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '6px 12px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#0056b3';
                                    e.target.style.transform = 'translateY(-1px)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#007bff';
                                    e.target.style.transform = 'translateY(0)';
                                  }}
                                  onClick={() => {
                                    startEditTournament(tournament);
                                  }}
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
              </div>
            )}
          </div>
        )}
        
        {currentView === 'analytics' && renderAnalytics()}
        {currentView === 'registered-organizations' && renderRegisteredOrganizations()}
        {currentView === 'notice-management' && renderNoticeManagement()}
        {currentView === 'assessment-management' && renderAssessmentManagement()}
        {currentView === 'assessment-list' && renderAssessmentList()}
        {currentView === 'assessment-statistics' && renderAssessmentStatistics()}
        {currentView === 'saved-forms' && renderSavedForms()}
        {currentView === 'settings' && renderSettings()}
      </div>

      {/* Application Details Modal */}
      {showModal && selectedApplication && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedApplication.eventTitle ? 'Application Details' : 'Organization Details'}</h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            
            <div className="modal-body">
              {selectedApplication.eventTitle ? (
                // Tournament Application Details
                <>
                  <div className="detail-section">
                    <h3>Organiser Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Application ID:</label>
                    <span>{selectedApplication.applicationId || selectedApplication.id}</span>
                  </div>
                  <div className="detail-item">
                    <label>Organiser Name:</label>
                    <span>{selectedApplication.organiserName || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Registration No.:</label>
                    <span>{selectedApplication.registrationNo || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Telephone Contact:</label>
                    <span>{selectedApplication.telContact || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email:</label>
                    <span>{selectedApplication.email || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Organising Partner:</label>
                    <span>{selectedApplication.organisingPartner || 'Not applicable'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Event Details</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Event Title:</label>
                    <span>{selectedApplication.eventTitle || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Event Dates:</label>
                    <span>
                      {selectedApplication.eventStartDate && selectedApplication.eventEndDate 
                        ? `${new Date(selectedApplication.eventStartDate).toLocaleDateString('en-MY')} - ${new Date(selectedApplication.eventEndDate).toLocaleDateString('en-MY')}`
                        : selectedApplication.eventStartDate 
                          ? new Date(selectedApplication.eventStartDate).toLocaleDateString('en-MY')
                          : 'Not provided'
                      }
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Location:</label>
                    <span>
                      {selectedApplication.city && selectedApplication.state
                        ? `${selectedApplication.city}, ${selectedApplication.state}`
                        : selectedApplication.state || selectedApplication.city || 'Not provided'
                      }
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Venue:</label>
                    <span>{selectedApplication.venue || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Level/Type:</label>
                    <span>{selectedApplication.classification || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Expected Participants:</label>
                    <span>{selectedApplication.expectedParticipants || 'Not provided'}</span>
                  </div>
                </div>
                
                <div className="detail-item full-width">
                  <label>Event Summary/Purpose:</label>
                  <div className="summary-text">
                    {selectedApplication.eventSummary || 'No summary provided'}
                  </div>
                </div>
              </div>

              {/* Tournament Categories and Fees Section */}
              <div className="detail-section">
                <h3>Tournament Categories & Entry Fees</h3>
                {selectedApplication.categories && selectedApplication.categories.length > 0 ? (
                  <div className="categories-grid">
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Category</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Malaysian Entry Fee (RM)</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>International Entry Fee (RM)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedApplication.categories.map((category, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                              <td style={{ padding: '12px', fontWeight: '500' }}>{category.category}</td>
                              <td style={{
                                padding: '12px',
                                color: category.malaysianEntryFee > 200 ? '#dc3545' : '#000',
                                fontWeight: category.malaysianEntryFee > 200 ? 'bold' : 'normal'
                              }}>
                                RM {category.malaysianEntryFee.toFixed(2)}
                                {category.malaysianEntryFee > 200 && (
                                  <span style={{ color: '#dc3545', fontSize: '12px', marginLeft: '5px' }}>
                                    (Exceeds RM200 cap)
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '12px' }}>
                                {category.internationalEntryFee > 0
                                  ? `RM ${category.internationalEntryFee.toFixed(2)}`
                                  : '-'
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="no-categories" style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#666',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    fontStyle: 'italic'
                  }}>
                    No categories have been added to this tournament application.
                  </div>
                )}
              </div>

              {/* Support Documents Section */}
              <div className="detail-section">
                <h3>Support Documents</h3>
                {selectedApplication.supportDocuments && selectedApplication.supportDocuments.length > 0 ? (
                  <div className="support-documents-grid">
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                      gap: '15px',
                      marginTop: '15px'
                    }}>
                      {selectedApplication.supportDocuments.map((doc, index) => (
                        <div
                          key={index}
                          style={{
                            border: '1px solid #e9ecef',
                            borderRadius: '8px',
                            padding: '15px',
                            backgroundColor: '#f8f9fa',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          <div style={{
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: '#333',
                            wordBreak: 'break-all'
                          }}>
                            {doc.originalname || doc.filename || `Document ${index + 1}`}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {doc.size && `Size: ${(doc.size / 1024 / 1024).toFixed(2)} MB`}
                            {doc.mimetype && ` • Type: ${doc.mimetype.split('/')[1].toUpperCase()}`}
                          </div>
                          <div style={{ fontSize: '11px', color: '#999' }}>
                            {doc.uploadDate && `Uploaded: ${new Date(doc.uploadDate).toLocaleDateString('en-MY')}`}
                          </div>
                          <div style={{ marginTop: '10px' }}>
                            <a
                              href={`/api/uploads/${doc.filename}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                textDecoration: 'none',
                                cursor: 'pointer',
                                display: 'inline-block'
                              }}
                            >
                              View/Download
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="no-support-documents" style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#666',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    fontStyle: 'italic'
                  }}>
                    No support documents were uploaded with this tournament application.
                  </div>
                )}
              </div>

              <div className="detail-section">
                <h3>Application Status</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Current Status:</label>
                    <span 
                      className="status-badge-detail" 
                      style={{ backgroundColor: getStatusColor(selectedApplication.status) }}
                    >
                      {selectedApplication.status}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Submitted Date:</label>
                    <span>{formatDate(selectedApplication.submissionDate)}</span>
                  </div>
                </div>
              </div>
                </>
              ) : (
                // Organization Details
                <>
                  <div className="detail-section">
                    <h3>Organization Information</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Organization ID:</label>
                        <span className="organization-id-detail">{selectedApplication.organizationId || 'Not provided'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Organization Name:</label>
                        <span>{selectedApplication.organizationName || 'Not provided'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Registration Number:</label>
                        <span>{selectedApplication.registrationNo || 'Not provided'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Applicant Full Name:</label>
                        <span>{selectedApplication.applicantFullName || 'Not provided'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Phone Number:</label>
                        <span>{selectedApplication.phoneNumber || 'Not provided'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Email:</label>
                        <span>{selectedApplication.email || 'Not provided'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>Address Information</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Address Line 1:</label>
                        <span>{selectedApplication.addressLine1 || 'Not provided'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Address Line 2:</label>
                        <span>{selectedApplication.addressLine2 || 'Not provided'}</span>
                      </div>
                      <div className="detail-item">
                        <label>City:</label>
                        <span>{selectedApplication.city || 'Not provided'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Postcode:</label>
                        <span>{selectedApplication.postcode || 'Not provided'}</span>
                      </div>
                      <div className="detail-item">
                        <label>State:</label>
                        <span>{selectedApplication.state || 'Not provided'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Country:</label>
                        <span>{selectedApplication.country || 'Not provided'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Registration Documents Section */}
                  <div className="detail-section">
                    <h3>Registration Documents</h3>
                    <div className="detail-grid">
                      {selectedApplication.documents && selectedApplication.documents.length > 0 ? (
                        selectedApplication.documents.map((doc, index) => (
                          <div key={index} className="detail-item document-item" style={{
                            gridColumn: '1 / -1',
                            marginBottom: '16px',
                            padding: '16px',
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #dee2e6',
                            borderRadius: '8px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '24px' }}>
                                  {doc.mimetype?.startsWith('image/') ? '🖼️' : '📄'}
                                </span>
                                <div>
                                  <div style={{ fontWeight: 'bold', color: '#495057' }}>
                                    {doc.originalName || 'Registration Document'}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#6c757d' }}>
                                    {doc.mimetype} • {(doc.size / 1024 / 1024).toFixed(2)} MB
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#868e96' }}>
                                    Uploaded: {doc.uploadedAt ? formatDate(doc.uploadedAt) : 'Unknown date'}
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={() => {
                                    if (doc.filename) {
                                      window.open(`/uploads/${doc.filename}`, '_blank');
                                    } else {
                                      alert('File not available for viewing');
                                    }
                                  }}
                                  style={{
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                  }}
                                  title="View document in new tab"
                                >
                                  👁️ View
                                </button>
                                <button
                                  onClick={() => {
                                    if (doc.filename) {
                                      const link = document.createElement('a');
                                      link.href = `/uploads/${doc.filename}`;
                                      link.download = doc.originalName || 'registration-document';
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    } else {
                                      alert('File not available for download');
                                    }
                                  }}
                                  style={{
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                  }}
                                  title="Download document"
                                >
                                  💾 Download
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="detail-item" style={{
                          gridColumn: '1 / -1',
                          padding: '16px',
                          backgroundColor: '#fff3cd',
                          border: '1px solid #ffeaa7',
                          borderRadius: '4px',
                          color: '#856404',
                          fontStyle: 'italic',
                          textAlign: 'center'
                        }}>
                          No registration documents uploaded
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>Registration Status</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Registered Date:</label>
                        <span>
                          {selectedApplication.registeredAt ? 
                            formatDate(selectedApplication.registeredAt) : 
                            'Not available'
                          }
                        </span>
                      </div>
                      <div className="detail-item">
                        <label>Status:</label>
                        <span className="status-badge-detail" style={{ backgroundColor: '#28a745' }}>
                          Active
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Organization Documents Section */}
                  {selectedApplication.documents && selectedApplication.documents.length > 0 && (
                    <div className="detail-section">
                      <h3>Uploaded Documents</h3>
                      <div className="documents-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '15px',
                        marginTop: '15px'
                      }}>
                        {selectedApplication.documents.map((doc, index) => (
                          <div key={index} style={{
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            padding: '15px',
                            backgroundColor: '#f9f9f9'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              marginBottom: '10px'
                            }}>
                              <span style={{
                                fontSize: '20px',
                                marginRight: '10px'
                              }}>
                                {doc.mimetype?.includes('pdf') ? '📄' :
                                 doc.mimetype?.includes('image') ? '🖼️' :
                                 doc.mimetype?.includes('document') ? '📝' : '📋'}
                              </span>
                              <div>
                                <div style={{
                                  fontSize: '14px',
                                  fontWeight: 'bold',
                                  color: '#333'
                                }}>
                                  {doc.originalName || doc.filename}
                                </div>
                                <div style={{
                                  fontSize: '12px',
                                  color: '#666'
                                }}>
                                  {doc.size ? `${(doc.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                                </div>
                              </div>
                            </div>

                            <div style={{ marginBottom: '10px' }}>
                              <div style={{
                                fontSize: '12px',
                                color: '#888'
                              }}>
                                <strong>Type:</strong> {doc.mimetype || 'Unknown'}
                              </div>
                              <div style={{
                                fontSize: '12px',
                                color: '#888'
                              }}>
                                <strong>Uploaded:</strong> {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-MY') : 'Unknown'}
                              </div>
                            </div>

                            <div style={{
                              display: 'flex',
                              gap: '10px'
                            }}>
                              {doc.mimetype?.includes('image') && (
                                <button
                                  onClick={() => window.open(`/api/files/${doc.filename}`, '_blank')}
                                  style={{
                                    padding: '8px 12px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  Preview
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = `/api/files/${doc.filename}`;
                                  link.download = doc.originalName || doc.filename;
                                  link.click();
                                }}
                                style={{
                                  padding: '8px 12px',
                                  backgroundColor: '#007bff',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                Download
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Documents Message */}
                  {(!selectedApplication.documents || selectedApplication.documents.length === 0) && (
                    <div className="detail-section">
                      <h3>Uploaded Documents</h3>
                      <div style={{
                        textAlign: 'center',
                        padding: '30px',
                        color: '#666',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        fontStyle: 'italic'
                      }}>
                        No documents have been uploaded by this organization yet.
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectionModal && (
        <div className="modal-overlay" onClick={handleRejectionCancel}>
          <div className="modal-content rejection-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚠️ Reject Application</h2>
              <button className="close-btn" onClick={handleRejectionCancel}>×</button>
            </div>
            
            <div className="modal-body">
              <p className="rejection-warning">
                You are about to reject this application. Please provide a clear reason that will be communicated to the applicant.
              </p>
              
              <div className="rejection-reason-input">
                <label htmlFor="rejectionReason">Rejection Reason *</label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a detailed reason for rejection..."
                  rows="4"
                  className="rejection-textarea"
                  required
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <div className="button-group">
                <button 
                  className="modal-btn modal-btn-cancel" 
                  onClick={handleRejectionCancel}
                >
                  Cancel
                </button>
                <button 
                  className="modal-btn modal-btn-reject" 
                  onClick={handleRejectionSubmit}
                  disabled={!rejectionReason.trim()}
                >
                  Reject Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditAdminModal && selectedAdmin && (
        <div className="modal-overlay" onClick={() => setShowEditAdminModal(false)}>
          <div className="modal-content edit-admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Edit Admin Account</h2>
              <button className="close-btn" onClick={() => setShowEditAdminModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="edit-admin-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Username *</label>
                    <input 
                      type="text" 
                      value={selectedAdmin.username}
                      onChange={(e) => setSelectedAdmin({...selectedAdmin, username: e.target.value})}
                      placeholder="Enter username"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input 
                      type="email" 
                      value={selectedAdmin.email}
                      onChange={(e) => setSelectedAdmin({...selectedAdmin, email: e.target.value})}
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      value={selectedAdmin.fullName || ''}
                      onChange={(e) => setSelectedAdmin({...selectedAdmin, fullName: e.target.value})}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Authority Level *</label>
                    <select 
                      value={selectedAdmin.authorityLevel}
                      onChange={(e) => setSelectedAdmin({...selectedAdmin, authorityLevel: e.target.value})}
                    >
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                      <option value="assessment_admin">Assessment Admin</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Account Status</label>
                    <select 
                      value={selectedAdmin.status}
                      onChange={(e) => setSelectedAdmin({...selectedAdmin, status: e.target.value})}
                    >
                      <option value="active">Active</option>
                      <option value="disabled">Disabled</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <div className="button-group">
                <button 
                  className="modal-btn modal-btn-cancel" 
                  onClick={() => setShowEditAdminModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="modal-btn modal-btn-save" 
                  onClick={handleSaveAdminEdit}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowResetPasswordModal(false)}>
          <div className="modal-content reset-password-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔒 Reset Password</h2>
              <button className="close-btn" onClick={() => setShowResetPasswordModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="reset-password-info">
                <p className="reset-warning">
                  Are you sure you want to reset this admin's password?
                </p>
                <p className="reset-details">
                  A password reset email will be sent to the admin's registered email address. 
                  They will need to follow the instructions in the email to create a new password.
                </p>
              </div>
            </div>
            
            <div className="modal-footer">
              <div className="button-group">
                <button 
                  className="modal-btn modal-btn-cancel" 
                  onClick={() => setShowResetPasswordModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="modal-btn modal-btn-reset" 
                  onClick={handleConfirmPasswordReset}
                >
                  Send Reset Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Temporary Code Modal */}
      {showTempCodeModal && tempCodeData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 2000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '0',
            width: '90%',
            maxWidth: '600px',
            border: '2px solid #28a745',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Modal Header */}
            <div style={{
              backgroundColor: '#28a745',
              color: '#fff',
              padding: '20px',
              borderRadius: '10px 10px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                ✅ Temporary Code Generated!
              </h2>
              <button
                onClick={closeTempCodeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '28px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{
              padding: '30px',
              textAlign: 'center'
            }}>
              {/* Temporary Code Display */}
              <div style={{
                backgroundColor: '#f8f9fa',
                border: '2px solid #28a745',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '25px'
              }}>
                <div style={{
                  fontSize: '16px',
                  color: '#666',
                  marginBottom: '8px'
                }}>
                  📋 Temporary Assessment Code
                </div>
                <div style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: '#28a745',
                  fontFamily: 'monospace',
                  letterSpacing: '4px',
                  marginBottom: '15px'
                }}>
                  {tempCodeData.tempCode}
                </div>
                <button
                  onClick={copyTempCodeToClipboard}
                  style={{
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    margin: '0 auto'
                  }}
                >
                  📋 Copy to Clipboard
                </button>
              </div>

              {/* Assessment Details */}
              <div style={{
                backgroundColor: '#e3f2fd',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px',
                textAlign: 'left'
              }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#1976d2' }}>Assessment Details</h3>
                <div style={{ marginBottom: '10px' }}>
                  <strong>📚 Title:</strong> {tempCodeData.parentTitle}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>⏱️ Time Limit:</strong> {tempCodeData.timeLimit} minutes
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>🕒 Expires at:</strong> {tempCodeData.expiryDate.toLocaleString()}
                </div>
                <div>
                  <strong>⏰ Valid for:</strong> 24 hours
                </div>
              </div>

              {/* Important Notes */}
              <div style={{
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '25px',
                textAlign: 'left'
              }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#856404' }}>⚠️ Important Notes:</h4>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li>This code will automatically expire in 24 hours</li>
                  <li>Each temporary code can only be used once</li>
                  <li>Share this code with assessment participants</li>
                  <li>Code starts with 'T' to indicate it's temporary</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '15px',
                justifyContent: 'center'
              }}>
                <button
                  onClick={copyTempCodeToClipboard}
                  style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  📋 Copy Code
                </button>
                <button
                  onClick={closeTempCodeModal}
                  style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Temporary Codes List Modal */}
      {showTempCodesListModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 2000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '0',
            width: '95%',
            maxWidth: '1000px',
            maxHeight: '90vh',
            border: '2px solid #17a2b8',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Modal Header */}
            <div style={{
              backgroundColor: '#17a2b8',
              color: '#fff',
              padding: '20px',
              borderRadius: '10px 10px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                Manage Temporary Codes
              </h2>
              <button
                onClick={closeTempCodesListModal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '28px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{
              padding: '20px',
              overflowY: 'auto',
              flex: 1
            }}>
              {isLoadingTempCodes ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p>Loading temporary codes...</p>
                </div>
              ) : temporaryCodesList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <h3>No Active Temporary Codes</h3>
                  <p>All temporary codes have expired or none have been generated yet.</p>
                  <p>Generate a new temporary code from any saved assessment form.</p>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>Summary</h4>
                    <p style={{ margin: 0 }}>
                      <strong>{temporaryCodesList.length}</strong> active temporary codes •
                      All codes expire automatically after 24 hours
                    </p>
                  </div>

                  <div style={{
                    display: 'grid',
                    gap: '15px',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))'
                  }}>
                    {temporaryCodesList.map((tempCode) => {
                      const expiryDate = new Date(tempCode.expiresAt);
                      const timeRemaining = tempCode.timeRemaining;
                      const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
                      const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
                      const isExpiringSoon = timeRemaining < 2 * 60 * 60 * 1000; // Less than 2 hours

                      return (
                        <div
                          key={tempCode._id}
                          style={{
                            border: isExpiringSoon ? '2px solid #ffc107' : '2px solid #17a2b8',
                            borderRadius: '8px',
                            padding: '20px',
                            backgroundColor: isExpiringSoon ? '#fff3cd' : '#f8f9fa'
                          }}
                        >
                          {/* Header with Code */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '15px'
                          }}>
                            <div style={{
                              fontSize: '24px',
                              fontWeight: 'bold',
                              fontFamily: 'monospace',
                              color: '#17a2b8',
                              letterSpacing: '2px'
                            }}>
                              {tempCode.tempCode}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => copyTempCodeFromList(tempCode.tempCode)}
                                style={{
                                  backgroundColor: '#28a745',
                                  color: 'white',
                                  border: 'none',
                                  padding: '8px 16px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}
                              >
                                Copy
                              </button>
                              <button
                                onClick={() => deleteTempCode(tempCode._id, tempCode.tempCode)}
                                style={{
                                  backgroundColor: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  padding: '8px 16px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          {/* Assessment Details */}
                          <div style={{ marginBottom: '15px' }}>
                            <div style={{ marginBottom: '8px' }}>
                              <strong>Assessment:</strong> {tempCode.parentFormTitle}
                            </div>
                            <div style={{ marginBottom: '8px' }}>
                              <strong>Original Code:</strong> {tempCode.parentFormCode}
                            </div>
                            <div style={{ marginBottom: '8px' }}>
                              <strong>Time Limit:</strong> {tempCode.timeLimit} minutes
                            </div>
                          </div>

                          {/* Timing Information */}
                          <div style={{
                            backgroundColor: isExpiringSoon ? '#ffeaa7' : '#e3f2fd',
                            padding: '12px',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}>
                            <div style={{ marginBottom: '6px' }}>
                              <strong>Expires:</strong> {expiryDate.toLocaleString()}
                            </div>
                            <div style={{ marginBottom: '6px' }}>
                              <strong>Time Remaining:</strong>
                              <span style={{
                                color: isExpiringSoon ? '#d68910' : '#28a745',
                                fontWeight: 'bold',
                                marginLeft: '5px'
                              }}>
                                {hoursRemaining}h {minutesRemaining}m
                              </span>
                            </div>
                            <div>
                              <strong>Generated:</strong> {new Date(tempCode.createdAt).toLocaleString()}
                            </div>
                          </div>

                          {isExpiringSoon && (
                            <div style={{
                              marginTop: '10px',
                              padding: '8px',
                              backgroundColor: '#d4910',
                              color: '#856404',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              textAlign: 'center'
                            }}>
                              ⚠️ EXPIRING SOON - Less than 2 hours remaining!
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '20px',
              borderTop: '1px solid #dee2e6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '14px', color: '#666' }}>
                Tip: Temporary codes automatically delete when they expire
              </div>
              <button
                onClick={closeTempCodesListModal}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {showEditFormModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 2000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '0',
            width: '90%',
            maxWidth: '900px',
            maxHeight: '90vh',
            border: '2px solid #000',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              backgroundColor: '#000',
              color: '#fff',
              padding: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                Edit Assessment Form: {editingForm?.code}
              </h2>
              <button
                onClick={closeEditFormModal}
                style={{
                  backgroundColor: 'transparent',
                  color: '#fff',
                  border: '1px solid #fff',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  borderRadius: '4px'
                }}
              >
                × Close
              </button>
            </div>

            {/* Modal Content */}
            <div style={{
              padding: '20px 30px',
              flex: 1,
              overflowY: 'auto',
              minHeight: 0
            }}>
              {/* Form Title */}
              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                  Assessment Title *
                </label>
                <input
                  type="text"
                  value={editFormTitle}
                  onChange={(e) => setEditFormTitle(e.target.value)}
                  placeholder="Enter assessment title"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #000',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                />
              </div>

              {/* Assessment Title (Malay) */}
              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block', fontStyle: 'italic' }}>
                  Assessment Title (Bahasa Melayu)
                </label>
                <input
                  type="text"
                  value={editFormTitleMalay}
                  onChange={(e) => setEditFormTitleMalay(e.target.value)}
                  placeholder="Masukkan tajuk penilaian dalam Bahasa Melayu"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '16px',
                    fontStyle: 'italic'
                  }}
                />
              </div>

              {/* Sub-Title */}
              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                  Sub-Title (Optional)
                </label>
                <input
                  type="text"
                  value={editFormSubtitle}
                  onChange={(e) => setEditFormSubtitle(e.target.value)}
                  placeholder="e.g., Level 1 Certification, Beginner Course"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Sub-Title (Malay) */}
              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block', fontStyle: 'italic' }}>
                  Sub-Title (Bahasa Melayu)
                </label>
                <input
                  type="text"
                  value={editFormSubtitleMalay}
                  onChange={(e) => setEditFormSubtitleMalay(e.target.value)}
                  placeholder="Cth: Pensijilan Tahap 1, Kursus Pemula"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontStyle: 'italic'
                  }}
                />
              </div>

              {/* Time Limit */}
              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                  Time Limit (minutes) *
                </label>
                <input
                  type="number"
                  value={editFormTimeLimit}
                  onChange={(e) => setEditFormTimeLimit(parseInt(e.target.value) || 30)}
                  min="1"
                  max="180"
                  style={{
                    width: '200px',
                    padding: '12px',
                    border: '2px solid #000',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                />
              </div>

              {/* Passing Score */}
              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                  Passing Score (%) *
                </label>
                <input
                  type="number"
                  value={editFormPassingScore}
                  onChange={(e) => setEditFormPassingScore(parseInt(e.target.value) || 70)}
                  min="1"
                  max="100"
                  style={{
                    width: '200px',
                    padding: '12px',
                    border: '2px solid #000',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                />
                <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  Minimum percentage score required to pass the assessment
                </small>
              </div>

              {/* Questions Section */}
              <div style={{ marginBottom: '25px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                    Questions ({editFormQuestions.length})
                  </h3>
                  <button
                    onClick={addEditQuestion}
                    style={{
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      padding: '10px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    + Add Question
                  </button>
                </div>

                {editFormQuestions.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#666',
                    border: '2px dashed #ccc',
                    borderRadius: '8px'
                  }}>
                    <p>No questions yet. Click "Add Question" to get started.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '20px' }}>
                    {editFormQuestions.map((question, index) => (
                      <div key={question.id || index} style={{
                        border: '2px solid #000',
                        borderRadius: '8px',
                        padding: '20px',
                        backgroundColor: '#f9f9f9'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                            Question {index + 1}
                          </h4>
                          <button
                            onClick={() => removeEditQuestion(index)}
                            style={{
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Remove
                          </button>
                        </div>

                        {/* Section */}
                        <div className="form-group" style={{ marginBottom: '15px' }}>
                          <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Section</label>
                          <input
                            type="text"
                            value={question.section}
                            onChange={(e) => updateEditQuestion(index, 'section', e.target.value)}
                            placeholder="e.g., Rules, Equipment, Scoring"
                            style={{
                              width: '100%',
                              padding: '10px',
                              border: '1px solid #ccc',
                              borderRadius: '4px',
                              fontSize: '14px'
                            }}
                          />
                        </div>

                        {/* Question Text */}
                        <div className="form-group" style={{ marginBottom: '15px' }}>
                          <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Question</label>
                          <textarea
                            value={question.question}
                            onChange={(e) => updateEditQuestion(index, 'question', e.target.value)}
                            placeholder="Enter your question here"
                            rows="3"
                            style={{
                              width: '100%',
                              padding: '10px',
                              border: '1px solid #ccc',
                              borderRadius: '4px',
                              fontSize: '14px',
                              resize: 'vertical'
                            }}
                          />
                        </div>

                        {/* Question Text (Malay) */}
                        <div className="form-group" style={{ marginBottom: '15px' }}>
                          <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block', fontStyle: 'italic' }}>Question (Bahasa Melayu)</label>
                          <textarea
                            value={question.questionMalay || ''}
                            onChange={(e) => updateEditQuestion(index, 'questionMalay', e.target.value)}
                            placeholder="Masukkan soalan dalam Bahasa Melayu di sini"
                            rows="3"
                            style={{
                              width: '100%',
                              padding: '10px',
                              border: '1px solid #ccc',
                              borderRadius: '4px',
                              fontSize: '14px',
                              fontStyle: 'italic',
                              resize: 'vertical'
                            }}
                          />
                        </div>

                        {/* Options */}
                        <div className="form-group" style={{ marginBottom: '15px' }}>
                          <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Answer Options</label>
                          <div style={{ display: 'grid', gap: '8px' }}>
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '15px', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                  <span style={{ fontWeight: 'bold', minWidth: '30px', fontSize: '16px' }}>
                                    {String.fromCharCode(65 + optionIndex)}:
                                  </span>
                                </div>

                                {/* English Option */}
                                <div style={{ marginBottom: '10px' }}>
                                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', display: 'block', marginBottom: '4px' }}>
                                    English *
                                  </label>
                                  <input
                                    type="text"
                                    value={typeof option === 'string' ? option : option.text}
                                    onChange={(e) => {
                                      const newOptions = [...question.options];
                                      if (typeof newOptions[optionIndex] === 'string') {
                                        newOptions[optionIndex] = { text: e.target.value, malay: '' };
                                      } else {
                                        newOptions[optionIndex] = { ...newOptions[optionIndex], text: e.target.value };
                                      }
                                      updateEditQuestion(index, 'options', newOptions);
                                    }}
                                    placeholder={`Option ${String.fromCharCode(65 + optionIndex)} in English`}
                                    style={{
                                      width: '100%',
                                      padding: '8px',
                                      border: '1px solid #ccc',
                                      borderRadius: '4px',
                                      fontSize: '14px'
                                    }}
                                  />
                                </div>

                                {/* Malay Option */}
                                <div>
                                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', display: 'block', marginBottom: '4px', fontStyle: 'italic' }}>
                                    Bahasa Melayu
                                  </label>
                                  <input
                                    type="text"
                                    value={typeof option === 'object' ? (option.malay || '') : ''}
                                    onChange={(e) => {
                                      const newOptions = [...question.options];
                                      if (typeof newOptions[optionIndex] === 'string') {
                                        newOptions[optionIndex] = { text: newOptions[optionIndex], malay: e.target.value };
                                      } else {
                                        newOptions[optionIndex] = { ...newOptions[optionIndex], malay: e.target.value };
                                      }
                                      updateEditQuestion(index, 'options', newOptions);
                                    }}
                                    placeholder={`Pilihan ${String.fromCharCode(65 + optionIndex)} dalam Bahasa Melayu`}
                                    style={{
                                      width: '100%',
                                      padding: '8px',
                                      border: '1px solid #ccc',
                                      borderRadius: '4px',
                                      fontSize: '14px',
                                      fontStyle: 'italic'
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Correct Answer */}
                        <div className="form-group">
                          <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Correct Answer</label>
                          <select
                            value={question.correctAnswer}
                            onChange={(e) => updateEditQuestion(index, 'correctAnswer', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px',
                              border: '1px solid #ccc',
                              borderRadius: '4px',
                              fontSize: '14px'
                            }}
                          >
                            <option value="">Select correct answer</option>
                            {question.options.map((option, optionIndex) => (
                              <option key={optionIndex} value={typeof option === 'string' ? option : option.text}>
                                {String.fromCharCode(65 + optionIndex)}: {typeof option === 'string' ? option : option.text}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '20px',
              borderTop: '1px solid #dee2e6',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              flexShrink: 0
            }}>
              <button
                onClick={closeEditFormModal}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveEditedForm}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submission Details Modal */}
      {showSubmissionModal && selectedSubmission && (
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
          zIndex: 9999,
          padding: '20px'
        }} onClick={() => setShowSubmissionModal(false)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '0',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column'
          }} onClick={(e) => e.stopPropagation()}>

            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #dee2e6',
              backgroundColor: '#f8f9fa'
            }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#212529' }}>
                Assessment Submission Details
              </h3>
            </div>

            {/* Modal Content */}
            <div style={{
              padding: '24px',
              overflow: 'auto',
              flex: 1
            }}>

              {/* User Information */}
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '24px',
                border: '1px solid #dee2e6'
              }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold', color: '#495057' }}>
                  Participant Information
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                  <div>
                    <strong>Name:</strong> {selectedSubmission.userInfo?.fullName || selectedSubmission.participantName || 'Unknown'}
                  </div>
                  <div>
                    <strong>IC Number:</strong> {selectedSubmission.userInfo?.icNumber || 'N/A'}
                  </div>
                  <div>
                    <strong>Form Code:</strong> {selectedSubmission.userInfo?.formCode || selectedSubmission.formCode || 'N/A'}
                  </div>
                  <div>
                    <strong>Submission Date:</strong> {new Date(selectedSubmission.submittedAt || selectedSubmission.completedAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Score Information */}
              <div style={{
                backgroundColor: '#fff',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '24px',
                border: '1px solid #dee2e6'
              }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold', color: '#495057' }}>
                  Assessment Results
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <strong>Score:</strong> {selectedSubmission.results?.score || selectedSubmission.correctAnswers || 0} / {selectedSubmission.results?.totalQuestions || selectedSubmission.totalQuestions || 0}
                  </div>
                  <div>
                    <strong>Percentage:</strong> {selectedSubmission.results?.percentage || selectedSubmission.score || 0}%
                  </div>
                  <div>
                    <strong>Status:</strong>
                    <span style={{
                      marginLeft: '8px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: (selectedSubmission.results?.percentage || selectedSubmission.score || 0) >= 70 ? '#28a745' : '#dc3545',
                      color: 'white'
                    }}>
                      {(selectedSubmission.results?.percentage || selectedSubmission.score || 0) >= 70 ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                  <div>
                    <strong>Time Spent:</strong> {Math.floor((selectedSubmission.results?.timeSpent || selectedSubmission.timeSpent || 0) / 60)}m {(selectedSubmission.results?.timeSpent || selectedSubmission.timeSpent || 0) % 60}s
                  </div>
                </div>
              </div>

              {/* Enhanced Answers Details with Questions */}
              {(selectedSubmission.results?.answers || selectedSubmission.answers) && (Array.isArray(selectedSubmission.answers) ? selectedSubmission.answers.length > 0 : Object.keys(selectedSubmission.results?.answers || selectedSubmission.answers || {}).length > 0) && (
                <div style={{
                  backgroundColor: '#fff',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6',
                  maxHeight: '60vh',
                  overflow: 'auto'
                }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold', color: '#495057' }}>
                    Question Review & Answers
                  </h4>
                  <div style={{ display: 'grid', gap: '20px' }}>
                    {(() => {
                      // Handle both array and object formats for answers
                      let answersToDisplay = [];

                      // Find the correct form based on the submission's formCode
                      const submissionFormCode = selectedSubmission.userInfo?.formCode || selectedSubmission.formCode;
                      const submissionForm = savedAssessmentForms.find(form => form.code === submissionFormCode);
                      const questionsToUse = submissionForm?.questions || [];

                      if (Array.isArray(selectedSubmission.answers)) {
                        // Database format: answers is an array
                        answersToDisplay = selectedSubmission.answers.map((answerObj, index) => {
                          const question = questionsToUse.find(q => q.id === answerObj.questionId);
                          const correctAnswer = question?.correctAnswer || '';
                          // Normalize strings by trimming whitespace and comparing case-insensitively
                          const normalizedUserAnswer = (answerObj.selectedAnswer || '').toString().trim().toLowerCase();
                          const normalizedCorrectAnswer = correctAnswer.toString().trim().toLowerCase();
                          const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;

                          return {
                            questionId: answerObj.questionId,
                            questionText: question?.question || `Question ${index + 1}`,
                            userAnswer: answerObj.selectedAnswer || 'No answer',
                            isCorrect: isCorrect,
                            correctAnswer: correctAnswer,
                            index: index
                          };
                        });
                      } else if (selectedSubmission.results?.answers || selectedSubmission.answers) {
                        // Local format: answers is an object
                        const answersObj = selectedSubmission.results?.answers || selectedSubmission.answers || {};
                        answersToDisplay = Object.entries(answersObj).map(([questionId, answer], index) => {
                          const question = questionsToUse.find(q => q.id === parseInt(questionId));
                          const correctAnswer = question?.correctAnswer || '';
                          const userAnswer = typeof answer === 'string' ? answer : (answer?.selectedAnswer || 'No answer');
                          // Normalize strings by trimming whitespace and comparing case-insensitively
                          const normalizedUserAnswer = userAnswer.toString().trim().toLowerCase();
                          const normalizedCorrectAnswer = correctAnswer.toString().trim().toLowerCase();
                          const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;

                          return {
                            questionId: questionId,
                            questionText: question?.question || `Question ${index + 1}`,
                            userAnswer: userAnswer,
                            isCorrect: isCorrect,
                            correctAnswer: correctAnswer,
                            index: index
                          };
                        });
                      }

                      return answersToDisplay.map((answerData) => {
                        return (
                        <div key={answerData.questionId} style={{
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          padding: '20px',
                          backgroundColor: answerData.isCorrect ? '#f0f8f0' : '#fff8f0'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            marginBottom: '15px'
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: '16px',
                                color: '#333',
                                marginBottom: '12px',
                                fontWeight: 'bold',
                                lineHeight: '1.4'
                              }}>
                                Q{answerData.index + 1}: {answerData.questionText}
                              </div>
                            </div>
                            <div style={{
                              backgroundColor: answerData.isCorrect ? '#28a745' : '#dc3545',
                              color: 'white',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              flexShrink: 0,
                              marginLeft: '16px'
                            }}>
                              {answerData.isCorrect ? 'CORRECT' : 'INCORRECT'}
                            </div>
                          </div>

                          <div style={{ marginBottom: '15px' }}>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: 'bold',
                              color: '#000',
                              marginBottom: '8px'
                            }}>
                              User's Answer:
                            </div>
                            <div style={{
                              padding: '10px 15px',
                              backgroundColor: answerData.isCorrect ? '#e8f5e8' : '#ffe8e8',
                              border: `1px solid ${answerData.isCorrect ? '#4caf50' : '#f44336'}`,
                              borderRadius: '6px',
                              fontSize: '14px',
                              fontWeight: '500'
                            }}>
                              {answerData.userAnswer}
                            </div>
                          </div>

                          {answerData.correctAnswer && (
                            <div>
                              <div style={{
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: '#000',
                                marginBottom: '8px'
                              }}>
                                Correct Answer:
                              </div>
                              <div style={{
                                padding: '10px 15px',
                                backgroundColor: '#e8f5e8',
                                border: '1px solid #4caf50',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '500'
                              }}>
                                {answerData.correctAnswer}
                              </div>
                            </div>
                          )}

                          <div style={{
                            marginTop: '12px',
                            fontSize: '12px',
                            color: '#666',
                            fontStyle: 'italic'
                          }}>
                            Question ID: {answerData.questionId}
                          </div>
                        </div>
                      );
                    })})()}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #dee2e6',
              backgroundColor: '#f8f9fa',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowSubmissionModal(false)}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Notice Modal */}
      {showSecurityNoticeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '0',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Modal Header */}
            <div style={{
              backgroundColor: '#dc3545',
              color: '#fff',
              padding: '20px',
              borderRadius: '10px 10px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                Important Security Guidelines
              </h2>
              <button
                onClick={handleCloseSecurityModal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '28px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{
              padding: '30px',
              fontSize: '16px',
              lineHeight: '1.6'
            }}>
              <div style={{
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '25px'
              }}>
                <h3 style={{
                  color: '#856404',
                  margin: '0 0 15px 0',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}>
                  Please read these security guidelines before saving your assessment:
                </h3>

                <div style={{ marginBottom: '15px' }}>
                  <strong style={{ color: '#dc3545' }}>1)</strong> Do not share the original assessment or assessment code with participants.
                </div>

                <div>
                  <strong style={{ color: '#dc3545' }}>2)</strong> Click the "Generate Temporary Code" button to obtain a code that starts with "T." This code will expire after 24 hours to ensure the system maintains the highest level of data integrity.
                </div>
              </div>

              <div style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                padding: '15px',
                fontSize: '14px',
                color: '#6c757d'
              }}>
                <strong>Why this matters:</strong> Using temporary codes ensures that assessment access is controlled and time-limited, preventing unauthorized access and maintaining the integrity of your assessment results.
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '20px',
              borderTop: '1px solid #dee2e6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <button
                onClick={handleCloseSecurityModal}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                I Understand - Save Assessment Form
              </button>
            </div>
          </div>
        </div>
      )}

      {/* More Info Required Modal */}
      {showMoreInfoModal && (
        <div className="modal-overlay" onClick={handleMoreInfoCancel}>
          <div className="modal-content rejection-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Request Additional Information</h2>
              <button className="close-btn" onClick={handleMoreInfoCancel}>×</button>
            </div>

            <div className="modal-body">
              <p className="rejection-warning">
                You are requesting additional information from the applicant. Please specify clearly what information is needed.
              </p>

              <div className="rejection-reason-input">
                <label htmlFor="requiredInfoDetails">Required Information Details *</label>
                <textarea
                  id="requiredInfoDetails"
                  value={requiredInfoDetails}
                  onChange={(e) => setRequiredInfoDetails(e.target.value)}
                  placeholder="Please specify what additional information is required (e.g., 'Please provide venue permits and insurance documentation', 'Need clarification on tournament format and age categories', etc.)..."
                  rows="5"
                  className="rejection-textarea"
                  required
                />
              </div>

              <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e8f4fd', borderRadius: '4px', fontSize: '14px' }}>
                <strong>💡 Tip:</strong> Be specific about what documents, details, or clarifications are needed. This will help the organizer provide the correct information quickly.
              </div>
            </div>

            <div className="modal-footer">
              <div className="button-group">
                <button
                  className="modal-btn modal-btn-cancel"
                  onClick={handleMoreInfoCancel}
                >
                  Cancel
                </button>
                <button
                  className="modal-btn modal-btn-approve"
                  onClick={handleMoreInfoSubmit}
                  disabled={!requiredInfoDetails.trim()}
                  style={{ backgroundColor: '#17a2b8', borderColor: '#17a2b8' }}
                >
                  Request Information
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Message to Organiser Modal */}
      {showMessageModal && (
        <div className="modal-overlay" onClick={handleCloseMessageModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
            maxWidth: '600px',
            width: '90%',
            backgroundColor: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <div className="modal-header" style={{
              padding: '20px',
              borderBottom: '1px solid #ddd',
              backgroundColor: '#f8f9fa',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, color: '#333', fontSize: '18px' }}>
                📧 Send Message to Organiser
              </h2>
              <button
                onClick={handleCloseMessageModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '0',
                  lineHeight: '1'
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              <form onSubmit={handleSendMessage}>
                {/* Recipient Information */}
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f4fd', borderRadius: '6px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#0056b3' }}>Message Recipient</h4>
                  <div style={{ fontSize: '14px' }}>
                    <strong>Organization:</strong> {messageData.recipientName}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    <strong>Email:</strong> {messageData.recipientEmail}
                  </div>
                  {messageData.relatedApplicationId && (
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      <strong>Related Application:</strong> {messageData.relatedApplicationId}
                    </div>
                  )}
                </div>

                {/* Priority & Category */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Priority Level *
                    </label>
                    <select
                      name="priority"
                      value={messageData.priority}
                      onChange={handleMessageInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                    >
                      <option value="low">🔵 Low</option>
                      <option value="normal">🟢 Normal</option>
                      <option value="high">🟠 High</option>
                      <option value="urgent">🔴 Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Category *
                    </label>
                    <select
                      name="category"
                      value={messageData.category}
                      onChange={handleMessageInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                    >
                      <option value="general">💬 General</option>
                      <option value="tournament">🏆 Tournament</option>
                      <option value="technical">⚙️ Technical</option>
                      <option value="urgent">⚡ Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Subject */}
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={messageData.subject}
                    onChange={handleMessageInputChange}
                    placeholder="Enter message subject"
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Message Content */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Message Content *
                  </label>
                  <textarea
                    name="content"
                    value={messageData.content}
                    onChange={handleMessageInputChange}
                    placeholder="Enter your message content here..."
                    required
                    rows="6"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    Be clear and concise in your message. The organiser will receive this via email and in their portal inbox.
                  </small>
                </div>

                {/* Error Message */}
                {messageError && (
                  <div style={{
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: '10px',
                    borderRadius: '4px',
                    marginBottom: '15px',
                    fontSize: '14px'
                  }}>
                    ⚠️ {messageError}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={handleCloseMessageModal}
                    disabled={isSendingMessage}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: isSendingMessage ? 'not-allowed' : 'pointer',
                      opacity: isSendingMessage ? 0.6 : 1
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingMessage || !messageData.subject.trim() || !messageData.content.trim()}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: isSendingMessage || !messageData.subject.trim() || !messageData.content.trim()
                        ? '#ccc'
                        : '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: isSendingMessage || !messageData.subject.trim() || !messageData.content.trim()
                        ? 'not-allowed'
                        : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {isSendingMessage ? (
                      <>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        📤 Send Message
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;