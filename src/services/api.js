const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Log the API URL for debugging
console.log('API Base URL:', API_BASE_URL);

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

    console.log('Making API request:', options.method || 'GET', url);
    try {
      const response = await fetch(url, config);
      
      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        throw new Error(`Server returned non-JSON response: ${response.status} - ${textResponse.substring(0, 200)}`);
      }

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

  async updateApplicationStatus(applicationId, status, rejectionReason = null) {
    const body = { status };
    if (rejectionReason && status === 'Rejected') {
      body.rejectionReason = rejectionReason;
    }
    return this.makeRequest(`/applications/${applicationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async deleteApplication(applicationId) {
    console.log('API Service: Deleting application with ID:', applicationId);
    console.log('DELETE URL:', `${this.baseURL}/applications/${applicationId}`);
    return this.makeRequest(`/applications/${applicationId}`, {
      method: 'DELETE',
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