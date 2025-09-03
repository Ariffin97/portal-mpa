import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

const AdminDashboard = ({ setCurrentPage }) => {
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [pendingRejectionId, setPendingRejectionId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('Pending Review');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadApplications();
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

  const updateApplicationRemarks = (id, remarks) => {
    // Note: This is a local-only feature for now
    // In production, you'd want to save remarks to the database
    const updatedApplications = applications.map(app => 
      (app.id === id || app.applicationId === id) ? { ...app, remarks: remarks } : app
    );
    setApplications(updatedApplications);
  };


  const showApplicationDetails = (application) => {
    setSelectedApplication(application);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedApplication(null);
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
            <label>Export Format</label>
            <select>
              <option>Excel (.xlsx)</option>
              <option>CSV (.csv)</option>
              <option>PDF Report</option>
            </select>
          </div>
          <div className="setting-item">
            <label>Include Archived</label>
            <input type="checkbox" />
          </div>
          <button className="settings-btn">Export Data</button>
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
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.filter(app => selectedStatusFilter === 'All' || app.status === selectedStatusFilter)
                        .map((app, index) => {
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
                                <span 
                                  className="status-badge-table" 
                                  style={{ backgroundColor: getStatusColor(app.status) }}
                                >
                                  {app.status}
                                </span>
                              </td>
                              <td>{formatDate(app.lastUpdated || app.submissionDate)}</td>
                              <td>
                                <div className="table-actions">
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
        {currentView === 'settings' && renderSettings()}
      </div>

      {/* Application Details Modal */}
      {showModal && selectedApplication && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Application Details</h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            
            <div className="modal-body">
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
    </div>
  );
};

export default AdminDashboard;