import React, { useState, useEffect } from 'react';

const AdminDashboard = ({ setCurrentPage }) => {
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    const saved = localStorage.getItem('tournamentApplications');
    if (saved) {
      setApplications(JSON.parse(saved));
    }
  }, []);

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

  const updateApplicationStatus = (id, newStatus) => {
    const updatedApplications = applications.map(app => 
      app.id === id ? { ...app, status: newStatus } : app
    );
    setApplications(updatedApplications);
    localStorage.setItem('tournamentApplications', JSON.stringify(updatedApplications));
  };

  const updateApplicationRemarks = (id, remarks) => {
    const updatedApplications = applications.map(app => 
      app.id === id ? { ...app, remarks: remarks } : app
    );
    setApplications(updatedApplications);
    localStorage.setItem('tournamentApplications', JSON.stringify(updatedApplications));
  };

  const deleteApplication = (id) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      const updatedApplications = applications.filter(app => app.id !== id);
      setApplications(updatedApplications);
      localStorage.setItem('tournamentApplications', JSON.stringify(updatedApplications));
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
              <p className="dashboard-subtitle">Manage tournament applications</p>
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
                <div className="stat-number">{applications.filter(app => app.status === 'Approved').length}</div>
                <div className="stat-label">Approved</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{applications.filter(app => app.status === 'Rejected').length}</div>
                <div className="stat-label">Rejected</div>
              </div>
            </div>
          </>
        )}
        
        {currentView === 'applications' && (
          <>
            <div className="dashboard-header">
              <h2>Applications Management</h2>
              <p className="dashboard-subtitle">View and manage tournament applications</p>
            </div>

            <div className="applications-section">
              <h3>All Applications ({applications.length})</h3>
              {applications.length === 0 ? (
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
                        <th>Remarks</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((app, index) => (
                        <tr key={app.id}>
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
                              {app.id}
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
                          <td>
                            <input
                              type="text"
                              value={app.remarks || ''}
                              onChange={(e) => updateApplicationRemarks(app.id, e.target.value)}
                              placeholder="Add remarks..."
                              className="remarks-input"
                              disabled={app.status !== 'Rejected'}
                            />
                          </td>
                          <td>
                            <div className="table-actions">
                              <select 
                                value={app.status} 
                                onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                                className="status-select-table"
                              >
                                <option value="Pending Review">Pending Review</option>
                                <option value="Under Review">Under Review</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                              </select>
                              <button 
                                onClick={() => deleteApplication(app.id)}
                                className="delete-btn-table"
                                title="Delete Application"
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
              )}
            </div>
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
                    <span>{selectedApplication.id}</span>
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
    </div>
  );
};

export default AdminDashboard;