// API client for cloud backend
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(username, password) {
    // Ensure we always send valid JSON; some callers may pass non-string values.
    const payload = {
      username: String(username ?? '').trim(),
      password: String(password ?? ''),
    };

    const url = `${API_BASE}/auth/login`;
    const headers = {
      'Content-Type': 'application/json',
    };

    // NOTE: /auth/login does not require Authorization.
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Backend may return HTML (e.g. Express Bad Request page). Handle non-JSON safely.
      const text = await response.text().catch(() => '');
      try {
        const errorJson = JSON.parse(text);
        throw new Error(errorJson.message || `HTTP ${response.status}`);
      } catch {
        throw new Error(text?.includes('Invalid credentials')
          ? 'Invalid credentials'
          : `HTTP ${response.status} ${response.statusText || ''}`.trim());
      }
    }

    const data = await response.json();
    if (data?.success) this.setToken('demo-token');
    return data;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Products
  async getProducts(sort, filter) {
    const params = new URLSearchParams();
    if (sort) params.append('sort', sort);
    if (filter) params.append('filter', JSON.stringify(filter));
    const query = params.toString();
    return this.request(`/products${query ? `?${query}` : ''}`);
  }

  async getProduct(id) {
    return this.request(`/products/${id}`);
  }

  async createProduct(product) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(id, product) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  }

  async deleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Users
  async getUsers() {
    return this.request('/users');
  }

  async createUser(user) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  async updateUser(id, user) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  }

  async deleteUser(id) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Configs
  async getConfigs() {
    return this.request('/configs');
  }

  async updateConfig(id, config) {
    return this.request(`/configs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  // Edit Logs
  async getEditLogs() {
    return this.request('/edit-logs');
  }

  async createEditLog(log) {
    return this.request('/edit-logs', {
      method: 'POST',
      body: JSON.stringify(log),
    });
  }

  // Export Logs
  async getExportLogs() {
    return this.request('/export-logs');
  }

  async createExportLog(log) {
    return this.request('/export-logs', {
      method: 'POST',
      body: JSON.stringify(log),
    });
  }

  // Upload
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

export const apiClient = new ApiClient();
export default apiClient;