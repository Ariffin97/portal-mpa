// Dynamic API URL configuration
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? '/api'  // In production, use relative path (same domain)
  : 'http://localhost:5001/api';  // In development, use localhost

// Log the API URL for debugging
console.log('API Base URL:', API_BASE_URL);
console.log('Environment:', process.env.NODE_ENV);

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
    console.log('Request config:', config);
    
    try {
      const response = await fetch(url, config);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response:', textResponse);
        throw new Error(`Server returned non-JSON response: ${response.status} - ${textResponse.substring(0, 200)}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        const errorMessage = data.message || data.error || `HTTP error! status: ${response.status}`;
        console.error('API error:', errorMessage);
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      
      // If it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server. Please check your connection.');
      }
      
      throw error;
    }
  }

  // Organization Registration APIs
  async registerOrganization(organizationData) {
    return this.makeRequest('/organizations/register', {
      method: 'POST',
      body: JSON.stringify(organizationData),
    });
  }

  async organizationLogin(credentials) {
    return this.makeRequest('/organizations/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
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

  async getApplicationsByOrganization(email) {
    return this.makeRequest(`/applications/organization/${encodeURIComponent(email)}`);
  }

  async getApplicationById(applicationId) {
    return this.makeRequest(`/applications/${applicationId}`);
  }

  async updateApplicationStatus(applicationId, status, rejectionReason = null, additionalData = null) {
    const body = { status };
    if (rejectionReason && status === 'Rejected') {
      body.rejectionReason = rejectionReason;
    }
    // Include additional tournament data if provided (for admin edits)
    if (additionalData) {
      body.updateData = additionalData;
    }
    return this.makeRequest(`/applications/${applicationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  // Dedicated tournament update method
  async updateTournamentApplication(applicationId, tournamentData) {
    return this.makeRequest(`/applications/${applicationId}`, {
      method: 'PATCH',
      body: JSON.stringify(tournamentData),
    });
  }

  async deleteApplication(applicationId) {
    console.log('API Service: Deleting application with ID:', applicationId);
    console.log('DELETE URL:', `${this.baseURL}/applications/${applicationId}`);
    return this.makeRequest(`/applications/${applicationId}`, {
      method: 'DELETE',
    });
  }

  async getApprovedTournaments() {
    return this.makeRequest('/approved-tournaments');
  }

  async getRegisteredOrganizations() {
    return this.makeRequest('/organizations');
  }

  async suspendOrganization(organizationId) {
    return this.makeRequest(`/organizations/${organizationId}/suspend`, {
      method: 'PATCH',
    });
  }

  async reactivateOrganization(organizationId) {
    return this.makeRequest(`/organizations/${organizationId}/reactivate`, {
      method: 'PATCH',
    });
  }

  async deleteOrganization(organizationId) {
    return this.makeRequest(`/organizations/${organizationId}`, {
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

  // Admin User Management APIs
  async createAdminUser(userData) {
    return this.makeRequest('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getAllAdminUsers() {
    return this.makeRequest('/admin/users');
  }

  async updateAdminUserStatus(userId, status) {
    return this.makeRequest(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteAdminUser(userId) {
    return this.makeRequest(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Assessment Form Management
  async saveAssessmentForm(formData) {
    const response = await this.makeRequest('/assessment/forms', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    return response;
  }

  async getAllAssessmentForms() {
    const response = await this.makeRequest('/assessment/forms');
    return response.data || [];
  }

  async getAssessmentFormByCode(code) {
    const response = await this.makeRequest(`/assessment/forms/${code}`);
    return response.data || null;
  }

  async deleteAssessmentForm(formId) {
    return this.makeRequest(`/assessment/forms/${formId}`, {
      method: 'DELETE',
    });
  }

  async saveAssessmentSubmission(submissionData) {
    return this.makeRequest('/assessment/submissions', {
      method: 'POST',
      body: JSON.stringify(submissionData),
    });
  }

  async getAllAssessmentSubmissions() {
    const response = await this.makeRequest('/assessment/submissions');
    return response.data || [];
  }

  async getAssessmentSubmissionsByBatch(batchId, batchDate) {
    const params = new URLSearchParams();
    if (batchId) params.append('batchId', batchId);
    if (batchDate) params.append('batchDate', batchDate);

    const response = await this.makeRequest(`/assessment/submissions?${params.toString()}`);
    return response.data || [];
  }

  async getAssessmentBatches(fromDate = null) {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);

    const endpoint = `/assessment/batches${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await this.makeRequest(endpoint);
    return response.data || [];
  }

  async clearAllAssessmentSubmissions() {
    return this.makeRequest('/assessment/submissions/clear', {
      method: 'DELETE',
    });
  }
}

const apiService = new ApiService();
export default apiService;