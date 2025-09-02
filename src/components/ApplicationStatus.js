import React, { useState, useEffect } from 'react';
import mpaLogo from '../assets/images/mpa.png';

const ApplicationStatus = () => {
  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('tournamentApplications');
    if (saved) {
      setApplications(JSON.parse(saved));
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchId.trim()) {
      alert('Please enter an application ID');
      return;
    }

    const found = applications.find(app => app.id.toLowerCase() === searchId.toLowerCase());
    setSearchResult(found || 'not_found');
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


  return (
    <div className="application-status">
      <h2>Check Application Status</h2>
      
      <div className="status-search">
        <form onSubmit={handleSearch}>
          <div className="search-group">
            <label htmlFor="searchId">Application ID:</label>
            <input
              type="text"
              id="searchId"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter your application ID (e.g., MPA12345)"
            />
            <button type="submit">Search</button>
          </div>
        </form>
      </div>

      {searchResult === 'not_found' && (
        <div className="search-result not-found">
          <h3>Application Not Found</h3>
          <p>No application found with ID: {searchId}</p>
          <p>Please check your application ID and try again.</p>
        </div>
      )}

      {searchResult && searchResult !== 'not_found' && (
        <div className="search-result found">
          <div className="application-card">
            <div className="application-header">
              <h3>Application Details</h3>
              <div 
                className="status-badge" 
                style={{ backgroundColor: getStatusColor(searchResult.status) }}
              >
                {searchResult.status}
              </div>
            </div>
            
            <div className="status-table-container">
              <table className="status-table">
                <thead>
                  <tr>
                    <th>Tournament Name</th>
                    <th>Application ID</th>
                    <th>Organiser</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{searchResult.eventTitle}</td>
                    <td>{searchResult.id}</td>
                    <td>{searchResult.organiserName}</td>
                    <td>
                      <span 
                        className="status-badge-table" 
                        style={{ backgroundColor: getStatusColor(searchResult.status) }}
                      >
                        {searchResult.status}
                      </span>
                    </td>
                    <td>{searchResult.remarks || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Approval Success Message */}
            {searchResult.status === 'Approved' && (
              <div className="approval-message">
                <div className="congratulations-card">
                  <div className="congrats-header">
                    <h3>🎉 Congratulations!</h3>
                  </div>
                  <div className="congrats-content">
                    <p>Your tournament application has been <strong>approved</strong>!</p>
                    <p>You may now proceed with your tournament preparations.</p>
                    <div className="download-section">
                      <p><strong>For tournament purposes only:</strong></p>
                      <a 
                        href={mpaLogo} 
                        download="MPA_Logo.png"
                        className="download-btn"
                      >
                        📥 Download MPA Logo
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ApplicationStatus;