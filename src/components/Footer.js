import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-content">

          {/* Services Column */}
          <div className="footer-column">
            <h4 className="footer-title">Services</h4>
            <ul className="footer-links">
              <li><a href="#" className="footer-link">Sponsorship</a></li>
              <li><a href="#" className="footer-link">Rankings</a></li>
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