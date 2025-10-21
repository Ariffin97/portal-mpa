import React, { useState, useEffect } from 'react';
import mpaLogo from '../assets/images/mpa.png';

const TournamentSoftwareDashboard = ({ setCurrentPage, userData }) => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [playerList, setPlayerList] = useState([]);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState('');
  const [shareError, setShareError] = useState('');
  const [tournaments, setTournaments] = useState([]);
  const [isLoadingTournaments, setIsLoadingTournaments] = useState(false);

  // Fetch tournaments on component mount
  useEffect(() => {
    if (userData && userData._id) {
      fetchTournaments();
    }
  }, [userData]);

  const fetchTournaments = async () => {
    if (!userData || !userData._id) return;

    setIsLoadingTournaments(true);
    try {
      const response = await fetch(`/api/tournament-software/${userData._id}/tournaments`);
      if (response.ok) {
        const data = await response.json();
        setTournaments(data);
      } else {
        console.error('Failed to fetch tournaments');
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setIsLoadingTournaments(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    // Validate file type
    if (!file.name.endsWith('.json')) {
      setUploadError('Please upload a valid JSON file');
      setUploadSuccess('');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadSuccess('');

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);

        // Validate JSON structure
        if (!Array.isArray(jsonData)) {
          setUploadError('JSON file must contain an array of players');
          setIsUploading(false);
          return;
        }

        // Validate each player object has required fields
        const requiredFields = ['name', 'email'];
        const isValid = jsonData.every(player =>
          requiredFields.every(field => player.hasOwnProperty(field))
        );

        if (!isValid) {
          setUploadError('Each player must have at least "name" and "email" fields');
          setIsUploading(false);
          return;
        }

        // Success - set the player list
        setPlayerList(jsonData);
        setUploadSuccess(`Successfully uploaded ${jsonData.length} player(s)`);
        setUploadError('');
        setIsUploading(false);

        // TODO: Send to backend API
        console.log('Player list uploaded:', jsonData);

      } catch (error) {
        setUploadError('Invalid JSON format. Please check your file.');
        setIsUploading(false);
      }
    };

    reader.onerror = () => {
      setUploadError('Error reading file. Please try again.');
      setIsUploading(false);
    };

    reader.readAsText(file);
  };

  const handleLogout = () => {
    setCurrentPage('home');
  };

  const renderDashboard = () => (
    <div className="dashboard-view">
      <div className="dashboard-header-section">
        <h1>Dashboard</h1>
        <p>Welcome to your Tournament Software Portal</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#dbeafe' }}>
            <svg fill="none" stroke="#2563eb" viewBox="0 0 24 24" style={{ width: '24px', height: '24px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Players</p>
            <p className="stat-value">{playerList.length}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#d1fae5' }}>
            <svg fill="none" stroke="#059669" viewBox="0 0 24 24" style={{ width: '24px', height: '24px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="stat-content">
            <p className="stat-label">Status</p>
            <p className="stat-value">Active</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fef3c7' }}>
            <svg fill="none" stroke="#d97706" viewBox="0 0 24 24" style={{ width: '24px', height: '24px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div className="stat-content">
            <p className="stat-label">Software</p>
            <p className="stat-value" style={{ fontSize: '1rem' }}>{userData?.softwareName || 'N/A'}</p>
          </div>
        </div>
      </div>

      <div className="info-card">
        <h2>Company Information</h2>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Company Name:</span>
            <span className="info-value">{userData?.companyName || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Software Name:</span>
            <span className="info-value">{userData?.softwareName || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Contact Person:</span>
            <span className="info-value">{userData?.contactPersonName || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Email:</span>
            <span className="info-value">{userData?.contactEmail || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Phone:</span>
            <span className="info-value">{userData?.contactPhone || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Platform:</span>
            <span className="info-value">
              {[userData?.platform?.web && 'Web', userData?.platform?.mobile && 'Mobile'].filter(Boolean).join(', ') || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Tournaments List */}
      <div className="info-card">
        <h2>Tournaments Handled ({tournaments.length})</h2>

        {isLoadingTournaments ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            Loading tournaments...
          </div>
        ) : tournaments.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            color: '#6b7280'
          }}>
            <p style={{ margin: 0 }}>No tournaments yet</p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
              Tournaments will appear here once you add them
            </p>
          </div>
        ) : (
          <div className="tournaments-list">
            {tournaments.map((tournament, index) => (
              <div key={tournament._id} className="tournament-card">
                <div className="tournament-header">
                  <h3>{tournament.tournamentName}</h3>
                  <span className="tournament-badge">
                    {tournament.totalPlayers} {tournament.totalPlayers === 1 ? 'Player' : 'Players'}
                  </span>
                </div>

                {tournament.location && (
                  <div className="tournament-meta">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {tournament.location}
                  </div>
                )}

                {tournament.categories && tournament.categories.length > 0 && (
                  <div className="categories-section">
                    <h4>Categories ({tournament.categories.length})</h4>
                    <div className="categories-list">
                      {tournament.categories.map((category, catIndex) => (
                        <div key={catIndex} className="category-item">
                          <div className="category-header">
                            <span className="category-name">{category.categoryName}</span>
                            <span className="category-count">
                              {category.players.length} {category.players.length === 1 ? 'player' : 'players'}
                            </span>
                          </div>

                          {category.players && category.players.length > 0 && (
                            <div className="players-list">
                              {category.players.map((player, playerIndex) => (
                                <div key={playerIndex} className="player-item">
                                  <div className="player-info">
                                    <span className="player-name">{player.name}</span>
                                    {player.email && (
                                      <span className="player-email">{player.email}</span>
                                    )}
                                  </div>
                                  <div className="player-details">
                                    {player.skillLevel && (
                                      <span className="player-skill">{player.skillLevel}</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderPlayerListSync = () => (
    <div className="player-sync-view">
      <div className="dashboard-header-section">
        <h1>Player List Sync</h1>
        <p>Upload and sync your player list with MPA</p>
      </div>

      {/* Upload Card */}
      <div className="card upload-card">
        <div className="card-header">
          <h2>Upload Player List</h2>
          <p>Upload a JSON file containing player information</p>
        </div>

        <div className="card-body">
          <div className="upload-zone">
            <input
              id="file-input"
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              disabled={isUploading}
              style={{ display: 'none' }}
            />
            <label htmlFor="file-input" className="upload-label">
              <div className="upload-content">
                <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="upload-title">
                  {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                </p>
                <p className="upload-subtitle">JSON files only</p>
              </div>
            </label>
          </div>

          {/* Status Messages */}
          {uploadError && (
            <div className="alert alert-error">
              <svg className="alert-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
              </svg>
              {uploadError}
            </div>
          )}

          {uploadSuccess && (
            <div className="alert alert-success">
              <svg className="alert-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
              </svg>
              {uploadSuccess}
            </div>
          )}

          {/* Format Example */}
          <div className="format-info">
            <h3>Required Format</h3>
            <pre><code>{`[
  {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+60123456789",
    "skillLevel": "Intermediate"
  }
]`}</code></pre>
            <p className="format-note">
              <strong>Required:</strong> name, email &nbsp;|&nbsp; <strong>Optional:</strong> phone, skillLevel, age
            </p>
          </div>
        </div>
      </div>

      {/* Player List Card */}
      {playerList.length > 0 && (
        <div className="card players-card">
          <div className="card-header">
            <div>
              <h2>Player List</h2>
              <p>{playerList.length} player{playerList.length !== 1 ? 's' : ''} uploaded</p>
            </div>
            <button className="btn-clear" onClick={clearPlayerList}>
              Clear List
            </button>
          </div>

          <div className="card-body">
            <div className="table-wrapper">
              <table className="players-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Skill Level</th>
                    <th>Age</th>
                  </tr>
                </thead>
                <tbody>
                  {playerList.map((player, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{player.name}</td>
                      <td>{player.email}</td>
                      <td>{player.phone || '—'}</td>
                      <td>{player.skillLevel || '—'}</td>
                      <td>{player.age || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Share Status Messages */}
            {shareSuccess && (
              <div className="alert alert-success" style={{ marginTop: '1rem' }}>
                <svg className="alert-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                </svg>
                {shareSuccess}
              </div>
            )}

            {shareError && (
              <div className="alert alert-error" style={{ marginTop: '1rem' }}>
                <svg className="alert-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
                </svg>
                {shareError}
              </div>
            )}

            {/* Share to MPA Button */}
            <button
              className="btn-share-mpa"
              onClick={handleShareToMPA}
              disabled={isSharing}
            >
              {isSharing ? 'Sharing to MPA...' : 'Share to MPA'}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const clearPlayerList = () => {
    setPlayerList([]);
    setUploadSuccess('');
    setUploadError('');
    setShareSuccess('');
    setShareError('');
  };

  const handleShareToMPA = async () => {
    setIsSharing(true);
    setShareError('');
    setShareSuccess('');

    try {
      // TODO: Replace with actual API endpoint
      const response = await fetch('/api/tournament-software/share-players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          players: playerList,
          softwareProvider: userData?.companyName || 'Unknown Provider',
          softwareName: userData?.softwareName || 'Unknown Software'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to share player list');
      }

      const data = await response.json();

      setShareSuccess(`Successfully shared ${playerList.length} player(s) to MPA.`);
      console.log('Share response:', data);

    } catch (error) {
      setShareError('Failed to share player list. Please try again.');
      console.error('Share error:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="software-dashboard">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <img src={mpaLogo} alt="MPA" className="sidebar-logo" />
          <h1>Tournament Software</h1>
        </div>

        <div className="sidebar-content">
          <div className="sidebar-company">
            <p className="sidebar-label">Company</p>
            <p className="sidebar-company-name">{userData?.companyName || 'Tournament Software Provider'}</p>
          </div>

          {/* Navigation Menu */}
          <nav className="sidebar-nav">
            <button
              className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentView('dashboard')}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </button>

            <button
              className={`nav-item ${currentView === 'player-list-sync' ? 'active' : ''}`}
              onClick={() => setCurrentView('player-list-sync')}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Player List Sync
            </button>
          </nav>
        </div>

        <button className="btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'player-list-sync' && renderPlayerListSync()}
      </main>

      <style>{`
        .software-dashboard {
          display: flex;
          min-height: 100vh;
          background: #f5f7fa;
          margin: 0;
          padding: 0;
        }

        /* Sidebar */
        .dashboard-sidebar {
          width: 260px;
          background: white;
          border-right: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          padding: 2rem 1.5rem;
          position: fixed;
          height: 100vh;
          left: 0;
          top: 0;
          z-index: 50;
          padding-top: 80px;
        }

        .dashboard-sidebar::before {
          display: none !important;
        }

        .sidebar-header {
          text-align: center;
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid #e5e7eb;
          background: none !important;
        }

        .sidebar-logo {
          width: 80px;
          height: 80px;
          object-fit: contain;
          margin-bottom: 1rem;
          background: none !important;
        }

        .sidebar-header h1 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          background: none !important;
        }

        .sidebar-content {
          flex: 1;
        }

        .sidebar-company {
          margin-bottom: 1.5rem;
        }

        .sidebar-label {
          margin: 0 0 0.5rem 0;
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .sidebar-company-name {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 500;
          color: #111827;
        }

        /* Sidebar Navigation */
        .sidebar-nav {
          margin-top: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: transparent;
          color: #6b7280;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          width: 100%;
        }

        .nav-item:hover {
          background: #f3f4f6;
          color: #111827;
        }

        .nav-item.active {
          background: #2c5aa0;
          color: white;
        }

        .nav-item svg {
          flex-shrink: 0;
        }

        .btn-logout {
          width: 100%;
          padding: 0.75rem 1rem;
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-logout:hover {
          background: #e5e7eb;
          border-color: #9ca3af;
        }

        /* Main Content */
        .dashboard-main {
          flex: 1;
          margin-left: 260px;
          padding: 2rem;
        }

        /* Dashboard View */
        .dashboard-view,
        .player-sync-view {
          max-width: 1400px;
          margin: 0 auto;
        }

        .dashboard-header-section {
          margin-bottom: 2rem;
        }

        .dashboard-header-section h1 {
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
        }

        .dashboard-header-section p {
          margin: 0;
          font-size: 1rem;
          color: #6b7280;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-content {
          flex: 1;
        }

        .stat-label {
          margin: 0 0 0.25rem 0;
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
        }

        .stat-value {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
        }

        /* Info Card */
        .info-card {
          background: white;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .info-card h2 {
          margin: 0 0 1rem 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .info-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .info-value {
          font-size: 0.875rem;
          font-weight: 500;
          color: #111827;
        }

        /* Tournaments List */
        .tournaments-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .tournament-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1.5rem;
        }

        .tournament-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .tournament-header h3 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
        }

        .tournament-badge {
          background: #2c5aa0;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .tournament-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #6b7280;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .categories-section {
          margin-top: 1rem;
        }

        .categories-section h4 {
          margin: 0 0 0.75rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .categories-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .category-item {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 1rem;
        }

        .category-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .category-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
        }

        .category-count {
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: 500;
        }

        .players-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .player-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          background: #f9fafb;
          border-radius: 4px;
        }

        .player-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .player-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: #111827;
        }

        .player-email {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .player-details {
          display: flex;
          gap: 0.5rem;
        }

        .player-skill {
          font-size: 0.75rem;
          color: #059669;
          font-weight: 500;
          background: #d1fae5;
          padding: 0.125rem 0.5rem;
          border-radius: 999px;
        }

        .dashboard-container {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 2rem;
          align-items: start;
        }

        /* Card */
        .card {
          background: white;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }

        .card-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-header h2 {
          margin: 0 0 0.25rem 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
        }

        .card-header p {
          margin: 0;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .card-body {
          padding: 1.5rem;
        }

        /* Upload Zone */
        .upload-zone {
          margin-bottom: 1.5rem;
        }

        .upload-label {
          display: block;
          cursor: pointer;
        }

        .upload-content {
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          padding: 3rem 2rem;
          text-align: center;
          transition: all 0.2s;
          background: #fafbfc;
        }

        .upload-label:hover .upload-content {
          border-color: #2c5aa0;
          background: #f0f4ff;
        }

        .upload-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 1rem;
          color: #9ca3af;
        }

        .upload-title {
          margin: 0 0 0.25rem 0;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }

        .upload-subtitle {
          margin: 0;
          font-size: 0.75rem;
          color: #9ca3af;
        }

        /* Alerts */
        .alert {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          margin-bottom: 1.5rem;
        }

        .alert-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .alert-error {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .alert-success {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        /* Format Info */
        .format-info {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 1rem;
        }

        .format-info h3 {
          margin: 0 0 0.75rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .format-info pre {
          margin: 0 0 0.75rem 0;
          background: #1f2937;
          border-radius: 4px;
          padding: 1rem;
          overflow-x: auto;
        }

        .format-info code {
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 0.75rem;
          line-height: 1.6;
          color: #10b981;
        }

        .format-note {
          margin: 0;
          font-size: 0.75rem;
          color: #6b7280;
        }

        /* Buttons */
        .btn-clear {
          padding: 0.5rem 1rem;
          background: white;
          color: #dc2626;
          border: 1px solid #fecaca;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-clear:hover {
          background: #fef2f2;
          border-color: #dc2626;
        }

        .btn-share-mpa {
          width: 100%;
          padding: 0.875rem 1rem;
          margin-top: 1.5rem;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-share-mpa:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .btn-share-mpa:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* Table */
        .table-wrapper {
          overflow-x: auto;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }

        .players-table {
          width: 100%;
          border-collapse: collapse;
        }

        .players-table thead {
          background: #f9fafb;
        }

        .players-table th {
          padding: 0.75rem 1rem;
          text-align: left;
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #e5e7eb;
        }

        .players-table td {
          padding: 0.875rem 1rem;
          font-size: 0.875rem;
          color: #374151;
          border-bottom: 1px solid #f3f4f6;
        }

        .players-table tbody tr:last-child td {
          border-bottom: none;
        }

        .players-table tbody tr:hover {
          background: #fafbfc;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .software-dashboard {
            flex-direction: column;
          }

          .dashboard-sidebar {
            width: 100%;
            position: relative;
            height: auto;
            border-right: none;
            border-bottom: 1px solid #e5e7eb;
            padding: 1.5rem 1rem;
          }

          .sidebar-header {
            margin-bottom: 1rem;
            padding-bottom: 1rem;
          }

          .sidebar-logo {
            width: 60px;
            height: 60px;
          }

          .sidebar-header h1 {
            font-size: 1rem;
          }

          .dashboard-main {
            margin-left: 0;
            padding: 1rem;
          }

          .dashboard-container {
            grid-template-columns: 1fr;
          }

          .card-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .btn-clear {
            width: 100%;
          }

          .upload-content {
            padding: 2rem 1rem;
          }

          .table-wrapper {
            font-size: 0.75rem;
          }

          .players-table th,
          .players-table td {
            padding: 0.5rem 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default TournamentSoftwareDashboard;
