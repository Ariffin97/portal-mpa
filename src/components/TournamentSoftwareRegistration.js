import React, { useState } from 'react';
import mpaLogo from '../assets/images/mpa.png';

const TournamentSoftwareRegistration = ({ setCurrentPage, setUserData }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    softwareName: '',
    platform: {
      web: false,
      mobile: false
    },
    systemUrl: '',
    appLink: '',
    contactPersonName: '',
    contactEmail: '',
    contactPhone: '',
    username: '',
    password: '',
    confirmPassword: '',
    description: '',
    consent: {
      dataSharing: false,
      systemIntegration: false
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: '',
    color: '',
    checks: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      symbol: false
    }
  });
  const [passwordMatch, setPasswordMatch] = useState(true);

  const checkPasswordStrength = (password) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };

    const score = Object.values(checks).filter(Boolean).length;

    let label = '';
    let color = '';

    if (password.length === 0) {
      label = '';
      color = '';
    } else if (score < 3) {
      label = 'Weak';
      color = '#ef4444';
    } else if (score < 4) {
      label = 'Fair';
      color = '#f59e0b';
    } else if (score < 5) {
      label = 'Good';
      color = '#10b981';
    } else {
      label = 'Strong';
      color = '#059669';
    }

    return { score, label, color, checks };
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox' && name.startsWith('platform-')) {
      const platformType = name.replace('platform-', '');
      setFormData(prev => ({
        ...prev,
        platform: {
          ...prev.platform,
          [platformType]: checked
        }
      }));
    } else if (type === 'checkbox' && name.startsWith('consent-')) {
      const consentType = name.replace('consent-', '');
      setFormData(prev => ({
        ...prev,
        consent: {
          ...prev.consent,
          [consentType]: checked
        }
      }));
    } else {
      const updatedFormData = {
        ...formData,
        [name]: value
      };

      setFormData(updatedFormData);

      // Check password strength when password field changes
      if (name === 'password') {
        setPasswordStrength(checkPasswordStrength(value));
        // Also check if confirm password still matches with the new password
        if (updatedFormData.confirmPassword) {
          setPasswordMatch(value === updatedFormData.confirmPassword);
        } else {
          // Reset password match state if confirm password is empty
          setPasswordMatch(true);
        }
      }

      // Check password match when confirm password field changes
      if (name === 'confirmPassword') {
        // Compare new confirm password value with current password
        setPasswordMatch(value === updatedFormData.password);
      }
    }
  };

  const isFormValid = () => {
    return formData.companyName.trim() !== '' &&
           formData.softwareName.trim() !== '' &&
           (formData.platform.web || formData.platform.mobile) &&
           formData.contactPersonName.trim() !== '' &&
           formData.contactEmail.trim() !== '' &&
           formData.contactPhone.trim() !== '' &&
           formData.username.trim() !== '' &&
           formData.password.trim() !== '' &&
           formData.confirmPassword.trim() !== '' &&
           passwordStrength.score >= 4 &&
           passwordMatch &&
           formData.consent.dataSharing &&
           formData.consent.systemIntegration;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    // Validation
    if (!formData.companyName || !formData.softwareName) {
      setSubmitError('Please fill in all required fields');
      return;
    }

    if (!formData.platform.web && !formData.platform.mobile) {
      setSubmitError('Please select at least one platform (Web or Mobile)');
      return;
    }

    if (!formData.contactEmail || !formData.contactPhone) {
      setSubmitError('Please provide contact information');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contactEmail)) {
      setSubmitError('Please enter a valid email address');
      return;
    }

    // Password validation
    if (passwordStrength.score < 4) {
      setSubmitError('Password must be at least "Good" strength. Please include uppercase, lowercase, number, and symbol.');
      return;
    }

    if (!passwordMatch || formData.password !== formData.confirmPassword) {
      setSubmitError('Passwords do not match. Please check both password fields.');
      return;
    }

    if (!formData.consent.dataSharing || !formData.consent.systemIntegration) {
      setSubmitError('Please accept both consent agreements to continue.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit registration to API
      const response = await fetch('/api/tournament-software/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Server returned non-JSON response:', await response.text());
        throw new Error('Server error. Please ensure the server is running and try again.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store user data for dashboard
      if (setUserData) {
        setUserData({ ...formData, softwareId: data.softwareId });
      }

      setIsSubmitted(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        setCurrentPage('software-dashboard');
      }, 2000);

    } catch (error) {
      setSubmitError(error.message || 'An error occurred. Please try again.');
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="tournament-application">
      <div className="form-header">
        <img src={mpaLogo} alt="Malaysia Pickleball Association" className="form-logo" />
        <div className="form-header-text">
          <h2>Tournament Software Registration</h2>
          <p className="form-subtitle">Register your tournament management software with MPA</p>
        </div>
      </div>

      {!isSubmitted ? (
        <form onSubmit={handleSubmit}>
          {/* Company Information Section */}
          <div className="form-section">
            <h3>Company Information</h3>

            <div className="form-group">
              <label htmlFor="companyName">Company Name *</label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                placeholder="Enter company name"
                required
              />
            </div>
          </div>

          {/* Software Information Section */}
          <div className="form-section">
            <h3>Software Information</h3>

            <div className="form-group">
              <label htmlFor="softwareName">Software Name *</label>
              <input
                type="text"
                id="softwareName"
                name="softwareName"
                value={formData.softwareName}
                onChange={handleInputChange}
                placeholder="Enter software name"
                required
              />
            </div>

            <div className="form-group">
              <label>Platform *</label>
              <div className="platform-selection-group">
                <label className={`platform-card ${formData.platform.web ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    name="platform-web"
                    checked={formData.platform.web}
                    onChange={handleInputChange}
                  />
                  <div className="platform-icon">🌐</div>
                  <div className="platform-info">
                    <div className="platform-title">Web-based</div>
                    <div className="platform-description">Browser-accessible platform</div>
                  </div>
                  <div className="platform-check">✓</div>
                </label>
                <label className={`platform-card ${formData.platform.mobile ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    name="platform-mobile"
                    checked={formData.platform.mobile}
                    onChange={handleInputChange}
                  />
                  <div className="platform-icon">📱</div>
                  <div className="platform-info">
                    <div className="platform-title">Mobile App</div>
                    <div className="platform-description">iOS and Android application</div>
                  </div>
                  <div className="platform-check">✓</div>
                </label>
              </div>
              <small className="form-note">Select at least one platform</small>
            </div>

            <div className="form-group">
              <label htmlFor="systemUrl">System URL (for web-based)</label>
              <input
                type="url"
                id="systemUrl"
                name="systemUrl"
                value={formData.systemUrl}
                onChange={handleInputChange}
                placeholder="https://example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="appLink">App Store/Play Store Link (for mobile)</label>
              <input
                type="url"
                id="appLink"
                name="appLink"
                value={formData.appLink}
                onChange={handleInputChange}
                placeholder="https://apps.apple.com/... or https://play.google.com/..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Software Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                placeholder="Provide a brief description of your tournament software"
              />
            </div>


          </div>

          {/* Consent Section */}
          <div className="form-section">
            <h3>Consent</h3>

            <div className="consent-group">
              <label className="consent-checkbox-label">
                <input
                  type="checkbox"
                  name="consent-dataSharing"
                  checked={formData.consent.dataSharing}
                  onChange={handleInputChange}
                  required
                />
                <span className="consent-checkmark"></span>
                <span className="consent-text">
                  I agree to share certain data with Malaysia Pickleball Association (MPA) for tournament management purposes. *
                </span>
              </label>

              <label className="consent-checkbox-label">
                <input
                  type="checkbox"
                  name="consent-systemIntegration"
                  checked={formData.consent.systemIntegration}
                  onChange={handleInputChange}
                  required
                />
                <span className="consent-checkmark"></span>
                <span className="consent-text">
                  I agree to integrate with MPA's system and comply with all technical requirements and standards. *
                </span>
              </label>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="form-section">
            <h3>Contact Information</h3>

            <div className="form-group">
              <label htmlFor="contactPersonName">Contact Person Name *</label>
              <input
                type="text"
                id="contactPersonName"
                name="contactPersonName"
                value={formData.contactPersonName}
                onChange={handleInputChange}
                placeholder="Enter contact person name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="contactEmail">Contact Email *</label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                placeholder="email@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="contactPhone">Contact Phone *</label>
              <input
                type="tel"
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                placeholder="+60 12-345 6789"
                required
              />
            </div>
          </div>

          {/* Account Credentials Section */}
          <div className="form-section">
            <h3>Account Credentials</h3>

            <div className="form-group">
              <label htmlFor="username">Username *</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Choose a username"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a secure password"
                minLength="8"
                required
                style={{
                  borderColor: formData.password && formData.confirmPassword ?
                    (passwordMatch ? '#28a745' : '#dc3545') :
                    '#ccc',
                  borderWidth: '2px',
                  outline: 'none',
                  transition: 'border-color 0.3s ease'
                }}
              />

              {formData.password && (
                <div className="password-strength-container">
                  <div className="password-strength-bar">
                    <div
                      className="password-strength-fill"
                      style={{
                        width: `${(passwordStrength.score / 5) * 100}%`,
                        backgroundColor: passwordStrength.color
                      }}
                    ></div>
                  </div>
                  {passwordStrength.label && (
                    <span className="password-strength-label" style={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </span>
                  )}
                </div>
              )}

              <div className="password-requirements">
                <small className="form-note">Password must contain:</small>
                <ul className="password-checklist">
                  <li className={passwordStrength.checks.length ? 'valid' : 'invalid'}>
                    {passwordStrength.checks.length ? '✓' : '○'} At least 8 characters
                  </li>
                  <li className={passwordStrength.checks.uppercase ? 'valid' : 'invalid'}>
                    {passwordStrength.checks.uppercase ? '✓' : '○'} One uppercase letter (A-Z)
                  </li>
                  <li className={passwordStrength.checks.lowercase ? 'valid' : 'invalid'}>
                    {passwordStrength.checks.lowercase ? '✓' : '○'} One lowercase letter (a-z)
                  </li>
                  <li className={passwordStrength.checks.number ? 'valid' : 'invalid'}>
                    {passwordStrength.checks.number ? '✓' : '○'} One number (0-9)
                  </li>
                  <li className={passwordStrength.checks.symbol ? 'valid' : 'invalid'}>
                    {passwordStrength.checks.symbol ? '✓' : '○'} One symbol (!@#$%^&*)
                  </li>
                </ul>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Re-enter your password"
                required
                style={{
                  borderColor: formData.confirmPassword ?
                    (passwordMatch ? '#28a745' : '#dc3545') :
                    '#ccc',
                  borderWidth: '2px',
                  outline: 'none',
                  transition: 'border-color 0.3s ease'
                }}
              />
              {formData.confirmPassword && (
                <div style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: passwordMatch ? '#d4edda' : '#f8d7da',
                  border: `1px solid ${passwordMatch ? '#c3e6cb' : '#f5c6cb'}`,
                  color: passwordMatch ? '#155724' : '#721c24'
                }}>
                  {passwordMatch ? (
                    <>
                      <span style={{ color: '#28a745', fontSize: '16px' }}>✓</span>
                      <span>Passwords match</span>
                    </>
                  ) : (
                    <>
                      <span style={{ color: '#dc3545', fontSize: '16px' }}>✗</span>
                      <span>Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            {submitError && (
              <div className="error-message" style={{
                color: '#d32f2f',
                backgroundColor: '#ffebee',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '15px',
                border: '1px solid #ffcdd2'
              }}>
                {submitError}
              </div>
            )}

            <button
              type="submit"
              className={`submit-btn ${(!isFormValid() || isSubmitting) ? 'disabled' : ''}`}
              disabled={!isFormValid() || isSubmitting}
            >
              {isSubmitting ? 'Submitting Registration...' : 'Submit Registration'}
            </button>
          </div>
        </form>
      ) : (
        <div className="submission-success">
          <div className="success-message">
            <h3>Registration Submitted Successfully!</h3>
            <p>Thank you for registering your tournament software with Malaysia Pickleball Association.</p>
            <p>Redirecting to your dashboard...</p>
          </div>
        </div>
      )}

      <style>{`
        /* Consent Section Styling */
        .consent-group {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin: 16px 0;
        }

        .consent-checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          cursor: pointer;
          padding: 16px 20px;
          border-radius: 8px;
          background: #f8fafc;
          border: 2px solid #e5e7eb;
          transition: all 0.3s ease;
        }

        .consent-checkbox-label:hover {
          background: #f0f4ff;
          border-color: #2c5aa0;
        }

        .consent-checkbox-label input[type="checkbox"] {
          display: none;
        }

        .consent-checkmark {
          width: 22px;
          height: 22px;
          min-width: 22px;
          border: 2px solid #cbd5e1;
          border-radius: 5px;
          display: inline-block;
          position: relative;
          flex-shrink: 0;
          margin-top: 2px;
          transition: all 0.2s ease;
          background: #ffffff;
        }

        .consent-checkbox-label input:checked + .consent-checkmark {
          background-color: #2c5aa0;
          border-color: #2c5aa0;
        }

        .consent-checkbox-label input:checked + .consent-checkmark::after {
          content: '';
          position: absolute;
          left: 7px;
          top: 3px;
          width: 5px;
          height: 10px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .consent-checkbox-label:hover .consent-checkmark {
          border-color: #94a3b8;
        }

        .consent-text {
          font-size: 15px;
          color: #334155;
          line-height: 1.6;
          font-weight: 500;
        }

        .consent-checkbox-label input:checked ~ .consent-text {
          color: #1e293b;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .consent-checkbox-label {
            padding: 14px 16px;
            gap: 12px;
          }

          .consent-checkmark {
            width: 20px;
            height: 20px;
            min-width: 20px;
          }

          .consent-text {
            font-size: 14px;
          }
        }

        .platform-selection-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin: 12px 0;
        }

        .platform-card {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #ffffff;
        }

        .platform-card input[type="checkbox"] {
          display: none;
        }

        .platform-card:hover {
          border-color: #2c5aa0;
          box-shadow: 0 4px 12px rgba(44, 90, 160, 0.1);
          transform: translateY(-2px);
        }

        .platform-card.selected {
          border-color: #2c5aa0;
          background: #f0f4ff;
          box-shadow: 0 4px 12px rgba(44, 90, 160, 0.15);
        }

        .platform-icon {
          font-size: 32px;
          flex-shrink: 0;
        }

        .platform-info {
          flex: 1;
        }

        .platform-title {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .platform-description {
          font-size: 13px;
          color: #6b7280;
        }

        .platform-check {
          font-size: 20px;
          color: #2c5aa0;
          font-weight: bold;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .platform-card.selected .platform-check {
          opacity: 1;
        }

        .platform-card.selected .platform-title {
          color: #2c5aa0;
        }

        @media (max-width: 768px) {
          .platform-selection-group {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .platform-card {
            padding: 16px;
          }

          .platform-icon {
            font-size: 28px;
          }

          .platform-title {
            font-size: 15px;
          }

          .platform-description {
            font-size: 12px;
          }
        }

        /* Password Strength Styling */
        .password-strength-container {
          margin-top: 8px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .password-strength-bar {
          flex: 1;
          height: 4px;
          background-color: #e5e7eb;
          border-radius: 2px;
          overflow: hidden;
        }

        .password-strength-fill {
          height: 100%;
          transition: all 0.3s ease;
          border-radius: 2px;
        }

        .password-strength-label {
          font-size: 12px;
          font-weight: 600;
          min-width: 60px;
          text-align: right;
        }

        .password-requirements {
          margin-top: 12px;
        }

        .password-checklist {
          margin: 6px 0 0 0;
          padding: 0;
          list-style: none;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
        }

        .password-checklist li {
          font-size: 12px;
          padding: 2px 0;
          transition: color 0.3s ease;
        }

        .password-checklist li.valid {
          color: #059669;
        }

        .password-checklist li.invalid {
          color: #9ca3af;
        }

        @media (max-width: 768px) {
          .password-checklist {
            grid-template-columns: 1fr;
          }
        }

      `}</style>
    </div>
  );
};

export default TournamentSoftwareRegistration;
