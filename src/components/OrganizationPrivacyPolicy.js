import React from 'react';
import mpaLogo from '../assets/images/mpa.png';

const OrganizationPrivacyPolicy = ({ setCurrentPage }) => {
  return (
    <div className="privacy-policy">
      <div className="form-header">
        <img src={mpaLogo} alt="Malaysia Pickleball Association" className="form-logo" />
        <div className="form-header-text">
          <h2>Privacy Policy</h2>
          <p className="form-subtitle">Organization Registration - Malaysia Pickleball Association</p>
        </div>
      </div>

      <div className="privacy-content">
        <div className="privacy-section">
          <p><strong>Last Updated:</strong> {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>

        <div className="privacy-section">
          <h3>1. INTRODUCTION</h3>
          <p>
            Malaysia Pickleball Association ("MPA", "we", "us", "our") is committed to protecting your privacy 
            and personal data. This Privacy Policy explains how we collect, use, process, and protect your 
            information when you register your organization through our portal.
          </p>
          <p>
            <strong>Our Official Technology Partner:</strong> Fenix Digital serves as our official technology 
            partner, responsible for data processing, system maintenance, and technical operations under our 
            strict data protection guidelines.
          </p>
        </div>

        <div className="privacy-section">
          <h3>2. DATA CONTROLLER AND PROCESSOR</h3>
          <p>
            <strong>2.1 Data Controller:</strong> Malaysia Pickleball Association is the data controller 
            responsible for determining the purposes and means of processing your personal data.
          </p>
          <p>
            <strong>2.2 Data Processor:</strong> Fenix Digital acts as our authorized data processor, 
            handling technical aspects of data processing on our behalf under strict contractual obligations.
          </p>
        </div>

        <div className="privacy-section">
          <h3>3. INFORMATION WE COLLECT</h3>
          <p>When you register your organization, we collect the following information:</p>
          
          <h4>3.1 Organization Information:</h4>
          <ul>
            <li>Official organization/company name</li>
            <li>PJS/ROS/Company registration number</li>
            <li>Organization address (address lines, city, postcode, state, country)</li>
          </ul>

          <h4>3.2 Contact Person Information:</h4>
          <ul>
            <li>Full name of applicant/representative</li>
            <li>Phone number</li>
            <li>Email address</li>
          </ul>

          <h4>3.3 Account Security Information:</h4>
          <ul>
            <li>Password (encrypted and securely stored)</li>
            <li>Login timestamps and IP addresses for security purposes</li>
          </ul>

          <h4>3.4 Technical Information:</h4>
          <ul>
            <li>Browser type and version</li>
            <li>Device information</li>
            <li>Usage analytics and system logs</li>
          </ul>
        </div>

        <div className="privacy-section">
          <h3>4. HOW WE USE YOUR INFORMATION</h3>
          <p>We process your personal data for the following purposes:</p>
          
          <h4>4.1 Primary Purposes:</h4>
          <ul>
            <li>Processing your organization registration</li>
            <li>Managing tournament applications and approvals</li>
            <li>Maintaining your account and providing portal access</li>
            <li>Communicating with you regarding applications and events</li>
          </ul>

          <h4>4.2 Administrative Purposes:</h4>
          <ul>
            <li>Verifying organization legitimacy and credentials</li>
            <li>Maintaining records for regulatory compliance</li>
            <li>Providing customer support and technical assistance</li>
          </ul>

          <h4>4.3 Security and Legal Purposes:</h4>
          <ul>
            <li>Protecting against fraud and unauthorized access</li>
            <li>Complying with legal obligations and court orders</li>
            <li>Enforcing our terms and conditions</li>
          </ul>
        </div>

        <div className="privacy-section">
          <h3>5. LEGAL BASIS FOR PROCESSING</h3>
          <p>We process your personal data based on the following legal grounds:</p>
          <ul>
            <li><strong>Contract Performance:</strong> Processing necessary to provide registration and portal services</li>
            <li><strong>Legitimate Interests:</strong> Managing our operations and preventing fraud</li>
            <li><strong>Legal Compliance:</strong> Meeting regulatory and legal requirements</li>
            <li><strong>Consent:</strong> Where you have provided explicit consent for specific processing activities</li>
          </ul>
        </div>

        <div className="privacy-section">
          <h3>6. DATA SHARING AND DISCLOSURE</h3>
          <p>We may share your information in the following circumstances:</p>
          
          <h4>6.1 Authorized Partners:</h4>
          <ul>
            <li><strong>Fenix Digital:</strong> Our official technology partner processes data under strict contractual obligations</li>
            <li>Third-party service providers bound by confidentiality agreements</li>
          </ul>

          <h4>6.2 Legal Requirements:</h4>
          <ul>
            <li>Government agencies when required by law</li>
            <li>Law enforcement for legitimate investigations</li>
            <li>Courts and legal authorities as mandated</li>
          </ul>

          <h4>6.3 Business Operations:</h4>
          <ul>
            <li>Tournament organizers for approved events (with your consent)</li>
            <li>Sports governing bodies for official purposes</li>
          </ul>
        </div>

        <div className="privacy-section">
          <h3>7. DATA SECURITY</h3>
          <p>
            <strong>7.1 Technical Safeguards:</strong> Fenix Digital implements industry-standard security measures including:
          </p>
          <ul>
            <li>SSL/TLS encryption for data transmission</li>
            <li>Encrypted database storage</li>
            <li>Regular security audits and monitoring</li>
            <li>Access controls and authentication systems</li>
            <li>Regular backups and disaster recovery procedures</li>
          </ul>
          
          <p>
            <strong>7.2 Organizational Safeguards:</strong> We maintain strict internal policies for data access, 
            staff training, and incident response procedures.
          </p>
        </div>

        <div className="privacy-section">
          <h3>8. DATA RETENTION</h3>
          <p>
            <strong>8.1 Retention Period:</strong> We retain your personal data for as long as necessary to 
            fulfill the purposes outlined in this policy, typically:
          </p>
          <ul>
            <li>Active account data: While your account remains active</li>
            <li>Historical records: Up to 7 years for regulatory compliance</li>
            <li>Transaction logs: Up to 3 years for audit purposes</li>
          </ul>
          
          <p>
            <strong>8.2 Disposal:</strong> Data is securely deleted or anonymized when no longer required.
          </p>
        </div>

        <div className="privacy-section">
          <h3>9. YOUR RIGHTS</h3>
          <p>Under applicable data protection laws, you have the following rights:</p>
          
          <h4>9.1 Access and Portability:</h4>
          <ul>
            <li>Request copies of your personal data</li>
            <li>Obtain data in a portable format</li>
          </ul>

          <h4>9.2 Correction and Updates:</h4>
          <ul>
            <li>Correct inaccurate personal data</li>
            <li>Update your information through the portal</li>
          </ul>

          <h4>9.3 Deletion and Restriction:</h4>
          <ul>
            <li>Request deletion of your personal data (subject to legal requirements)</li>
            <li>Restrict processing in certain circumstances</li>
          </ul>

          <h4>9.4 Objection and Withdrawal:</h4>
          <ul>
            <li>Object to processing based on legitimate interests</li>
            <li>Withdraw consent where processing is based on consent</li>
          </ul>
        </div>

        <div className="privacy-section">
          <h3>10. INTERNATIONAL DATA TRANSFERS</h3>
          <p>
            <strong>10.1 Data Location:</strong> Your data is primarily stored and processed within Malaysia 
            by Fenix Digital's secure infrastructure.
          </p>
          <p>
            <strong>10.2 Cross-Border Transfers:</strong> If international transfers are necessary, we ensure 
            appropriate safeguards are in place to protect your data.
          </p>
        </div>

        <div className="privacy-section">
          <h3>11. COOKIES AND TRACKING</h3>
          <p>
            Our portal uses essential cookies for functionality and security. We do not use tracking cookies 
            for advertising purposes. You can manage cookie preferences through your browser settings.
          </p>
        </div>

        <div className="privacy-section">
          <h3>12. CHANGES TO THIS POLICY</h3>
          <p>
            We may update this Privacy Policy periodically. Changes will be posted on this page with an 
            updated revision date. Significant changes will be communicated via email or portal notifications.
          </p>
        </div>

        <div className="privacy-section">
          <h3>13. CONTACT INFORMATION</h3>
          <p>For privacy-related inquiries, please contact:</p>
          
          <div className="contact-info">
            <p><strong>Malaysia Pickleball Association</strong></p>
            <p>Privacy Officer: privacy@malaysiapickleballassociation.org</p>
            <p>Phone: +60 3-1234 5678</p>
            <p>Address: Malaysia Pickleball Association<br />
               Level 3, Sports Complex<br />
               Kuala Lumpur, Malaysia</p>
          </div>

          <div className="contact-info" style={{ marginTop: '20px' }}>
            <p><strong>Technical Partner - Fenix Digital</strong></p>
            <p>Data Protection Officer: dpo@fenixdigital.my</p>
            <p>Technical Support: support@fenixdigital.my</p>
            <p>Security Issues: security@fenixdigital.my</p>
          </div>
        </div>

        <div className="privacy-section agreement-section">
          <p>
            <strong>By registering your organization, you acknowledge that you have read and understood 
            this Privacy Policy and consent to the collection, use, and processing of your personal data 
            as described herein.</strong>
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

      <style>{`
        .privacy-policy {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .privacy-content {
          background: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
        }

        .privacy-section {
          margin-bottom: 30px;
        }

        .privacy-section h3 {
          color: #2c5aa0;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 15px;
          border-bottom: 2px solid #f0f0f0;
          padding-bottom: 8px;
        }

        .privacy-section h4 {
          color: #444;
          font-size: 16px;
          font-weight: 600;
          margin: 20px 0 10px 0;
        }

        .privacy-section p {
          line-height: 1.6;
          margin-bottom: 12px;
          color: #444;
        }

        .privacy-section ul {
          margin: 15px 0;
          padding-left: 25px;
        }

        .privacy-section li {
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
          background: #e8f5e8;
          border: 1px solid #c3e6c3;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }

        .agreement-section p {
          color: #2d5a2d;
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
          .privacy-policy {
            padding: 10px;
          }
          
          .privacy-content {
            padding: 20px;
          }
          
          .privacy-section h3 {
            font-size: 16px;
          }
          
          .privacy-section h4 {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default OrganizationPrivacyPolicy;