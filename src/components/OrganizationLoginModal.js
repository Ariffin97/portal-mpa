import React, { useState } from 'react';
import mpaLogo from '../assets/images/mpa.png';
import apiService from '../services/api';
import ForgotPasswordModal from './ForgotPasswordModal';
import ChangePasswordModal from './ChangePasswordModal';

const OrganizationLoginModal = ({ isOpen, onClose, onLoginSuccess, onRegisterClick }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLogging, setIsLogging] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [loggedInOrgData, setLoggedInOrgData] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLogging(true);
    setError('');

    try {
      const response = await apiService.organizationLogin({
        email: formData.email,
        password: formData.password
      });

      if (response.success) {
        console.log('Login response:', response);
        console.log('requirePasswordChange:', response.organization.requirePasswordChange);

        // Store organization info for tournament application
        localStorage.setItem('organizationData', JSON.stringify(response.organization));
        localStorage.setItem('organizationLoggedIn', 'true');

        // Check if password change is required
        if (response.organization.requirePasswordChange) {
          console.log('Password change required - showing modal');
          setLoggedInOrgData(response.organization);
          setShowChangePassword(true);
          // Don't close the modal yet, wait for password change
        } else {
          console.log('No password change required - proceeding to dashboard');
          onLoginSuccess();
          onClose();
        }

        // Reset form
        setFormData({ email: '', password: '' });
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (error) {
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLogging(false);
    }
  };

  const handleRegisterClick = () => {
    onClose();
    onRegisterClick();
  };

  if (!isOpen) return null;

  return (
    <>
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content organization-login-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <div className="header-content">
            <img src={mpaLogo} alt="MPA Logo" className="modal-logo" />
            <div className="header-text">
              <h2>Organization Login</h2>
              <p>Access your tournament application portal</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="organization-login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your organization email"
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
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              className="forgot-password-link"
              onClick={() => setShowForgotPassword(true)}
            >
              Forgot Password?
            </button>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className={`login-btn ${isLogging ? 'loading' : ''}`}
            disabled={isLogging}
          >
            {isLogging ? 'Logging in...' : 'Login to Apply'}
          </button>
        </form>

        <div className="login-separator">
          <div className="separator-line"></div>
          <span>Don't have an account?</span>
          <div className="separator-line"></div>
        </div>

        <button 
          type="button" 
          className="register-btn"
          onClick={handleRegisterClick}
        >
          Register Your Organization First
        </button>

        <div className="login-help">
          <p><small>Use your organization's registered email and password to login.</small></p>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          padding: 32px;
          width: 90%;
          max-width: 450px;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: modalSlideIn 0.3s ease-out;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #999;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .modal-close:hover {
          background-color: #f5f5f5;
          color: #333;
        }

        .modal-header {
          margin-bottom: 40px;
          padding-bottom: 24px;
          border-bottom: 1px solid #f0f0f0;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .modal-logo {
          width: 80px;
          height: 80px;
          flex-shrink: 0;
        }

        .header-text {
          flex: 1;
        }

        .modal-header h2 {
          margin: 0 0 4px 0;
          color: #1a1a1a;
          font-size: 24px;
          font-weight: 600;
          line-height: 1.2;
        }

        .modal-header p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
          font-weight: 400;
          line-height: 1.4;
        }

        .organization-login-form .form-group {
          margin-bottom: 20px;
        }

        .organization-login-form label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #333;
          font-size: 14px;
        }

        .organization-login-form input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.2s ease;
          box-sizing: border-box;
        }

        .organization-login-form input:focus {
          outline: none;
          border-color: #2c5aa0;
        }

        .error-message {
          background-color: #ffebee;
          color: #d32f2f;
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid #ffcdd2;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .login-btn {
          width: 100%;
          background: linear-gradient(135deg, #2c5aa0 0%, #1e3a73 100%);
          color: white;
          border: none;
          padding: 14px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 24px;
        }

        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(44, 90, 160, 0.3);
        }

        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .login-separator {
          display: flex;
          align-items: center;
          margin: 24px 0;
          color: #999;
          font-size: 14px;
        }

        .separator-line {
          flex: 1;
          height: 1px;
          background-color: #e1e5e9;
        }

        .login-separator span {
          margin: 0 16px;
          white-space: nowrap;
        }

        .register-btn {
          width: 100%;
          background: white;
          color: #2c5aa0;
          border: 2px solid #2c5aa0;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 16px;
        }

        .register-btn:hover {
          background: #2c5aa0;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(44, 90, 160, 0.2);
        }

        .login-help {
          text-align: center;
          color: #666;
          font-size: 12px;
        }

        .login-help p {
          margin: 0;
        }

        .forgot-password-link {
          background: none;
          border: none;
          color: #2c5aa0;
          font-size: 13px;
          cursor: pointer;
          padding: 0;
          margin-top: 6px;
          text-align: left;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .forgot-password-link:hover {
          color: #1e3a73;
          text-decoration: underline;
        }

        /* Responsive Design */
        /* iPad and Tablet View */
        @media (min-width: 481px) and (max-width: 1024px) {
          .modal-content {
            max-width: 600px;
          }
        }

        @media (max-width: 768px) {
          .modal-content {
            width: 95%;
            padding: 24px 16px;
            max-height: 95vh;
            margin: 10px;
          }

          .modal-header {
            margin-bottom: 24px;
            padding-bottom: 16px;
          }

          .header-content {
            flex-direction: column;
            text-align: center;
            gap: 12px;
          }

          .modal-logo {
            width: 70px;
            height: 70px;
          }

          .modal-header h2 {
            font-size: 20px;
          }

          .modal-header p {
            font-size: 13px;
          }

          .organization-login-form .form-group {
            margin-bottom: 16px;
          }

          .organization-login-form label {
            font-size: 13px;
          }

          .organization-login-form input {
            padding: 10px 14px;
            font-size: 14px;
          }

          .forgot-password-link {
            font-size: 12px;
            margin-top: 4px;
          }

          .login-btn,
          .register-btn {
            padding: 12px 20px;
            font-size: 15px;
          }

          .error-message {
            padding: 10px 14px;
            font-size: 13px;
            margin-bottom: 14px;
          }

          .login-separator {
            margin: 20px 0;
            font-size: 13px;
          }

          .login-separator span {
            margin: 0 12px;
          }

          .login-help {
            font-size: 11px;
          }
        }

        @media (max-width: 480px) {
          .modal-content {
            width: 100%;
            padding: 20px 12px;
            border-radius: 12px;
            max-height: 100vh;
          }

          .modal-logo {
            width: 60px;
            height: 60px;
          }

          .modal-header h2 {
            font-size: 18px;
          }

          .organization-login-form input {
            font-size: 14px;
            padding: 10px 12px;
          }

          .modal-close {
            top: 12px;
            right: 12px;
            font-size: 20px;
            width: 28px;
            height: 28px;
          }
        }
      `}</style>
    </div>

    {/* Forgot Password Modal - Rendered outside parent modal */}
    {showForgotPassword && (
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    )}

    {/* Change Password Modal - Rendered outside parent modal */}
    {showChangePassword && loggedInOrgData && (
      <ChangePasswordModal
        isOpen={showChangePassword}
        organizationData={loggedInOrgData}
        onClose={() => {
          setShowChangePassword(false);
          setLoggedInOrgData(null);
        }}
        onPasswordChanged={() => {
          setShowChangePassword(false);
          setLoggedInOrgData(null);
          onLoginSuccess();
          onClose();
        }}
      />
    )}
    </>
  );
};

export default OrganizationLoginModal;