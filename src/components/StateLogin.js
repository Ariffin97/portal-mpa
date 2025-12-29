import React, { useState } from 'react';
import apiService from '../services/api';

const StateLogin = ({ setCurrentPage, setIsStateLoggedIn, setStateUserData }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!formData.username.trim()) {
      setError('Username is required');
      setLoading(false);
      return;
    }

    if (!formData.password.trim()) {
      setError('Password is required');
      setLoading(false);
      return;
    }

    console.log('Attempting state login with:', { username: formData.username.trim(), password: '***' });

    try {
      const response = await apiService.stateLogin({
        username: formData.username.trim(),
        password: formData.password.trim()
      });

      console.log('State login response:', response);

      if (response.success) {
        console.log('State login successful, setting up session');
        if (setIsStateLoggedIn) setIsStateLoggedIn(true);
        if (setStateUserData) setStateUserData(response.user);
        localStorage.setItem('isStateLoggedIn', 'true');
        localStorage.setItem('stateUserData', JSON.stringify(response.user));
        localStorage.setItem('stateLoginTimestamp', Date.now().toString());
        setCurrentPage('state-dashboard');
        console.log('Redirecting to state dashboard');
      } else {
        console.log('State login failed:', response.message);
        setError(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('State login error:', error);

      // More specific error messages
      if (error.message.includes('401')) {
        setError('Invalid username or password. Please check your credentials.');
      } else if (error.message.includes('500')) {
        setError('Server error. Please try again later.');
      } else if (error.message.includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(error.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="digital-login-page state-login-page">
      <div className="login-background">
        <div className="login-grid-pattern"></div>
        <div className="login-particles">
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>
      </div>

      <div className="login-container-digital">
        <div className="login-card state-login-card">
          <div className="login-header-digital">
            <div className="logo-section">
              <div className="brand-info">
                <h1>PORTAL MPA</h1>
                <p>State Authentication System</p>
              </div>
            </div>
          </div>

          <div className="login-form-container">
            <div className="access-header">
              <div className="access-info">
                <h2>State Association Access</h2>
                <p className="login-description">Enter your credentials to access the state dashboard</p>
              </div>
              <div className="security-badge state-badge">
                <div className="security-icon">🏛️</div>
                <span>State Portal</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="digital-login-form">
              <div className="input-group">
                <div className="input-icon">👤</div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="State Username"
                  required
                  disabled={loading}
                  className="digital-input"
                />
                <div className="input-border"></div>
              </div>

              <div className="input-group">
                <div className="input-icon">🔑</div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Secure Password"
                  required
                  disabled={loading}
                  className="digital-input"
                />
                <div className="input-border"></div>
              </div>

              {error && (
                <div className="error-alert">
                  <div className="error-icon">⚠️</div>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className={`digital-login-btn state-login-btn ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                <div className="btn-content">
                  <span>{loading ? 'Authenticating...' : 'Access State Dashboard'}</span>
                  {loading && <div className="loading-spinner"></div>}
                </div>
              </button>
            </form>

            <div className="login-actions">
              <button
                className="back-btn-digital"
                onClick={() => setCurrentPage('home')}
                disabled={loading}
              >
                ← Return to Portal
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default StateLogin;
