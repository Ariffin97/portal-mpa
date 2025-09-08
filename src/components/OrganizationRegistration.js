import React, { useState } from 'react';
import mpaLogo from '../assets/images/mpa.png';
import apiService from '../services/api';

const OrganizationRegistration = ({ setCurrentPage }) => {
  // Malaysian States and Cities data
  const malaysianStatesAndCities = {
    'Johor': ['Johor Bahru', 'Batu Pahat', 'Muar', 'Kluang', 'Pontian', 'Segamat', 'Mersing', 'Kota Tinggi', 'Kulai', 'Skudai'],
    'Kedah': ['Alor Setar', 'Sungai Petani', 'Kulim', 'Jitra', 'Baling', 'Langkawi', 'Kuala Kedah', 'Pendang', 'Sik', 'Yan'],
    'Kelantan': ['Kota Bharu', 'Wakaf Che Yeh', 'Tanah Merah', 'Machang', 'Pasir Mas', 'Gua Musang', 'Kuala Krai', 'Tumpat', 'Pasir Puteh', 'Bachok'],
    'Melaka': ['Melaka City', 'Ayer Keroh', 'Batu Berendam', 'Bukit Baru', 'Tanjung Kling', 'Jasin', 'Merlimau', 'Masjid Tanah', 'Alor Gajah', 'Bemban'],
    'Negeri Sembilan': ['Seremban', 'Port Dickson', 'Bahau', 'Tampin', 'Kuala Pilah', 'Rembau', 'Jelebu', 'Gemenceh', 'Labu', 'Linggi'],
    'Pahang': ['Kuantan', 'Temerloh', 'Bentong', 'Raub', 'Jerantut', 'Pekan', 'Kuala Lipis', 'Bera', 'Maran', 'Rompin'],
    'Penang': ['George Town', 'Bukit Mertajam', 'Butterworth', 'Perai', 'Nibong Tebal', 'Balik Pulau', 'Bayan Lepas', 'Air Itam', 'Tanjung Tokong', 'Jelutong'],
    'Perak': ['Ipoh', 'Taiping', 'Sitiawan', 'Kuala Kangsar', 'Teluk Intan', 'Batu Gajah', 'Lumut', 'Parit Buntar', 'Ayer Tawar', 'Bagan Serai'],
    'Perlis': ['Kangar', 'Arau', 'Padang Besar', 'Wang Kelian', 'Kaki Bukit', 'Simpang Empat', 'Beseri', 'Chuping', 'Mata Ayer', 'Sanglang'],
    'Sabah': ['Kota Kinabalu', 'Sandakan', 'Tawau', 'Lahad Datu', 'Keningau', 'Kota Belud', 'Kudat', 'Semporna', 'Beaufort', 'Ranau'],
    'Sarawak': ['Kuching', 'Miri', 'Sibu', 'Bintulu', 'Limbang', 'Sarikei', 'Sri Aman', 'Kapit', 'Betong', 'Mukah'],
    'Selangor': ['Shah Alam', 'Petaling Jaya', 'Subang Jaya', 'Klang', 'Ampang', 'Cheras', 'Kajang', 'Puchong', 'Seri Kembangan', 'Bangi'],
    'Terengganu': ['Kuala Terengganu', 'Chukai', 'Dungun', 'Marang', 'Jerteh', 'Besut', 'Setiu', 'Hulu Terengganu', 'Kemaman', 'Kuala Nerus'],
    'Kuala Lumpur': ['Kuala Lumpur City Centre', 'Bukit Bintang', 'Cheras', 'Ampang', 'Bangsar', 'Mont Kiara', 'Wangsa Maju', 'Kepong', 'Setapak', 'Titiwangsa'],
    'Putrajaya': ['Putrajaya', 'Precinct 1', 'Precinct 8', 'Precinct 9', 'Precinct 11', 'Precinct 14', 'Precinct 16', 'Precinct 18', 'Precinct 19', 'Precinct 20'],
    'Labuan': ['Labuan Town', 'Victoria', 'Batu Manikar', 'Patau-Patau', 'Rancha-Rancha', 'Kiansam', 'Layang-Layangan', 'Sungai Lada', 'Sungai Miri', 'Varley']
  };

  const countries = ['Malaysia', 'Singapore', 'Brunei', 'Indonesia', 'Thailand', 'Philippines', 'Other'];
  const [formData, setFormData] = useState({
    organizationName: '',
    registrationNo: '',
    applicantFullName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postcode: '',
    state: '',
    country: 'Malaysia'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Check password strength when password field changes
    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
      // Also check if confirm password still matches
      if (formData.confirmPassword) {
        setPasswordMatch(value === formData.confirmPassword);
      }
    }
    
    // Check password match when confirm password field changes
    if (name === 'confirmPassword') {
      setPasswordMatch(value === formData.password);
    }
  };

  const handleStateChange = (e) => {
    const selectedState = e.target.value;
    setFormData(prev => ({
      ...prev,
      state: selectedState,
      city: '' // Reset city when state changes
    }));
  };

  const isFormValid = () => {
    return formData.organizationName.trim() !== '' &&
           formData.registrationNo.trim() !== '' &&
           formData.applicantFullName.trim() !== '' &&
           formData.phoneNumber.trim() !== '' &&
           formData.email.trim() !== '' &&
           formData.password.trim() !== '' &&
           formData.confirmPassword.trim() !== '' &&
           formData.addressLine1.trim() !== '' &&
           formData.city.trim() !== '' &&
           formData.postcode.trim() !== '' &&
           formData.state.trim() !== '' &&
           formData.country.trim() !== '' &&
           passwordStrength.score >= 4 &&
           passwordMatch &&
           termsAccepted;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    // Validate password strength
    if (passwordStrength.score < 4) {
      setSubmitError('Password must be at least "Good" strength. Please include uppercase, lowercase, number, and symbol.');
      setIsSubmitting(false);
      return;
    }

    // Validate password match
    if (!passwordMatch || formData.password !== formData.confirmPassword) {
      setSubmitError('Passwords do not match. Please check both password fields.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await apiService.registerOrganization(formData);
      
      // Store organization info and set login status
      localStorage.setItem('organizationData', JSON.stringify(response.organization));
      localStorage.setItem('organizationLoggedIn', 'true');
      
      alert('Organization registered successfully! You can now proceed to submit your tournament application.');
      setIsSubmitted(true);
      
      // Redirect to tournament application after successful registration
      setTimeout(() => {
        setCurrentPage('tournament-application');
      }, 1500);
      
    } catch (error) {
      console.error('Registration error:', error);
      setSubmitError(error.message || 'Failed to register organization. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="tournament-application">
      <div className="form-header">
        <img src={mpaLogo} alt="Malaysia Pickleball Association" className="form-logo" />
        <div className="form-header-text">
          <h2>Organization Registration</h2>
          <p className="form-subtitle">Register your organization before applying for a tournament</p>
        </div>
      </div>

      {!isSubmitted ? (
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Organization Information</h3>
            
            <div className="form-group">
              <label htmlFor="organizationName">Official Organization/Company Name *</label>
              <input
                type="text"
                id="organizationName"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="registrationNo">PJS/ROS/Company Registration No. *</label>
              <input
                type="text"
                id="registrationNo"
                name="registrationNo"
                value={formData.registrationNo}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="applicantFullName">Full Name of Applicant/Representative *</label>
              <input
                type="text"
                id="applicantFullName"
                name="applicantFullName"
                value={formData.applicantFullName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number *</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Create Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a secure password"
                minLength="8"
                required
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
              />
              {formData.confirmPassword && (
                <div className="password-match-indicator">
                  {passwordMatch ? (
                    <span className="password-match-success">
                      ✓ Passwords match
                    </span>
                  ) : (
                    <span className="password-match-error">
                      ✗ Passwords do not match
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="addressLine1">Address Line 1 *</label>
              <input
                type="text"
                id="addressLine1"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleInputChange}
                placeholder="Street number, street name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="addressLine2">Address Line 2 (Optional)</label>
              <input
                type="text"
                id="addressLine2"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleInputChange}
                placeholder="Unit, building, floor (optional)"
              />
            </div>

            <div className="address-row">
              <div className="form-group">
                <label htmlFor="city">City *</label>
                {formData.country === 'Malaysia' && formData.state ? (
                  <select
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select City</option>
                    {malaysianStatesAndCities[formData.state].map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Enter city"
                    required
                  />
                )}
                {formData.country === 'Malaysia' && !formData.state && (
                  <small className="form-note">Please select a state first for city dropdown</small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="postcode">Postcode *</label>
                <input
                  type="text"
                  id="postcode"
                  name="postcode"
                  value={formData.postcode}
                  onChange={handleInputChange}
                  placeholder="12345"
                  pattern="[0-9]{5}"
                  maxLength="5"
                  required
                />
              </div>
            </div>

            <div className="address-row">
              <div className="form-group">
                <label htmlFor="state">State *</label>
                {formData.country === 'Malaysia' ? (
                  <select
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleStateChange}
                    required
                  >
                    <option value="">Select State</option>
                    {Object.keys(malaysianStatesAndCities).map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="Enter state/province"
                    required
                  />
                )}
              </div>

              <div className="form-group">
                <label htmlFor="country">Country *</label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                >
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
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
            <div className="form-footer">
              <div className="legal-agreement">
                <label className="terms-checkbox-label">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    required
                  />
                  <span className="checkmark"></span>
                  I agree to the 
                  <button 
                    type="button" 
                    className="legal-link" 
                    onClick={() => setCurrentPage('organization-terms')}
                  >
                    Terms & Conditions
                  </button>
                  <span> and </span>
                  <button 
                    type="button" 
                    className="legal-link" 
                    onClick={() => setCurrentPage('organization-privacy')}
                  >
                    Privacy Policy
                  </button>
                </label>
              </div>

              <button 
                type="submit" 
                className={`submit-btn ${(!isFormValid() || isSubmitting) ? 'disabled' : ''}`}
                disabled={!isFormValid() || isSubmitting}
              >
                {isSubmitting ? 'Registering Organization...' : 'Register Organization'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="submission-success">
          <div className="success-message">
            <h3>Organization Registered Successfully!</h3>
            <p>Your organization has been registered with Malaysia Pickleball Association.</p>
            <p>You will now be redirected to the tournament application form.</p>
          </div>
        </div>
      )}
      
      <style>{`
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

        .password-match-indicator {
          margin-top: 8px;
        }

        .password-match-success {
          color: #059669;
          font-size: 12px;
          font-weight: 500;
        }

        .password-match-error {
          color: #ef4444;
          font-size: 12px;
          font-weight: 500;
        }

        .address-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .address-row .form-group {
          margin-bottom: 20px;
        }

        .form-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 120px;
          margin: 24px 0;
        }

        .legal-agreement {
          flex: 1;
        }

        .terms-checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          color: #6b7280;
          line-height: 1.4;
        }

        .terms-checkbox-label input[type="checkbox"] {
          display: none;
        }

        .checkmark {
          width: 18px;
          height: 18px;
          border: 2px solid #d1d5db;
          border-radius: 4px;
          display: inline-block;
          position: relative;
          flex-shrink: 0;
          margin-top: 1px;
          transition: all 0.2s ease;
        }

        .terms-checkbox-label input:checked + .checkmark {
          background-color: #2c5aa0;
          border-color: #2c5aa0;
        }

        .terms-checkbox-label input:checked + .checkmark::after {
          content: '';
          position: absolute;
          left: 5px;
          top: 1px;
          width: 4px;
          height: 8px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .legal-link {
          background: none;
          border: none;
          color: #2c5aa0;
          text-decoration: underline;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: color 0.2s ease;
          padding: 0;
          margin: 0 2px;
        }

        .legal-link:hover {
          color: #1e3a73;
        }

        .legal-agreement span {
          color: #6b7280;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .password-checklist {
            grid-template-columns: 1fr;
          }
          
          .address-row {
            grid-template-columns: 1fr;
          }

          .form-footer {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }

          .terms-checkbox-label {
            font-size: 13px;
            justify-content: center;
          }

          .legal-link {
            font-size: 13px;
          }

          .submit-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default OrganizationRegistration;