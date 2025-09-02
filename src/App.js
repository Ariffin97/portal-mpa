import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import TournamentApplication from './components/TournamentApplication';
import ApplicationStatus from './components/ApplicationStatus';
import mpaLogo from './assets/images/mpa.png';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check login status on app load
  useEffect(() => {
    const loginStatus = localStorage.getItem('isLoggedIn');
    if (loginStatus === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  const renderPage = () => {
    switch(currentPage) {
      case 'login':
        return <Login setCurrentPage={setCurrentPage} setIsLoggedIn={setIsLoggedIn} />;
      case 'admin':
        return isLoggedIn ? <AdminDashboard setCurrentPage={setCurrentPage} /> : <Login setCurrentPage={setCurrentPage} setIsLoggedIn={setIsLoggedIn} />;
      case 'apply':
        return <TournamentApplication setCurrentPage={setCurrentPage} />;
      case 'status':
        return <ApplicationStatus setCurrentPage={setCurrentPage} />;
      case 'about':
        return (
          <div className="page-content">
            <div className="hero-section">
              <h1>About Malaysia Pickleball Association</h1>
              <p className="hero-subtitle">Governing and promoting pickleball sports across Malaysia</p>
            </div>
            <div className="content-grid">
              <div className="content-card">
                <h3>Our Mission</h3>
                <p>To develop, promote and govern the sport of pickleball throughout Malaysia, fostering excellence at all levels from grassroots to elite competition.</p>
              </div>
              <div className="content-card">
                <h3>Our Vision</h3>
                <p>To establish Malaysia as a leading nation in pickleball within the Southeast Asian region and beyond.</p>
              </div>
              <div className="content-card">
                <h3>Governance</h3>
                <p>As the official governing body, we ensure fair play, maintain standards, and oversee all sanctioned tournaments and competitions.</p>
              </div>
            </div>
          </div>
        );
      case 'contact':
        return (
          <div className="page-content">
            <div className="hero-section">
              <h1>Contact Malaysia Pickleball Association</h1>
              <p className="hero-subtitle">Get in touch with our team for assistance</p>
            </div>
            <div className="contact-content">
              <div className="contact-methods">
                <div className="contact-method">
                  <div className="method-icon">📞</div>
                  <h3>Phone</h3>
                  <p>+60 3-1234 5678</p>
                  <p>Monday - Friday, 9:00 AM - 5:00 PM</p>
                </div>
                <div className="contact-method">
                  <div className="method-icon">✉️</div>
                  <h3>Email</h3>
                  <p>info@malaysiapickleball.org</p>
                  <p>We'll respond within 24 hours</p>
                </div>
                <div className="contact-method">
                  <div className="method-icon">📍</div>
                  <h3>Office</h3>
                  <p>Level 3, Sports Complex</p>
                  <p>Kuala Lumpur, Malaysia</p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="home-content">
            {/* Hero Section */}
            <section className="hero-banner">
              <div className="hero-content">
                <img src={mpaLogo} alt="MPA Logo" className="hero-logo" />
                <div className="hero-portal-text">Portal</div>
                <h1 className="hero-title">Malaysia Pickleball Association</h1>
                <p className="hero-subtitle">Official Tournament Management Portal</p>
                <p className="hero-description">
                  Your gateway to competitive pickleball in Malaysia. Apply for tournaments, 
                  track your applications, and join our growing community of players.
                </p>
                <div className="hero-actions">
                  <button 
                    className="cta-primary" 
                    onClick={() => setCurrentPage('apply')}
                  >
                    Apply for Tournament
                  </button>
                  <button 
                    className="cta-secondary" 
                    onClick={() => setCurrentPage('status')}
                  >
                    Check Application Status
                  </button>
                </div>
              </div>
            </section>


          </div>
        );
    }
  };

  return (
    <div className="App">
      <Header currentPage={currentPage} setCurrentPage={setCurrentPage} isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
      <main className="App-main">
        {renderPage()}
      </main>
      {currentPage !== 'login' && <Footer />}
    </div>
  );
}

export default App;
