import React, { useState } from 'react';
import mpaLogo from '../assets/images/mpa.png';

const TournamentSoftwareLogin = ({ setCurrentPage, setUserData }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (!formData.username || !formData.password) {
      setLoginError('Please enter both username and password');
      return;
    }

    setIsLoggingIn(true);

    try {
      const response = await fetch('/api/tournament-software/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Set user data from the response
      setUserData(data.software);

      // Redirect to dashboard
      setCurrentPage('software-dashboard');

    } catch (error) {
      setLoginError(error.message || 'Invalid username or password');
      console.error('Login error:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = () => {
    setCurrentPage('software-registration');
  };

  return (
    <div className="software-login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <img src={mpaLogo} alt="MPA" className="login-logo" />
            <h2>Tournament Software Login</h2>
            <p>Access your tournament software dashboard</p>
          </div>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter your username"
                disabled={isLoggingIn}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                disabled={isLoggingIn}
              />
            </div>

            {loginError && (
              <div className="login-error">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="login-submit-btn"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="login-divider">
            <span>Don't have an account?</span>
          </div>

          <button
            type="button"
            className="register-btn"
            onClick={handleRegister}
          >
            Register New Tournament Software
          </button>
        </div>
      </div>

      <style>{`
        .software-login-page {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          background: #f9fafb;
          padding: 1.5rem 1rem;
        }

        .login-container {
          max-width: 400px;
          width: 100%;
        }

        .login-card {
          background: #ffffff;
          border-radius: 8px;
          padding: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          border: 1px solid #e5e7eb;
        }

        .login-header {
          text-align: center;
          margin-bottom: 1.5rem;
          background: transparent;
        }

        .login-logo {
          width: 120px;
          height: 120px;
          object-fit: contain;
          margin-bottom: 1rem;
        }

        .login-header h2 {
          margin: 0 0 0.25rem 0;
          color: #111827;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .login-header p {
          margin: 0;
          color: #6b7280;
          font-size: 0.813rem;
        }

        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: #374151;
          font-weight: 500;
          font-size: 0.875rem;
        }

        .form-group input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .form-group input:focus {
          outline: none;
          border-color: #2c5aa0;
          box-shadow: 0 0 0 3px rgba(44, 90, 160, 0.1);
        }

        .form-group input:disabled {
          background: #f3f4f6;
          cursor: not-allowed;
        }

        .login-error {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
          padding: 0.625rem 0.875rem;
          border-radius: 6px;
          font-size: 0.813rem;
          margin-bottom: 1.25rem;
        }

        .login-submit-btn {
          width: 100%;
          padding: 0.875rem 1rem;
          background: linear-gradient(135deg, #2c5aa0, #1e40af);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .login-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(44, 90, 160, 0.3);
        }

        .login-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .login-divider {
          text-align: center;
          margin: 1.5rem 0 1.25rem;
          position: relative;
        }

        .login-divider::before {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          height: 1px;
          background: #e5e7eb;
        }

        .login-divider span {
          background: white;
          padding: 0 1rem;
          position: relative;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .register-btn {
          width: 100%;
          padding: 0.875rem 1rem;
          background: white;
          color: #2c5aa0;
          border: 2px solid #2c5aa0;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .register-btn:hover {
          background: #f0f4ff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(44, 90, 160, 0.2);
        }

        @media (max-width: 768px) {
          .software-login-page {
            padding: 1rem;
          }

          .login-card {
            padding: 1.5rem;
          }

          .login-logo {
            width: 100px;
            height: 100px;
          }

          .login-header {
            margin-bottom: 1.25rem;
          }

          .login-header h2 {
            font-size: 1.125rem;
          }
        }
      `}</style>
    </div>
  );
};

export default TournamentSoftwareLogin;
