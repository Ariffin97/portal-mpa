import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-content">

          {/* Social Media Column */}
          <div className="footer-column">
            <h4 className="footer-title">Follow Us</h4>
            <ul className="footer-links social-links">
              <li>
                <a href="https://www.facebook.com/malaysiapickleball" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="footer-link social-link">
                  <span className="social-icon facebook-icon">F</span> Facebook
                </a>
              </li>
              <li>
                <a href="https://www.instagram.com/malaysiapickleball" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="footer-link social-link">
                  <span className="social-icon instagram-icon">IG</span> Instagram
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="footer-column">
            <h4 className="footer-title">Contact</h4>
            <div className="contact-info">
              <p className="contact-item">
                <span className="contact-label">Email:</span>
                <a href="mailto:info@malaysiapickleball.my" className="contact-link">info@malaysiapickleball.my</a>
              </p>
              <p className="contact-item">
                <span className="contact-label">Phone:</span>
                <a href="tel:+601116197471" className="contact-link">+6011-16197471</a>
              </p>
            </div>
          </div>

        </div>


      </div>
    </footer>
  );
};

export default Footer;