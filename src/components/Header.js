import { useState } from 'react';
import mpaLogo from '../assets/images/mpa.png';

const Header = ({ currentPage, setCurrentPage, isLoggedIn, setIsLoggedIn }) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userAuthority');
    localStorage.removeItem('username');
    localStorage.removeItem('loginTimestamp');
    setCurrentPage('home');
    setShowMobileMenu(false);
  };

  return (
    <>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="container">
          <div className="top-bar-content">
            <div className="gov-info">
              <img src={mpaLogo} alt="MPA Logo" className="nav-logo" />
              <span className="separator">|</span>
              <span className="org-name">Malaysia Pickleball Association</span>
            </div>
            <div className="utility-links">
              {/* Desktop view - show all buttons */}
              <div className="utility-links-desktop">
                {(currentPage === 'apply' || currentPage === 'status' || currentPage === 'admin' || currentPage === 'terms' || currentPage === 'register-organization' || currentPage === 'tournament-application' || currentPage === 'organization-terms' || currentPage === 'organization-privacy' || currentPage === 'software-login' || currentPage === 'software-registration' || currentPage === 'software-dashboard') && (
                  <button
                    className="utility-link"
                    onClick={() => setCurrentPage('home')}
                    title="Back to Home"
                  >
                    Home
                  </button>
                )}
                {isLoggedIn && (
                  <button
                    className="utility-link"
                    onClick={() => setCurrentPage('admin')}
                    title="Admin Dashboard"
                  >
                    Admin
                  </button>
                )}
                <button
                  className="utility-link"
                  onClick={() => setCurrentPage('terms')}
                  title="Terms and Conditions"
                >
                  Terms & Conditions
                </button>
                {isLoggedIn ? (
                  <button className="utility-link" onClick={handleLogout}>
                    Logout
                  </button>
                ) : (
                  <button className="utility-link" onClick={() => setCurrentPage('login')}>
                    Login
                  </button>
                )}
              </div>

              {/* Mobile view - all buttons in dropdown */}
              <div className="utility-links-mobile">
                {/* Mobile dropdown menu button */}
                <div className="mobile-menu-container">
                  <button
                    className="mobile-menu-button"
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    title="Menu"
                  >
                    ☰
                  </button>

                  {/* Mobile dropdown content */}
                  {showMobileMenu && (
                    <div className="mobile-menu-dropdown">
                      {(currentPage === 'apply' || currentPage === 'status' || currentPage === 'admin' || currentPage === 'terms' || currentPage === 'register-organization' || currentPage === 'tournament-application' || currentPage === 'organization-terms' || currentPage === 'organization-privacy' || currentPage === 'software-login' || currentPage === 'software-registration' || currentPage === 'software-dashboard') && (
                        <button
                          className="mobile-menu-item"
                          onClick={() => {
                            setCurrentPage('home');
                            setShowMobileMenu(false);
                          }}
                        >
                          Home
                        </button>
                      )}
                      {isLoggedIn && (
                        <button
                          className="mobile-menu-item"
                          onClick={() => {
                            setCurrentPage('admin');
                            setShowMobileMenu(false);
                          }}
                        >
                          Admin
                        </button>
                      )}
                      <button
                        className="mobile-menu-item"
                        onClick={() => {
                          setCurrentPage('terms');
                          setShowMobileMenu(false);
                        }}
                      >
                        Terms & Conditions
                      </button>
                      {isLoggedIn ? (
                        <button className="mobile-menu-item" onClick={handleLogout}>
                          Logout
                        </button>
                      ) : (
                        <button className="mobile-menu-item" onClick={() => {
                          setCurrentPage('login');
                          setShowMobileMenu(false);
                        }}>
                          Login
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  );
};

export default Header;