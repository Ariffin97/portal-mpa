const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Tournament Application APIs
  async submitTournamentApplication(applicationData) {
    return this.makeRequest('/applications', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  }

  async getAllApplications() {
    return this.makeRequest('/applications');
  }

  async getApplicationById(applicationId) {
    return this.makeRequest(`/applications/${applicationId}`);
  }

  async updateApplicationStatus(applicationId, status) {
    return this.makeRequest(`/applications/${applicationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Admin APIs
  async adminLogin(credentials) {
    return this.makeRequest('/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getLoginHistory() {
    return this.makeRequest('/admin/login-history');
  }

  // Health check
  async healthCheck() {
    return this.makeRequest('/health');
  }
}

const apiService = new ApiService();
export default apiService;