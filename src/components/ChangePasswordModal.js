import React, { useState } from 'react';
import mpaLogo from '../assets/images/mpa.png';
import apiService from '../services/api';

const ChangePasswordModal = ({ isOpen, organizationData, onClose, onPasswordChanged }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSymbol: false
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Check password strength for new password
    if (name === 'newPassword') {
      setPasswordStrength({
        hasMinLength: value.length >= 8,
        hasUppercase: /[A-Z]/.test(value),
        hasLowercase: /[a-z]/.test(value),
        hasNumber: /[0-9]/.test(value),
        hasSymbol: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)
      });
    }
  };

  const isPasswordValid = () => {
    return Object.values(passwordStrength).every(val => val === true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      setIsSubmitting(false);
      return;
    }

    // Validate password strength
    if (!isPasswordValid()) {
      setError('Password does not meet all requirements');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await apiService.changeOrganizationPassword(
        organizationData.organizationId,
        formData.currentPassword,
        formData.newPassword
      );

      if (response.success) {
        // Update local storage to remove requirePasswordChange flag
        const updatedOrgData = { ...organizationData, requirePasswordChange: false };
        localStorage.setItem('organizationData', JSON.stringify(updatedOrgData));

        if (onPasswordChanged) {
          onPasswordChanged();
        }
        onClose();
      } else {
        setError(response.message || 'Failed to change password');
      }
    } catch (error) {
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
      <div className="modal-content change-password-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-content">
            <img src={mpaLogo} alt="MPA Logo" className="modal-logo" />
            <div className="header-text">
              <h2>Change Password Required</h2>
              <p>For security reasons, please change your password</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="change-password-form">
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password *</label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleInputChange}
              placeholder="Enter your current password"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password *</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              placeholder="Enter your new password"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your new password"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Password Strength Indicator */}
          <div className="password-requirements">
            <p className="requirements-title">Password must contain:</p>
            <div className={`requirement ${passwordStrength.hasMinLength ? 'met' : ''}`}>
              {passwordStrength.hasMinLength ? '✓' : '○'} At least 8 characters
            </div>
            <div className={`requirement ${passwordStrength.hasUppercase ? 'met' : ''}`}>
              {passwordStrength.hasUppercase ? '✓' : '○'} At least one uppercase letter (A-Z)
            </div>
            <div className={`requirement ${passwordStrength.hasLowercase ? 'met' : ''}`}>
              {passwordStrength.hasLowercase ? '✓' : '○'} At least one lowercase letter (a-z)
            </div>
            <div className={`requirement ${passwordStrength.hasNumber ? 'met' : ''}`}>
              {passwordStrength.hasNumber ? '✓' : '○'} At least one number (0-9)
            </div>
            <div className={`requirement ${passwordStrength.hasSymbol ? 'met' : ''}`}>
              {passwordStrength.hasSymbol ? '✓' : '○'} At least one special character (!@#$%^&*)
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className={`submit-btn ${isSubmitting ? 'loading' : ''}`}
            disabled={isSubmitting || !isPasswordValid()}
          >
            {isSubmitting ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>

        <div className="help-text">
          <p><small>You must change your password before you can continue.</small></p>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1200;
          backdrop-filter: blur(4px);
        }

        .change-password-modal {
          background: white;
          border-radius: 16px;
          padding: 32px;
          width: 90%;
          max-width: 500px;
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

        .modal-header {
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 1px solid #f0f0f0;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .modal-logo {
          width: 70px;
          height: 70px;
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

        .change-password-form .form-group {
          margin-bottom: 20px;
        }

        .change-password-form label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #333;
          font-size: 14px;
        }

        .change-password-form input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.2s ease;
          box-sizing: border-box;
        }

        .change-password-form input:focus {
          outline: none;
          border-color: #2c5aa0;
        }

        .change-password-form input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }

        .password-requirements {
          background-color: #f8f9fa;
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .requirements-title {
          margin: 0 0 12px 0;
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }

        .requirement {
          padding: 4px 0;
          font-size: 13px;
          color: #666;
          transition: color 0.2s ease;
        }

        .requirement.met {
          color: #28a745;
          font-weight: 500;
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

        .submit-btn {
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
          margin-bottom: 16px;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(44, 90, 160, 0.3);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .help-text {
          text-align: center;
          color: #666;
          font-size: 12px;
        }

        .help-text p {
          margin: 0;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .change-password-modal {
            width: 95%;
            padding: 24px 16px;
            max-height: 95vh;
            margin: 10px;
          }

          .modal-header {
            margin-bottom: 20px;
            padding-bottom: 16px;
          }

          .header-content {
            flex-direction: column;
            text-align: center;
            gap: 12px;
          }

          .modal-logo {
            width: 60px;
            height: 60px;
          }

          .modal-header h2 {
            font-size: 20px;
          }

          .modal-header p {
            font-size: 13px;
          }

          .change-password-form .form-group {
            margin-bottom: 16px;
          }

          .change-password-form label {
            font-size: 13px;
          }

          .change-password-form input {
            padding: 10px 14px;
            font-size: 14px;
          }

          .password-requirements {
            padding: 12px;
            margin-bottom: 16px;
          }

          .requirements-title {
            font-size: 13px;
            margin-bottom: 8px;
          }

          .requirement {
            font-size: 12px;
            padding: 3px 0;
          }

          .submit-btn {
            padding: 12px 20px;
            font-size: 15px;
          }

          .help-text {
            font-size: 11px;
          }
        }

        @media (max-width: 480px) {
          .change-password-modal {
            width: 100%;
            padding: 20px 12px;
            border-radius: 12px;
            max-height: 100vh;
          }

          .modal-header h2 {
            font-size: 18px;
          }

          .modal-logo {
            width: 50px;
            height: 50px;
          }

          .change-password-form input {
            font-size: 14px;
            padding: 10px 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default ChangePasswordModal;
