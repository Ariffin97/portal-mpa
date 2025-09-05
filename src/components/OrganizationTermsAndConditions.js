import React from 'react';
import mpaLogo from '../assets/images/mpa.png';

const OrganizationTermsAndConditions = ({ setCurrentPage }) => {
  return (
    <div className="terms-and-conditions">
      <div className="form-header">
        <img src={mpaLogo} alt="Malaysia Pickleball Association" className="form-logo" />
        <div className="form-header-text">
          <h2>Terms and Conditions</h2>
          <p className="form-subtitle">Organization Registration - Malaysia Pickleball Association</p>
        </div>
      </div>

      <div className="terms-content">
        <div className="terms-section">
          <p><strong>Last Updated:</strong> {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>

        <div className="terms-section">
          <h3>1. ACCEPTANCE OF TERMS</h3>
          <p>
            By registering your organization with Malaysia Pickleball Association (MPA) through this portal, 
            you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. 
            If you do not agree with these terms, please do not proceed with the registration.
          </p>
        </div>

        <div className="terms-section">
          <h3>2. ORGANIZATION REGISTRATION</h3>
          <p>
            <strong>2.1 Eligibility:</strong> Only legally registered organizations, companies, associations, 
            or clubs with valid registration numbers (PJS/ROS/Company Registration) may register.
          </p>
          <p>
            <strong>2.2 Information Accuracy:</strong> You warrant that all information provided during 
            registration is true, accurate, current, and complete.
          </p>
          <p>
            <strong>2.3 Registration Approval:</strong> MPA reserves the right to approve or reject any 
            organization registration at its sole discretion.
          </p>
          <p>
            <strong>2.4 Account Responsibility:</strong> You are responsible for maintaining the confidentiality 
            of your login credentials and for all activities that occur under your account.
          </p>
        </div>

        <div className="terms-section">
          <h3>3. TOURNAMENT APPLICATION RIGHTS</h3>
          <p>
            <strong>3.1 Application Authority:</strong> Registration grants your organization the right to 
            apply for tournament sanctioning through the MPA portal.
          </p>
          <p>
            <strong>3.2 Compliance Requirements:</strong> All tournament applications must comply with MPA 
            rules, regulations, and guidelines.
          </p>
          <p>
            <strong>3.3 No Guarantee:</strong> Registration does not guarantee approval of tournament applications. 
            Each application will be reviewed individually.
          </p>
        </div>

        <div className="terms-section">
          <h3>4. DATA HANDLING PARTNERSHIP</h3>
          <p>
            <strong>4.1 Official Partner:</strong> Fenix Digital serves as the official technology partner 
            for MPA, responsible for data processing, storage, and system maintenance.
          </p>
          <p>
            <strong>4.2 Data Security:</strong> Fenix Digital implements industry-standard security measures 
            to protect your organization's data.
          </p>
          <p>
            <strong>4.3 Data Processing:</strong> Your data will be processed in accordance with our Privacy 
            Policy and applicable data protection laws.
          </p>
        </div>

        <div className="terms-section">
          <h3>5. PROHIBITED ACTIVITIES</h3>
          <p>You agree not to:</p>
          <ul>
            <li>Provide false, inaccurate, or misleading information</li>
            <li>Register multiple accounts for the same organization</li>
            <li>Use the portal for any unlawful or unauthorized purpose</li>
            <li>Attempt to gain unauthorized access to the system</li>
            <li>Interfere with the proper functioning of the portal</li>
            <li>Violate any applicable laws or regulations</li>
          </ul>
        </div>

        <div className="terms-section">
          <h3>6. INTELLECTUAL PROPERTY</h3>
          <p>
            <strong>6.1 MPA Content:</strong> All content, trademarks, logos, and materials on this portal 
            are the property of Malaysia Pickleball Association.
          </p>
          <p>
            <strong>6.2 Limited License:</strong> You are granted a limited, non-exclusive license to use 
            the portal solely for organization registration and tournament application purposes.
          </p>
        </div>

        <div className="terms-section">
          <h3>7. LIABILITY AND DISCLAIMERS</h3>
          <p>
            <strong>7.1 Service Availability:</strong> While we strive to maintain continuous service, 
            MPA does not guarantee uninterrupted access to the portal.
          </p>
          <p>
            <strong>7.2 Limitation of Liability:</strong> MPA and Fenix Digital shall not be liable for 
            any indirect, incidental, special, or consequential damages arising from your use of this portal.
          </p>
          <p>
            <strong>7.3 Force Majeure:</strong> We are not responsible for any failure to perform due to 
            circumstances beyond our reasonable control.
          </p>
        </div>

        <div className="terms-section">
          <h3>8. TERMINATION</h3>
          <p>
            <strong>8.1 Termination Rights:</strong> MPA reserves the right to terminate or suspend your 
            account at any time for violation of these terms.
          </p>
          <p>
            <strong>8.2 Effect of Termination:</strong> Upon termination, your right to use the portal 
            will cease immediately.
          </p>
        </div>

        <div className="terms-section">
          <h3>9. MODIFICATIONS</h3>
          <p>
            MPA reserves the right to modify these Terms and Conditions at any time. Changes will be 
            effective immediately upon posting on the portal. Continued use constitutes acceptance of 
            the revised terms.
          </p>
        </div>

        <div className="terms-section">
          <h3>10. GOVERNING LAW</h3>
          <p>
            These Terms and Conditions are governed by the laws of Malaysia. Any disputes shall be 
            subject to the exclusive jurisdiction of the Malaysian courts.
          </p>
        </div>

        <div className="terms-section">
          <h3>11. CONTACT INFORMATION</h3>
          <p>
            For questions regarding these Terms and Conditions, please contact:
          </p>
          <div className="contact-info">
            <p><strong>Malaysia Pickleball Association</strong></p>
            <p>Email: legal@malaysiapickleballassociation.org</p>
            <p>Phone: +60 3-1234 5678</p>
          </div>
          <div className="contact-info" style={{ marginTop: '20px' }}>
            <p><strong>Technical Partner - Fenix Digital</strong></p>
            <p>Email: support@fenixdigital.my</p>
            <p>Data Protection Officer: dpo@fenixdigital.my</p>
          </div>
        </div>

        <div className="terms-section agreement-section">
          <p>
            <strong>By proceeding with organization registration, you acknowledge that you have read, 
            understood, and agree to be bound by these Terms and Conditions.</strong>
          </p>
        </div>
      </div>

      <div className="form-actions">
        <button 
          type="button" 
          className="back-btn" 
          onClick={() => setCurrentPage('register-organization')}
        >
          Back to Registration
        </button>
      </div>

      <style jsx>{`
        .terms-and-conditions {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .terms-content {
          background: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
        }

        .terms-section {
          margin-bottom: 30px;
        }

        .terms-section h3 {
          color: #2c5aa0;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 15px;
          border-bottom: 2px solid #f0f0f0;
          padding-bottom: 8px;
        }

        .terms-section p {
          line-height: 1.6;
          margin-bottom: 12px;
          color: #444;
        }

        .terms-section ul {
          margin: 15px 0;
          padding-left: 25px;
        }

        .terms-section li {
          margin-bottom: 8px;
          line-height: 1.6;
          color: #444;
        }

        .contact-info {
          background: #f8f9fa;
          border-left: 4px solid #2c5aa0;
          padding: 15px 20px;
          border-radius: 4px;
        }

        .contact-info p {
          margin: 5px 0;
          color: #555;
        }

        .agreement-section {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }

        .agreement-section p {
          color: #856404;
          margin: 0;
          font-size: 16px;
        }

        .form-actions {
          text-align: center;
        }

        .back-btn {
          background: white;
          color: #2c5aa0;
          border: 2px solid #2c5aa0;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .back-btn:hover {
          background: #2c5aa0;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(44, 90, 160, 0.2);
        }

        @media (max-width: 768px) {
          .terms-and-conditions {
            padding: 10px;
          }
          
          .terms-content {
            padding: 20px;
          }
          
          .terms-section h3 {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default OrganizationTermsAndConditions;