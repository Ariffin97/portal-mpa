import React from 'react';
import mpaLogo from '../assets/images/mpa.png';
import fenixLogo from '../assets/images/FenixDigitalLogo.png';

const Footer = ({ setCurrentPage, isLoggedIn, setIsLoggedIn }) => {
  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userAuthority');
    localStorage.removeItem('username');
    localStorage.removeItem('loginTimestamp');
    setCurrentPage('home');
  };

  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-branding">
            <img src={mpaLogo} alt="MPA Logo" className="footer-logo" />
            <span className="footer-org-name footer-org-name-full">Malaysia Pickleball Association</span>
            <span className="footer-org-name footer-org-name-short">MPA</span>
            {setCurrentPage && (
              <div className="footer-admin-login">
                {isLoggedIn ? (
                  <button className="footer-admin-btn" onClick={handleLogout}>
                    Logout
                  </button>
                ) : (
                  <>
                    <button className="footer-admin-btn" onClick={() => setCurrentPage('login')}>
                      Admin Login
                    </button>
                    <button className="footer-admin-btn footer-state-btn" onClick={() => setCurrentPage('state-login')}>
                      State Login
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="footer-partner">
            <span className="footer-partner-text">Official Technical Partner</span>
            <img src={fenixLogo} alt="Fenix Digital Logo" className="footer-partner-logo" />
            <span className="footer-partner-name">Fenix Digital</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;