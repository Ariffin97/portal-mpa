import React, { useState } from 'react';
import mpaLogo from '../assets/images/mpa.png';
import apiService from '../services/api';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await apiService.requestPasswordReset(email);

      if (response.success) {
        setMessage({
          type: 'success',
          text: 'A temporary password has been sent to your email. Please check your inbox.'
        });
        setEmail('');

        // Close modal after 3 seconds
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        setMessage({
          type: 'error',
          text: response.message || 'Failed to send reset email'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'An error occurred. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content forgot-password-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="modal-header">
          <div className="header-content">
            <img src={mpaLogo} alt="MPA Logo" className="modal-logo" />
            <div className="header-text">
              <h2>Forgot Password</h2>
              <p>Enter your registered email to receive a temporary password</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="forgot-password-form">
          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email"
              required
              disabled={isSubmitting}
            />
          </div>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            className={`submit-btn ${isSubmitting ? 'loading' : ''}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send Temporary Password'}
          </button>

          <button
            type="button"
            className="cancel-btn"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </form>

        <div className="help-text">
          <p><small>You will receive an email with a temporary password. Use it to login and change your password immediately.</small></p>
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
          z-index: 1100;
          backdrop-filter: blur(4px);
        }

        .forgot-password-modal {
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

        .forgot-password-form .form-group {
          margin-bottom: 20px;
        }

        .forgot-password-form label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #333;
          font-size: 14px;
        }

        .forgot-password-form input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.2s ease;
          box-sizing: border-box;
        }

        .forgot-password-form input:focus {
          outline: none;
          border-color: #2c5aa0;
        }

        .forgot-password-form input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }

        .message {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .message.success {
          background-color: #e8f5e9;
          color: #2e7d32;
          border: 1px solid #a5d6a7;
        }

        .message.error {
          background-color: #ffebee;
          color: #d32f2f;
          border: 1px solid #ffcdd2;
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
          margin-bottom: 12px;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(44, 90, 160, 0.3);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .cancel-btn {
          width: 100%;
          background: white;
          color: #666;
          border: 2px solid #e1e5e9;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 16px;
        }

        .cancel-btn:hover:not(:disabled) {
          border-color: #999;
          color: #333;
        }

        .cancel-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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
          .forgot-password-modal {
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
            width: 60px;
            height: 60px;
          }

          .modal-header h2 {
            font-size: 20px;
          }

          .modal-header p {
            font-size: 13px;
          }

          .forgot-password-form .form-group {
            margin-bottom: 16px;
          }

          .forgot-password-form label {
            font-size: 13px;
          }

          .forgot-password-form input {
            padding: 10px 14px;
            font-size: 14px;
          }

          .submit-btn,
          .cancel-btn {
            padding: 12px 20px;
            font-size: 15px;
          }

          .message {
            padding: 10px 14px;
            font-size: 13px;
            margin-bottom: 14px;
          }

          .help-text {
            font-size: 11px;
          }
        }

        @media (max-width: 480px) {
          .forgot-password-modal {
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

          .forgot-password-form input {
            font-size: 14px;
            padding: 10px 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default ForgotPasswordModal;
