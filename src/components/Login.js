import React, { useState } from 'react';
import mpaLogo from '../assets/images/mpa.png';

const Login = ({ setCurrentPage, setIsLoggedIn }) => {
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

    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check credentials
    if (formData.username === 'admin' && formData.password === 'admin123') {
      setIsLoggedIn(true);
      localStorage.setItem('isLoggedIn', 'true');
      setCurrentPage('admin'); // Redirect directly to admin dashboard
    } else {
      setError('Invalid username or password');
    }
    
    setLoading(false);
  };

  return (
    <div className="digital-login-page">
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
        <div className="login-card">
          <div className="login-header-digital">
            <div className="logo-section">
              <img src={mpaLogo} alt="MPA Logo" className="login-logo" />
              <div className="brand-info">
                <h1>PORTAL MPA</h1>
                <p>Digital Authentication System</p>
              </div>
            </div>
          </div>
          
          <div className="login-form-container">
            <div className="access-header">
              <div className="access-info">
                <h2>Administrator Access</h2>
                <p className="login-description">Enter your credentials to access the admin dashboard</p>
              </div>
              <div className="security-badge">
                <div className="security-icon">🔐</div>
                <span>Secure Login</span>
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
                  placeholder="Administrator Username"
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
                className={`digital-login-btn ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                <div className="btn-content">
                  <span>{loading ? 'Authenticating...' : 'Access Dashboard'}</span>
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

export default Login;