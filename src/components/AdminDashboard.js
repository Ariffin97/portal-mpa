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


  useEffect(() => {
    loadApplications();
    loadApprovedTournaments();
    loadRegisteredOrganizations();
    loadAdminUsers();
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
        const updatedApplications = applications.map(app => 
          (app.id === id || app.applicationId === id) ? { ...app, status: newStatus } : app
        );
        setApplications(updatedApplications);
        
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
      'Event Date': app.eventDate || '',
      'Event Time': app.eventTime || '',
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
                    <span>{selectedApplication.eventDates || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Location:</label>
                    <span>{selectedApplication.location || 'Not provided'}</span>
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

    </div>
  );
};

export default AdminDashboard;