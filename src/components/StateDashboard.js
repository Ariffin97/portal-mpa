import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

const StateDashboard = ({ setCurrentPage, userData, setIsStateLoggedIn }) => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedStatusFolder, setSelectedStatusFolder] = useState('Pending Review');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedNewStatus, setSelectedNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [showStatusNotes, setShowStatusNotes] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [cardStatusApp, setCardStatusApp] = useState(null);
  const [cardStatusValue, setCardStatusValue] = useState('');

  // Get state name from userData (Sarawak for now)
  const stateName = userData?.stateName || 'Sarawak';

  const handleLogout = () => {
    setIsStateLoggedIn(false);
    localStorage.removeItem('isStateLoggedIn');
    localStorage.removeItem('stateUserData');
    localStorage.removeItem('stateLoginTimestamp');
    setCurrentPage('home');
  };

  // Fetch applications filtered by state
  const loadApplications = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiService.getAllApplications();
      // Filter applications for this state only
      const stateApplications = data.filter(app =>
        app.state && app.state.toLowerCase() === stateName.toLowerCase()
      );
      setApplications(stateApplications);
    } catch (err) {
      console.error('Error loading applications:', err);
      setError('Failed to load applications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load applications when switching to tournament management view
  useEffect(() => {
    if (currentView === 'tournaments') {
      loadApplications();
    }
  }, [currentView]);

  // Get applications by status
  const getApplicationsByStatus = (status) => {
    return applications.filter(app => app.status === status);
  };

  // Status folder counts
  const statusCounts = {
    'Pending Review': getApplicationsByStatus('Pending Review').length,
    'Under Review': getApplicationsByStatus('Under Review').length,
    'More Info Required': getApplicationsByStatus('More Info Required').length,
    'Approved': getApplicationsByStatus('Approved').length,
    'Rejected': getApplicationsByStatus('Rejected').length
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending Review': return 'status-pending';
      case 'Under Review': return 'status-review';
      case 'More Info Required': return 'status-info-required';
      case 'Approved': return 'status-approved';
      case 'Rejected': return 'status-rejected';
      default: return 'status-pending';
    }
  };

  // View application details
  const viewApplication = (application) => {
    setSelectedApplication(application);
    setSelectedNewStatus('');
    setStatusNotes('');
    setShowStatusNotes(false);
    setError('');
    setShowApplicationModal(true);
  };

  // Check if application can be approved by state (District, Divisional, State levels)
  const isStateApprovalApplication = (app) => {
    if (!app || !app.classification) return false;
    const level = app.classification.toLowerCase();
    return level === 'district' || level === 'divisional' || level === 'state';
  };

  // Approve application (for state-level only)
  const handleApprove = async () => {
    if (!selectedApplication) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${apiService.baseURL}/applications/${selectedApplication.applicationId}/state-approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approvedBy: stateName,
          approvedByUser: userData?.username || 'State Admin'
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Application approved successfully!');
        setShowApplicationModal(false);
        loadApplications();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.message || 'Failed to approve application');
      }
    } catch (err) {
      console.error('Error approving application:', err);
      setError('Failed to approve application. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open reject modal
  const openRejectModal = () => {
    setRejectionReason('');
    setShowRejectModal(true);
  };

  // Reject application (for state-level only)
  const handleReject = async () => {
    if (!selectedApplication || !rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`${apiService.baseURL}/applications/${selectedApplication.applicationId}/state-reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rejectionReason: rejectionReason.trim(),
          rejectedBy: stateName,
          rejectedByUser: userData?.username || 'State Admin'
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Application rejected successfully!');
        setShowRejectModal(false);
        setShowApplicationModal(false);
        setRejectionReason('');
        loadApplications();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.message || 'Failed to reject application');
      }
    } catch (err) {
      console.error('Error rejecting application:', err);
      setError('Failed to reject application. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle status dropdown change
  const handleStatusDropdownChange = (newStatus) => {
    setSelectedNewStatus(newStatus);
    setStatusNotes('');
    // Show notes field for Rejected and More Info Required
    if (newStatus === 'Rejected' || newStatus === 'More Info Required') {
      setShowStatusNotes(true);
    } else {
      setShowStatusNotes(false);
    }
  };

  // Submit status change
  const handleStatusChange = async () => {
    if (!selectedApplication || !selectedNewStatus) {
      setError('Please select a status');
      return;
    }

    // Validate notes for Rejected and More Info Required
    if (selectedNewStatus === 'Rejected' && statusNotes.trim().length < 10) {
      setError('Please provide a detailed rejection reason (at least 10 characters)');
      return;
    }
    if (selectedNewStatus === 'More Info Required' && statusNotes.trim().length < 5) {
      setError('Please specify what additional information is needed');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiService.baseURL}/applications/${selectedApplication.applicationId}/state-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: selectedNewStatus,
          stateName: stateName,
          stateUser: userData?.username || 'State Admin',
          notes: statusNotes.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(`Status updated to "${selectedNewStatus}" successfully!`);
        setShowApplicationModal(false);
        setSelectedNewStatus('');
        setStatusNotes('');
        setShowStatusNotes(false);
        loadApplications();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle card-level status dropdown change
  const handleCardStatusChange = async (app, newStatus) => {
    if (!app || !newStatus || newStatus === app.status) return;

    // For Rejected and More Info Required, show notes modal
    if (newStatus === 'Rejected' || newStatus === 'More Info Required') {
      setCardStatusApp(app);
      setCardStatusValue(newStatus);
      setStatusNotes('');
      setShowNotesModal(true);
      return;
    }

    // For other statuses, update directly
    setActionLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiService.baseURL}/applications/${app.applicationId}/state-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          stateName: stateName,
          stateUser: userData?.username || 'State Admin',
          notes: ''
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(`Status updated to "${newStatus}" successfully!`);
        loadApplications();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.message || 'Failed to update status');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status. Please try again.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit status change with notes from card
  const handleCardStatusSubmit = async () => {
    if (!cardStatusApp || !cardStatusValue) return;

    // Validate notes
    if (cardStatusValue === 'Rejected' && statusNotes.trim().length < 10) {
      setError('Please provide a detailed rejection reason (at least 10 characters)');
      return;
    }
    if (cardStatusValue === 'More Info Required' && statusNotes.trim().length < 5) {
      setError('Please specify what additional information is needed');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiService.baseURL}/applications/${cardStatusApp.applicationId}/state-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: cardStatusValue,
          stateName: stateName,
          stateUser: userData?.username || 'State Admin',
          notes: statusNotes.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(`Status updated to "${cardStatusValue}" successfully!`);
        setShowNotesModal(false);
        setCardStatusApp(null);
        setCardStatusValue('');
        setStatusNotes('');
        loadApplications();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Render dashboard view
  const renderDashboard = () => (
    <>
      <div className="state-info-section">
        <h3>Your State Information</h3>
        <div className="info-cards">
          <div className="info-card">
            <div className="info-icon">📍</div>
            <div className="info-details">
              <span className="info-label">State</span>
              <span className="info-value">{userData?.stateName || 'N/A'}</span>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon">👤</div>
            <div className="info-details">
              <span className="info-label">Username</span>
              <span className="info-value">{userData?.username || 'N/A'}</span>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon">✉️</div>
            <div className="info-details">
              <span className="info-label">Email</span>
              <span className="info-value">{userData?.email || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="quick-actions-section">
        <h3>Quick Actions</h3>
        <div className="feature-cards">
          <div className="feature-card clickable" onClick={() => setCurrentView('tournaments')}>
            <div className="feature-icon">📋</div>
            <h4>Tournament Management</h4>
            <p>View and manage tournament applications in {stateName}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h4>State Statistics</h4>
            <p>View statistics and reports for your state</p>
            <span className="coming-soon-badge">Coming Soon</span>
          </div>
          <div className="feature-card">
            <div className="feature-icon">✉️</div>
            <h4>Communications</h4>
            <p>Send and receive messages from MPA</p>
            <span className="coming-soon-badge">Coming Soon</span>
          </div>
        </div>
      </div>
    </>
  );

  // Render tournament management view
  const renderTournamentManagement = () => (
    <div className="tournament-management">
      {error && <div className="error-message">{error}</div>}

      <div className="status-folders">
        <div
          className={`status-folder ${selectedStatusFolder === 'Pending Review' ? 'active' : ''}`}
          onClick={() => setSelectedStatusFolder('Pending Review')}
        >
          <div className="folder-info">
            <span className="folder-name">Pending Review</span>
            <span className="folder-count">{statusCounts['Pending Review']}</span>
          </div>
        </div>
        <div
          className={`status-folder ${selectedStatusFolder === 'Under Review' ? 'active' : ''}`}
          onClick={() => setSelectedStatusFolder('Under Review')}
        >
          <div className="folder-info">
            <span className="folder-name">Under Review</span>
            <span className="folder-count">{statusCounts['Under Review']}</span>
          </div>
        </div>
        <div
          className={`status-folder ${selectedStatusFolder === 'More Info Required' ? 'active' : ''}`}
          onClick={() => setSelectedStatusFolder('More Info Required')}
        >
          <div className="folder-info">
            <span className="folder-name">More Info Required</span>
            <span className="folder-count">{statusCounts['More Info Required']}</span>
          </div>
        </div>
        <div
          className={`status-folder ${selectedStatusFolder === 'Approved' ? 'active' : ''}`}
          onClick={() => setSelectedStatusFolder('Approved')}
        >
          <div className="folder-info">
            <span className="folder-name">Approved</span>
            <span className="folder-count">{statusCounts['Approved']}</span>
          </div>
        </div>
        <div
          className={`status-folder ${selectedStatusFolder === 'Rejected' ? 'active' : ''}`}
          onClick={() => setSelectedStatusFolder('Rejected')}
        >
          <div className="folder-info">
            <span className="folder-name">Rejected</span>
            <span className="folder-count">{statusCounts['Rejected']}</span>
          </div>
        </div>
      </div>

      <div className="applications-list">
        <h3>{selectedStatusFolder} Applications ({statusCounts[selectedStatusFolder]})</h3>

        {isLoading ? (
          <div className="loading-spinner">Loading applications...</div>
        ) : getApplicationsByStatus(selectedStatusFolder).length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>No {selectedStatusFolder.toLowerCase()} applications found for {stateName}.</p>
          </div>
        ) : (
          <div className="tournament-cards-grid">
            {getApplicationsByStatus(selectedStatusFolder).map((app) => (
              <div key={app._id || app.id} className="tournament-card">
                <div className="tournament-card-header">
                  <h4 className="tournament-title">{app.eventTitle || 'N/A'}</h4>
                  <span className={`tournament-status-badge ${getStatusBadgeClass(app.status)}`}>
                    {app.status}
                  </span>
                </div>

                <div className="tournament-card-body">
                  <div className="tournament-info-row">
                    <div className="tournament-info-item">
                      <div className="info-content">
                        <span className="info-label">Organiser</span>
                        <span className="info-value">{app.organiserName || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="tournament-info-item">
                      <div className="info-content">
                        <span className="info-label">Location</span>
                        <span className="info-value">{app.city || 'N/A'}, {app.state || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="tournament-info-row">
                    <div className="tournament-info-item">
                      <div className="info-content">
                        <span className="info-label">Event Date</span>
                        <span className="info-value">{formatDate(app.eventStartDate)}</span>
                      </div>
                    </div>
                    <div className="tournament-info-item">
                      <div className="info-content">
                        <span className="info-label">Level</span>
                        <span className="info-value">{app.classification || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="tournament-info-row single">
                    <div className="tournament-info-item">
                      <div className="info-content">
                        <span className="info-label">Venue</span>
                        <span className="info-value">{app.venue || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="tournament-card-footer">
                  <span className="submitted-date">
                    Submitted: {formatDate(app.submittedAt || app.createdAt)}
                  </span>
                  <div className="card-actions">
                    {isStateApprovalApplication(app) && (
                      <div className="card-status-dropdown">
                        <label>Status:</label>
                        <select
                          value={app.status}
                          onChange={(e) => handleCardStatusChange(app, e.target.value)}
                          disabled={actionLoading}
                          className="status-select"
                        >
                          <option value="Pending Review">Pending Review</option>
                          <option value="Under Review">Under Review</option>
                          <option value="More Info Required">More Info Required</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    )}
                    <button
                      className="view-details-btn"
                      onClick={() => viewApplication(app)}
                    >
                      Detail
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Render application details modal
  const renderApplicationModal = () => {
    if (!selectedApplication) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowApplicationModal(false)}>
        <div className="modal-content application-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Application Details</h2>
            <button className="modal-close-btn" onClick={() => setShowApplicationModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <div className="application-status-banner">
              <span className={`status-badge ${getStatusBadgeClass(selectedApplication.status)}`}>
                {selectedApplication.status}
              </span>
            </div>

            <div className="detail-section">
              <h3>Tournament Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Event Title</label>
                  <span>{selectedApplication.eventTitle || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Event Type</label>
                  <span>{selectedApplication.eventType || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Classification</label>
                  <span>{selectedApplication.classification || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Event Start Date</label>
                  <span>{formatDate(selectedApplication.eventStartDate)}</span>
                </div>
                <div className="detail-item">
                  <label>Event End Date</label>
                  <span>{formatDate(selectedApplication.eventEndDate)}</span>
                </div>
                <div className="detail-item">
                  <label>Venue</label>
                  <span>{selectedApplication.venue || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>City</label>
                  <span>{selectedApplication.city || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>State</label>
                  <span>{selectedApplication.state || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3>Organiser Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Organiser Name</label>
                  <span>{selectedApplication.organiserName || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Registration No</label>
                  <span>{selectedApplication.registrationNo || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Person In Charge</label>
                  <span>{selectedApplication.personInCharge || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Email</label>
                  <span>{selectedApplication.email || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Contact</label>
                  <span>{selectedApplication.telContact || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3>Event Details</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Expected Participants</label>
                  <span>{selectedApplication.expectedParticipants || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Scoring Format</label>
                  <span>{selectedApplication.scoringFormat || 'N/A'}</span>
                </div>
              </div>
              {selectedApplication.eventSummary && (
                <div className="detail-item full-width">
                  <label>Event Summary</label>
                  <p className="event-summary">{selectedApplication.eventSummary}</p>
                </div>
              )}
            </div>

            {/* Emergency Plan Section */}
            <div className="detail-section">
              <h3>Emergency Plan</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Hospital Name</label>
                  <span>{selectedApplication.hospitalName || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Distance to Hospital</label>
                  <span>{selectedApplication.hospitalDistance ? `${selectedApplication.hospitalDistance} km` : 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Number of Medics</label>
                  <span>{selectedApplication.numberOfMedics || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Emergency Transport</label>
                  <span>
                    {selectedApplication.emergencyTransportType === 'ambulance'
                      ? `Ambulance${selectedApplication.emergencyTransportQuantity ? ` (${selectedApplication.emergencyTransportQuantity} unit${selectedApplication.emergencyTransportQuantity > 1 ? 's' : ''})` : ''}`
                      : selectedApplication.emergencyTransportType === 'standby_vehicle'
                        ? `Standby Vehicle${selectedApplication.standbyVehicleType ? ` - ${selectedApplication.standbyVehicleType}` : ''}`
                        : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>

            {selectedApplication.categories && selectedApplication.categories.length > 0 && (
              <div className="detail-section">
                <h3>Categories & Entry Fees</h3>
                <div className="categories-table-container">
                  <table className="categories-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Malaysian Fee (RM)</th>
                        <th>International Fee (RM)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedApplication.categories.map((cat, index) => (
                        <tr key={index}>
                          <td>{typeof cat === 'object' ? cat.category : cat}</td>
                          <td>{typeof cat === 'object' && cat.malaysianEntryFee ? `RM ${cat.malaysianEntryFee.toFixed(2)}` : '-'}</td>
                          <td>{typeof cat === 'object' && cat.internationalEntryFee > 0 ? `RM ${cat.internationalEntryFee.toFixed(2)}` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedApplication.rejectionReason && (
              <div className="detail-section rejection-section">
                <h3>Rejection Reason</h3>
                <p className="rejection-reason">{selectedApplication.rejectionReason}</p>
              </div>
            )}

            {selectedApplication.moreInfoRequired && (
              <div className="detail-section more-info-section">
                <h3>Additional Information Needed</h3>
                <p className="more-info-text">{selectedApplication.moreInfoRequired}</p>
                {selectedApplication.moreInfoRequestedBy && (
                  <p className="more-info-meta">
                    Requested by: {selectedApplication.moreInfoRequestedBy} on {formatDate(selectedApplication.moreInfoRequestedDate)}
                  </p>
                )}
              </div>
            )}

            <div className="detail-section">
              <h3>Submission Info</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Submitted At</label>
                  <span>{formatDate(selectedApplication.submittedAt || selectedApplication.createdAt)}</span>
                </div>
                <div className="detail-item">
                  <label>Application ID</label>
                  <span className="application-id">{selectedApplication.applicationId || selectedApplication._id}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            {/* Show message for National/International level applications */}
            {!isStateApprovalApplication(selectedApplication) && (
              <span className="info-note">National/International events are reviewed by MPA Admin</span>
            )}
            <button className="btn-secondary" onClick={() => setShowApplicationModal(false)}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render rejection modal
  const renderRejectModal = () => {
    if (!showRejectModal) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
        <div className="modal-content reject-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Reject Application</h2>
            <button className="modal-close-btn" onClick={() => setShowRejectModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <p className="reject-warning">
              You are about to reject the application for: <strong>{selectedApplication?.eventTitle}</strong>
            </p>
            <div className="form-group">
              <label>Rejection Reason *</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a detailed reason for rejection..."
                rows={4}
                required
              />
            </div>
            {error && <div className="error-message">{error}</div>}
          </div>
          <div className="modal-footer">
            <button
              className="btn-cancel"
              onClick={() => setShowRejectModal(false)}
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              className="btn-reject-confirm"
              onClick={handleReject}
              disabled={actionLoading || !rejectionReason.trim()}
            >
              {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="state-dashboard">
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">
            <h2>State Portal</h2>
            <p>{stateName}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Dashboard</span>
          </button>
          <button
            className={`nav-item ${currentView === 'tournaments' ? 'active' : ''}`}
            onClick={() => setCurrentView('tournaments')}
          >
            <span className="nav-icon">📋</span>
            <span className="nav-text">Tournament Management</span>
          </button>
          <button className="nav-item disabled">
            <span className="nav-icon">📊</span>
            <span className="nav-text">Statistics</span>
            <span className="nav-badge">Soon</span>
          </button>
          <button className="nav-item disabled">
            <span className="nav-icon">✉️</span>
            <span className="nav-text">Messages</span>
            <span className="nav-badge">Soon</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-icon">👤</span>
            <span className="user-name">{userData?.username || 'User'}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-main">
        <div className="dashboard-header">
          <div className="header-left">
            <h1>
              {currentView === 'dashboard' ? 'State Association Dashboard' : 'Tournament Management'}
            </h1>
            <p>Welcome, {userData?.stateName || userData?.username || 'State User'}</p>
          </div>
        </div>

        <div className="dashboard-content">
          {currentView === 'dashboard' && renderDashboard()}
          {currentView === 'tournaments' && renderTournamentManagement()}
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="success-toast">
          <span className="success-icon">✓</span>
          {successMessage}
        </div>
      )}

      {showApplicationModal && renderApplicationModal()}
      {renderRejectModal()}

      {/* Notes Modal for Card Status Change */}
      {showNotesModal && cardStatusApp && (
        <div className="modal-overlay" onClick={() => { setShowNotesModal(false); setCardStatusApp(null); setCardStatusValue(''); setStatusNotes(''); }}>
          <div className="modal-content notes-modal" onClick={(e) => e.stopPropagation()}>
            <div className={`modal-header ${cardStatusValue === 'Rejected' ? 'reject-header' : 'info-header'}`}>
              <h2>{cardStatusValue === 'Rejected' ? 'Reject Application' : 'Request More Information'}</h2>
              <button className="modal-close-btn" onClick={() => { setShowNotesModal(false); setCardStatusApp(null); setCardStatusValue(''); setStatusNotes(''); }}>×</button>
            </div>
            <div className="modal-body">
              <p className="notes-modal-info">
                {cardStatusValue === 'Rejected'
                  ? <>You are about to reject: <strong>{cardStatusApp?.eventTitle}</strong></>
                  : <>Requesting more information for: <strong>{cardStatusApp?.eventTitle}</strong></>
                }
              </p>
              <div className="form-group">
                <label>{cardStatusValue === 'Rejected' ? 'Rejection Reason *' : 'Information Needed *'}</label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder={cardStatusValue === 'Rejected'
                    ? 'Please provide a detailed reason for rejection...'
                    : 'Please specify what additional information is needed...'
                  }
                  rows={4}
                  required
                />
              </div>
              {error && <div className="error-message">{error}</div>}
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => { setShowNotesModal(false); setCardStatusApp(null); setCardStatusValue(''); setStatusNotes(''); setError(''); }}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className={cardStatusValue === 'Rejected' ? 'btn-reject-confirm' : 'btn-info-confirm'}
                onClick={handleCardStatusSubmit}
                disabled={actionLoading || !statusNotes.trim()}
              >
                {actionLoading ? 'Submitting...' : (cardStatusValue === 'Rejected' ? 'Confirm Rejection' : 'Request Info')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StateDashboard;
