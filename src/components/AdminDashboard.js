import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

const AdminDashboard = ({ setCurrentPage }) => {
  const [applications, setApplications] = useState([]);
  const [approvedTournaments, setApprovedTournaments] = useState([]);
  const [registeredOrganizations, setRegisteredOrganizations] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [pendingRejectionId, setPendingRejectionId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
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

  // API Key Management States
  const [apiKeys, setApiKeys] = useState([]);
  const [newApiKey, setNewApiKey] = useState({
    name: '',
    permission: '',
    expiration: '90',
    ipRestrictions: ''
  });
  const [generatedKey, setGeneratedKey] = useState(null);
  const [showGeneratedKey, setShowGeneratedKey] = useState(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);

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
    expectedParticipants: '',
    eventSummary: '',
    scoringFormat: 'traditional',
    dataConsent: false,
    termsConsent: false
  });

  const [isCreatingTournament, setIsCreatingTournament] = useState(false);
  const [createTournamentError, setCreateTournamentError] = useState('');
  const [tournamentCreated, setTournamentCreated] = useState(false);

  // Tournament Updates Tracking
  const [tournamentUpdates, setTournamentUpdates] = useState([]);
  const [isLoadingUpdates, setIsLoadingUpdates] = useState(false);

  // Sidebar Sub-menu state
  const [createTournamentExpanded, setCreateTournamentExpanded] = useState(false);

  // Calendar state
  const [selectedDate, setSelectedDate] = useState(new Date());
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
      default:
        return level;
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
          // Convert both dates to YYYY-MM-DD format for comparison
          const oldDateStr = oldValue ? new Date(oldValue).toISOString().split('T')[0] : '';
          const newDateStr = newValue ? (newValue.length === 10 ? newValue : new Date(newValue).toISOString().split('T')[0]) : '';
          
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
    const dateStr = date.toISOString().split('T')[0];
    return applications.filter(app => {
      const startDate = new Date(app.eventStartDate).toISOString().split('T')[0];
      const endDate = new Date(app.eventEndDate).toISOString().split('T')[0];
      return dateStr >= startDate && dateStr <= endDate;
    });
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(clickedDate);
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
        expectedParticipants: '',
        eventSummary: '',
        scoringFormat: 'traditional',
        dataConsent: false,
        termsConsent: false
      });
      
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

  // API Key Management Functions
  const generateApiKey = () => {
    const prefix = 'mpa_sk_';
    const randomPart = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15) +
                      Math.random().toString(36).substring(2, 15);
    return prefix + randomPart;
  };

  const handleApiKeyInputChange = (field, value) => {
    setNewApiKey(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGenerateApiKey = async () => {
    if (!newApiKey.name.trim() || !newApiKey.permission) {
      alert('Please fill in Key Name and Permission Level');
      return;
    }

    setIsGeneratingKey(true);
    
    try {
      // Generate the API key
      const keyValue = generateApiKey();
      const newKey = {
        id: Date.now().toString(),
        name: newApiKey.name,
        key: keyValue,
        permission: newApiKey.permission,
        expiration: newApiKey.expiration,
        ipRestrictions: newApiKey.ipRestrictions,
        createdAt: new Date().toISOString(),
        status: 'active',
        lastUsed: null
      };

      // Add to API keys list
      setApiKeys(prev => [...prev, newKey]);
      
      // Show the generated key
      setGeneratedKey(newKey);
      setShowGeneratedKey(true);
      
      // Reset form
      setNewApiKey({
        name: '',
        permission: '',
        expiration: '90',
        ipRestrictions: ''
      });

      // Here you would typically make an API call to save the key
      // await apiService.createApiKey(newKey);
      
    } catch (error) {
      console.error('Error generating API key:', error);
      alert('Failed to generate API key: ' + error.message);
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleCopyApiKey = (keyValue) => {
    navigator.clipboard.writeText(keyValue).then(() => {
      alert('API key copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy: ', err);
      alert('Failed to copy API key');
    });
  };

  const handleRegenerateApiKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to regenerate this API key? The old key will stop working immediately.')) {
      return;
    }

    try {
      const newKeyValue = generateApiKey();
      setApiKeys(prev => prev.map(key => 
        key.id === keyId 
          ? { ...key, key: newKeyValue, createdAt: new Date().toISOString(), lastUsed: null }
          : key
      ));
      
      // Show the regenerated key
      const updatedKey = apiKeys.find(k => k.id === keyId);
      if (updatedKey) {
        setGeneratedKey({ ...updatedKey, key: newKeyValue });
        setShowGeneratedKey(true);
      }
      
      alert('API key regenerated successfully!');
      
      // Here you would typically make an API call to update the key
      // await apiService.regenerateApiKey(keyId, newKeyValue);
      
    } catch (error) {
      console.error('Error regenerating API key:', error);
      alert('Failed to regenerate API key: ' + error.message);
    }
  };

  const handleRevokeApiKey = async (keyId, keyName) => {
    if (!window.confirm(`Are you sure you want to revoke the API key "${keyName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setApiKeys(prev => prev.filter(key => key.id !== keyId));
      alert('API key revoked successfully!');
      
      // Here you would typically make an API call to revoke the key
      // await apiService.revokeApiKey(keyId);
      
    } catch (error) {
      console.error('Error revoking API key:', error);
      alert('Failed to revoke API key: ' + error.message);
    }
  };

  const getPermissionDisplayName = (permission) => {
    switch (permission) {
      case 'read': return 'Read Only';
      case 'write': return 'Read/Write';
      case 'admin': return 'Admin';
      default: return permission;
    }
  };

  const renderAnalytics = () => (
    <div className="analytics-view">
      <div className="dashboard-header">
        <h2>Analytics Dashboard</h2>
        <p className="dashboard-subtitle">Tournament application insights and statistics</p>
      </div>

      <div className="analytics-stats">
        <div className="analytics-card">
          <div className="analytics-icon"></div>
          <div className="analytics-content">
            <div className="analytics-number">{applications.length}</div>
            <div className="analytics-label">Total Applications</div>
            <div className="analytics-change">+12% from last month</div>
          </div>
        </div>
        
        <div className="analytics-card">
          <div className="analytics-icon"></div>
          <div className="analytics-content">
            <div className="analytics-number">
              {((applications.filter(app => app.status === 'Approved').length / applications.length) * 100).toFixed(1)}%
            </div>
            <div className="analytics-label">Approval Rate</div>
            <div className="analytics-change">+5% from last month</div>
          </div>
        </div>
        
        <div className="analytics-card">
          <div className="analytics-icon"></div>
          <div className="analytics-content">
            <div className="analytics-number">2.3</div>
            <div className="analytics-label">Avg. Processing Days</div>
            <div className="analytics-change">-0.5 days improved</div>
          </div>
        </div>
        
        <div className="analytics-card">
          <div className="analytics-icon"></div>
          <div className="analytics-content">
            <div className="analytics-number">
              {applications.reduce((sum, app) => sum + parseInt(app.expectedParticipants || 0), 0)}
            </div>
            <div className="analytics-label">Total Expected Participants</div>
            <div className="analytics-change">+18% from last month</div>
          </div>
        </div>
      </div>

      <div className="analytics-charts">
        <div className="chart-card">
          <h3>Application Status Distribution</h3>
          <div className="chart-placeholder">
            <p>Chart visualization would be displayed here</p>
            <p>Status breakdown: Pending ({applications.filter(app => app.status === 'Pending Review').length}), 
               Approved ({applications.filter(app => app.status === 'Approved').length}), 
               Rejected ({applications.filter(app => app.status === 'Rejected').length})</p>
          </div>
        </div>
        
        <div className="chart-card">
          <h3>Applications Over Time</h3>
          <div className="chart-placeholder">
            <p>Timeline chart would be displayed here</p>
            <p>Showing application submission trends over the past 6 months</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRegisteredOrganizations = () => (
    <div className="registered-organizations-view">
      <div className="dashboard-header">
        <h2>Registered Organizations</h2>
        <p className="dashboard-subtitle">Organizations that have successfully registered in the system</p>
      </div>

      {registeredOrganizations.length === 0 ? (
        <div className="no-organizations">
          <p>No registered organizations found.</p>
          <p>Organizations will appear here once they complete the registration process.</p>
        </div>
      ) : (
        <div className="organizations-table-container">
          <table className="applications-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Organization ID</th>
                <th>Organization Name</th>
                <th>Applicant Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {registeredOrganizations.map((org, index) => (
                <tr key={org._id}>
                  <td>{index + 1}</td>
                  <td>
                    <span className="organization-id-badge" title="Unique Organization ID">
                      {org.organizationId}
                    </span>
                  </td>
                  <td>
                    <span 
                      className="organization-name-link clickable-link" 
                      onClick={() => showApplicationDetails(org)}
                      title="Click to view full organization details"
                    >
                      {org.organizationName}
                    </span>
                  </td>
                  <td>{org.applicantFullName}</td>
                  <td>{org.email}</td>
                  <td>
                    <span 
                      className={`status-badge-table ${org.status === 'suspended' ? 'suspended' : 'active'}`}
                      style={{ 
                        backgroundColor: org.status === 'suspended' ? '#dc3545' : '#28a745',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    >
                      {org.status === 'suspended' ? 'SUSPENDED' : 'ACTIVE'}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button 
                        onClick={() => showApplicationDetails(org)}
                        className="view-btn-table"
                        title="View Organization Details"
                      >
                        View Details
                      </button>
                      {org.status === 'suspended' ? (
                        <button 
                          onClick={() => handleUnsuspendOrganization(org._id, org.organizationName)}
                          className="unsuspend-btn-table"
                          title="Unsuspend Organization"
                        >
                          Unsuspend
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleSuspendOrganization(org._id, org.organizationName)}
                          className="suspend-btn-table"
                          title="Suspend Organization"
                        >
                          Suspend
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteOrganization(org._id, org.organizationName, org.organizationId)}
                        className="delete-btn-table danger"
                        title="Permanently Delete Organization"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
              </select>
              <small className="authority-info">
                • <strong>Super Admin:</strong> Full access to all features and settings<br/>
                • <strong>Admin:</strong> Standard admin access with limited system settings
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
          <div className="settings-card">
            <h3>Create API Key</h3>
            <p className="settings-description">Generate secure API keys for external integrations and third-party applications</p>
            <div className="setting-item">
              <label>Key Name *</label>
              <input 
                type="text" 
                placeholder="Enter descriptive name (e.g., External Tournament System)"
                value={newApiKey.name}
                onChange={(e) => handleApiKeyInputChange('name', e.target.value)}
              />
            </div>
            <div className="setting-item">
              <label>Permission Level *</label>
              <select
                value={newApiKey.permission}
                onChange={(e) => handleApiKeyInputChange('permission', e.target.value)}
              >
                <option value="">Select Permission Level</option>
                <option value="read">Read Only - View tournament data</option>
                <option value="write">Read/Write - Manage applications</option>
                <option value="admin">Admin - Full access (Super Admin only)</option>
              </select>
              <small className="api-info">
                • <strong>Read Only:</strong> Can retrieve tournament and application data<br/>
                • <strong>Read/Write:</strong> Can create and update tournament applications<br/>
                • <strong>Admin:</strong> Full API access including user management
              </small>
            </div>
            <div className="setting-item">
              <label>Expiration</label>
              <select
                value={newApiKey.expiration}
                onChange={(e) => handleApiKeyInputChange('expiration', e.target.value)}
              >
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="365">1 year</option>
                <option value="never">Never expires</option>
              </select>
            </div>
            <div className="setting-item">
              <label>IP Restrictions (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g., 192.168.1.0/24, 10.0.0.1 (comma separated)"
                value={newApiKey.ipRestrictions}
                onChange={(e) => handleApiKeyInputChange('ipRestrictions', e.target.value)}
              />
              <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '5px' }}>
                Leave empty for no IP restrictions
              </small>
            </div>
            <button 
              className="settings-btn api-key-btn"
              onClick={handleGenerateApiKey}
              disabled={isGeneratingKey}
            >
              {isGeneratingKey ? 'Generating...' : 'Generate API Key'}
            </button>
            

            {/* Existing API Keys List */}
            <div className="existing-api-keys" style={{ marginTop: '25px' }}>
              <h4>Existing API Keys ({apiKeys.length})</h4>
              {apiKeys.length === 0 ? (
                <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
                  No API keys created yet. Generate your first API key above.
                </p>
              ) : (
                <div className="api-keys-list">
                  {apiKeys.map((key) => (
                    <div key={key.id} className="api-key-item">
                      <div className="key-info">
                        <span className="key-name">{key.name}</span>
                        <span className="key-permission">{getPermissionDisplayName(key.permission)}</span>
                        <span className="key-created">Created: {formatDate(key.createdAt)}</span>
                        <span className={`key-status ${key.status}`}>{key.status.toUpperCase()}</span>
                      </div>
                      <div className="key-actions">
                        <button 
                          className="key-action-btn"
                          onClick={() => handleRegenerateApiKey(key.id)}
                        >
                          Regenerate
                        </button>
                        <button 
                          className="key-action-btn danger"
                          onClick={() => handleRevokeApiKey(key.id, key.name)}
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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

  return (
    <div className="admin-dashboard">
      <div className="dashboard-sidebar">
        <div className="sidebar-nav">
          <button 
            className={`sidebar-nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
Dashboard
          </button>
          
          <button 
            className={`sidebar-nav-item ${currentView === 'calendar' ? 'active' : ''}`}
            onClick={() => setCurrentView('calendar')}
          >
Calendar
          </button>
          
          {/* Create Tournament with Sub-options */}
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
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>Create Tournament</span>
              <span style={{ fontSize: '12px', transition: 'transform 0.2s ease', transform: createTournamentExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                ▶
              </span>
            </button>
            
            {createTournamentExpanded && (
              <div className="sidebar-sub-menu" style={{ marginLeft: '20px' }}>
                <button 
                  className={`sidebar-nav-item sub-item ${currentView === 'create-tournament' ? 'active' : ''}`}
                  onClick={() => setCurrentView('create-tournament')}
                  style={{
                    fontSize: '14px',
                    padding: '8px 15px',
                    color: currentView === 'create-tournament' ? '#007bff' : '#6c757d',
                    backgroundColor: 'transparent'
                  }}
                >
                  New Tournament
                </button>
                <button 
                  className={`sidebar-nav-item sub-item ${currentView === 'edit-tournament' ? 'active' : ''}`}
                  onClick={() => setCurrentView('edit-tournament')}
                  style={{
                    fontSize: '14px',
                    padding: '8px 15px',
                    color: currentView === 'edit-tournament' ? '#007bff' : '#6c757d',
                    backgroundColor: 'transparent'
                  }}
                >
                  Edit Tournament
                </button>
              </div>
            )}
          </div>
          
          <button 
            className={`sidebar-nav-item ${currentView === 'applications' ? 'active' : ''}`}
            onClick={() => setCurrentView('applications')}
          >
Applications
          </button>
          <button 
            className={`sidebar-nav-item ${currentView === 'registered-organizations' ? 'active' : ''}`}
            onClick={() => setCurrentView('registered-organizations')}
          >
Registered Organizations
          </button>
          <button 
            className={`sidebar-nav-item ${currentView === 'analytics' ? 'active' : ''}`}
            onClick={() => setCurrentView('analytics')}
          >
Analytics
          </button>
          <button 
            className={`sidebar-nav-item ${currentView === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentView('settings')}
          >
Settings
          </button>
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
                    const isSelected = selectedDate.toDateString() === date.toDateString();
                    
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
                  {selectedDate.toLocaleDateString('default', { 
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
              <h2>Create Tournament</h2>
              <p className="dashboard-subtitle">Create and directly approve tournament applications</p>
            </div>

            {!tournamentCreated ? (
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
                  
                  <div className="form-group">
                    <label htmlFor="classification">Level/Type of Event *</label>
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
                  <h3>Important Consent & Agreement</h3>
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
                        <label htmlFor="edit-classification">Level/Type of Event *</label>
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

      {/* API Key Generated Modal */}
      {showGeneratedKey && generatedKey && (
        <div className="modal-overlay" onClick={() => setShowGeneratedKey(false)}>
          <div className="modal-content api-key-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>API Key Generated Successfully</h2>
              <button className="close-btn" onClick={() => setShowGeneratedKey(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="api-key-result">
                <div className="api-key-display">
                  <label>API Key:</label>
                  <div className="key-container">
                    <input type="text" value={generatedKey.key} readOnly />
                    <button className="copy-btn" onClick={() => handleCopyApiKey(generatedKey.key)}>
                      Copy
                    </button>
                  </div>
                </div>
                <div className="api-key-display">
                  <label>Key Name:</label>
                  <input type="text" value={generatedKey.name} readOnly />
                </div>
                <div className="api-key-display">
                  <label>Permission Level:</label>
                  <input type="text" value={getPermissionDisplayName(generatedKey.permission)} readOnly />
                </div>
                <div className="api-warning">
                  <strong>⚠️ Important:</strong> Save this key securely. For security reasons, you won't be able to view it again.
                </div>
                
                {/* API Usage Guide */}
                <div className="api-usage-guide" style={{ marginTop: '20px' }}>
                  <h4 style={{ color: '#374151', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px', marginBottom: '15px' }}>
                    API Usage Guide
                  </h4>
                  
                  <div className="guide-section">
                    <h5 style={{ color: '#1f2937', marginBottom: '10px' }}>Base URL</h5>
                    <div className="code-block">
                      <strong>Production:</strong> https://portalmpa.com/api<br/>
                      <strong>Development:</strong> http://localhost:5001/api
                    </div>
                  </div>

                  <div className="guide-section">
                    <h5 style={{ color: '#1f2937', marginBottom: '10px' }}>Authentication</h5>
                    <div className="code-block">
                      <strong>Header:</strong> Authorization: Bearer {generatedKey.key}
                    </div>
                  </div>

                  <div className="guide-section">
                    <h5 style={{ color: '#1f2937', marginBottom: '10px' }}>Available Endpoints ({getPermissionDisplayName(generatedKey.permission)})</h5>
                    {generatedKey.permission === 'read' && (
                      <div className="endpoints-list">
                        <div className="endpoint">GET /api/tournaments - Get all tournaments</div>
                        <div className="endpoint">GET /api/tournaments/{`{id}`} - Get tournament by ID</div>
                        <div className="endpoint">GET /api/organizations - Get all organizations</div>
                        <div className="endpoint">GET /api/applications - Get tournament applications</div>
                      </div>
                    )}
                    {generatedKey.permission === 'write' && (
                      <div className="endpoints-list">
                        <div className="endpoint">GET /api/tournaments - Get all tournaments</div>
                        <div className="endpoint">GET /api/organizations - Get all organizations</div>
                        <div className="endpoint">POST /api/applications - Create tournament application</div>
                        <div className="endpoint">PUT /api/applications/{`{id}`} - Update tournament application</div>
                        <div className="endpoint">POST /api/organizations - Create organization</div>
                      </div>
                    )}
                    {generatedKey.permission === 'admin' && (
                      <div className="endpoints-list">
                        <div className="endpoint">All Read/Write endpoints plus:</div>
                        <div className="endpoint">GET /api/admin/users - Get admin users</div>
                        <div className="endpoint">POST /api/admin/users - Create admin user</div>
                        <div className="endpoint">DELETE /api/admin/users/{`{id}`} - Delete admin user</div>
                      </div>
                    )}
                  </div>

                  <div className="guide-section">
                    <h5 style={{ color: '#1f2937', marginBottom: '10px' }}>Example Usage (JavaScript)</h5>
                    <div className="code-block">
{`const apiKey = '${generatedKey.key}';
const baseURL = 'https://portalmpa.com/api';

// Fetch tournaments
const response = await fetch(\`$\{baseURL}/tournaments\`, {
  method: 'GET',
  headers: {
    'Authorization': \`Bearer $\{apiKey}\`,
    'Content-Type': 'application/json'
  }
});

const tournaments = await response.json();
console.log(tournaments);`}
                    </div>
                  </div>

                  <div className="guide-section">
                    <h5 style={{ color: '#1f2937', marginBottom: '10px' }}>Example Usage (Python)</h5>
                    <div className="code-block">
{`import requests

api_key = '${generatedKey.key}'
headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

response = requests.get('https://portalmpa.com/api/tournaments', headers=headers)
tournaments = response.json()
print(tournaments)`}
                    </div>
                  </div>

                  <div className="guide-section">
                    <h5 style={{ color: '#1f2937', marginBottom: '10px' }}>Security Best Practices</h5>
                    <ul className="security-list">
                      <li>Store API keys in environment variables, not in code</li>
                      <li>Use HTTPS only in production</li>
                      <li>Monitor API usage regularly</li>
                      <li>Set IP restrictions if accessing from fixed servers</li>
                      <li>Regenerate keys periodically for security</li>
                    </ul>
                  </div>

                  <div className="guide-section">
                    <h5 style={{ color: '#1f2937', marginBottom: '10px' }}>Error Handling</h5>
                    <div className="code-block">
{`// Handle common API errors
if (response.status === 401) {
  throw new Error('Invalid API key');
}
if (response.status === 403) {
  throw new Error('Insufficient permissions');
}
if (response.status === 429) {
  throw new Error('Rate limit exceeded');
}`}
                    </div>
                  </div>

                  {generatedKey.ipRestrictions && (
                    <div className="guide-section">
                      <h5 style={{ color: '#1f2937', marginBottom: '10px' }}>IP Restrictions</h5>
                      <div className="code-block">
                        <strong>Allowed IPs:</strong> {generatedKey.ipRestrictions}
                      </div>
                    </div>
                  )}

                  <div className="guide-section">
                    <h5 style={{ color: '#1f2937', marginBottom: '10px' }}>Key Details</h5>
                    <div className="key-details">
                      <div><strong>Created:</strong> {formatDate(generatedKey.createdAt)}</div>
                      <div><strong>Expires:</strong> {generatedKey.expiration === 'never' ? 'Never' : `${generatedKey.expiration} days from creation`}</div>
                      <div><strong>Status:</strong> <span style={{color: '#16a34a', textTransform: 'uppercase'}}>{generatedKey.status}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="settings-btn"
                onClick={() => {
                  const guideText = document.querySelector('.api-usage-guide').innerText;
                  navigator.clipboard.writeText(`API Key: ${generatedKey.key}\n\n${guideText}`);
                  alert('API key and guide copied to clipboard!');
                }}
                style={{ background: '#059669', marginRight: '10px' }}
              >
                Copy Key + Guide
              </button>
              <button 
                className="settings-btn" 
                onClick={() => setShowGeneratedKey(false)}
                style={{ background: '#6b7280' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;