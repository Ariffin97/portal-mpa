import React, { useState, useEffect } from 'react';
import mpaLogo from '../assets/images/mpa.png';

const Header = ({ currentPage, setCurrentPage, isLoggedIn, setIsLoggedIn }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigationItems = [
    { key: 'home', label: 'Home', icon: '🏠' },
    { key: 'apply', label: 'Apply Tournament', icon: '📝' },
    { key: 'status', label: 'Check Status', icon: '📊' },
    { key: 'about', label: 'About MPA', icon: 'ℹ️' },
    { key: 'contact', label: 'Contact', icon: '📧' }
  ];

  const handleNavClick = (page) => {
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    setCurrentPage('home');
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
              {(currentPage === 'apply' || currentPage === 'status' || currentPage === 'admin' || currentPage === 'terms') && (
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
          </div>
        </div>
      </div>

    </>
  );
};

export default Header;