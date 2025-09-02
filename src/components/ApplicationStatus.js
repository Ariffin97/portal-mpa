import React, { useState, useEffect } from 'react';
import mpaLogo from '../assets/images/mpa.png';
import apiService from '../services/api';

const ApplicationStatus = () => {
  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchId.trim()) {
      alert('Please enter an application ID');
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setSearchResult(null);

    try {
      const application = await apiService.getApplicationById(searchId.trim());
      setSearchResult(application);
    } catch (error) {
      console.error('Search error:', error);
      if (error.message.includes('404') || error.message.includes('not found')) {
        setSearchResult('not_found');
      } else {
        setSearchError('Unable to search applications. Please check if the server is running and try again.');
      }
    } finally {
      setIsSearching(false);
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
              disabled={isSearching}
            />
            <button type="submit" disabled={isSearching}>
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
        
        {searchError && (
          <div className="search-error" style={{ 
            color: '#d32f2f', 
            backgroundColor: '#ffebee', 
            padding: '10px', 
            borderRadius: '4px', 
            marginTop: '10px',
            border: '1px solid #ffcdd2' 
          }}>
            {searchError}
          </div>
        )}
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
                    <td>{searchResult.applicationId || searchResult.id}</td>
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