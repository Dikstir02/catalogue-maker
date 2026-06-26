// API client that uses localStorage for client-side only operation
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

  logout() {
    this.setToken(null);
  }

  // Auth
  async login(username, password) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get stored users
    const users = this.getUsersFromStorage();
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Create token
    const token = btoa(JSON.stringify({ id: user.id, username: user.username, role: user.role }));
    this.setToken(token);

    return {
      success: true,
      user: { id: user.id, username: user.username, role: user.role }
    };
  }

  // Alias for compatibility with login forms that use email/password naming
  async loginViaEmailPassword(email, password) {
    // Treat email as username for simplicity
    return this.login(email, password);
  }

  async getCurrentUser() {
    if (!this.token) {
      return { user: null };
    }

    try {
      const tokenData = JSON.parse(atob(this.token));
      const users = this.getUsersFromStorage();
      const user = users.find(u => u.id === tokenData.id);

      if (user) {
        return { user: { id: user.id, username: user.username, role: user.role } };
      }
    } catch (e) {
      // Invalid token
    }

    return { user: null };
  }

  // Products
  async getProducts(sort, filter) {
    await this.delay();
    let products = this.getProductsFromStorage();

    // Apply filter
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        if (value && value !== 'all') {
          products = products.filter(p => p[key] === value);
        }
      });
    }

    // Apply sort
    if (sort) {
      const desc = sort.startsWith('-');
      const field = desc ? sort.slice(1) : sort;
      products.sort((a, b) => {
        const aVal = a[field] || '';
        const bVal = b[field] || '';
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return desc ? -comparison : comparison;
      });
    }

    return products;
  }

  async getProduct(id) {
    await this.delay();
    const products = this.getProductsFromStorage();
    const product = products.find(p => p.id === id);

    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  async createProduct(product) {
    await this.delay();
    const products = this.getProductsFromStorage();
    const newProduct = {
      ...product,
      id: this.generateId(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };
    products.push(newProduct);
    this.saveProductsToStorage(products);
    return newProduct;
  }

  async updateProduct(id, product) {
    await this.delay();
    const products = this.getProductsFromStorage();
    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
      throw new Error('Product not found');
    }

    products[index] = {
      ...products[index],
      ...product,
      id,
      updated_date: new Date().toISOString()
    };
    this.saveProductsToStorage(products);
    return products[index];
  }

  async deleteProduct(id) {
    await this.delay();
    const products = this.getProductsFromStorage();
    const filtered = products.filter(p => p.id !== id);
    this.saveProductsToStorage(filtered);
    return { success: true };
  }

  // Users
  async getUsers() {
    await this.delay();
    const users = this.getUsersFromStorage();
    // Return users without passwords (for display purposes)
    return users.map(({ password, ...user }) => user);
  }

  // Get users with passwords (for authentication only)
  async getUsersWithPasswords() {
    await this.delay();
    return this.getUsersFromStorage();
  }

  async createUser(user) {
    await this.delay();
    const users = this.getUsersFromStorage();

    // Check if username exists
    if (users.some(u => u.username === user.username)) {
      throw new Error('Username already exists');
    }

    const newUser = {
      ...user,
      id: this.generateId(),
      created_date: new Date().toISOString()
    };
    users.push(newUser);
    this.saveUsersToStorage(users);
    return newUser;
  }

  async updateUser(id, user) {
    await this.delay();
    const users = this.getUsersFromStorage();
    const index = users.findIndex(u => u.id === id);

    if (index === -1) {
      throw new Error('User not found');
    }

    users[index] = { ...users[index], ...user };
    this.saveUsersToStorage(users);
    return users[index];
  }

  async deleteUser(id) {
    await this.delay();
    const users = this.getUsersFromStorage();
    const filtered = users.filter(u => u.id !== id);
    this.saveUsersToStorage(filtered);
    return { success: true };
  }

  // Configs
  async getConfigs() {
    await this.delay();
    const configs = this.getConfigsFromStorage();

    // Initialize default configs if not exists
    if (configs.length === 0) {
      const defaultConfigs = [
        {
          id: 'config_brands',
          config_key: 'brands',
          values: JSON.stringify(['DUPONT', 'ELIE BLEU', 'LFL', 'MORICI', 'RECIFE', 'SIGLO', 'VINBRO', 'XIKAR']),
          created_date: new Date().toISOString()
        },
        {
          id: 'config_categories',
          config_key: 'categories',
          values: JSON.stringify(['Ashtray', 'Case', 'Cutter', 'Humidor', 'Lighter', 'Pen', 'Others', 'Set']),
          created_date: new Date().toISOString()
        }
      ];
      this.saveConfigsToStorage(defaultConfigs);
      return defaultConfigs;
    }

    return configs;
  }

  async updateConfig(id, config) {
    await this.delay();
    const configs = this.getConfigsFromStorage();
    const index = configs.findIndex(c => c.id === id);

    if (index === -1) {
      throw new Error('Config not found');
    }

    configs[index] = { ...configs[index], ...config };
    this.saveConfigsToStorage(configs);
    return configs[index];
  }

  // Edit Logs
  async getEditLogs() {
    await this.delay();
    return this.getEditLogsFromStorage() || [];
  }

  async createEditLog(log) {
    await this.delay();
    const logs = this.getEditLogsFromStorage() || [];
    const newLog = {
      ...log,
      id: this.generateId(),
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    this.saveEditLogsToStorage(logs);
    return newLog;
  }

  // Export Logs
  async getExportLogs() {
    await this.delay();
    return this.getExportLogsFromStorage() || [];
  }

  async createExportLog(log) {
    await this.delay();
    const logs = this.getExportLogsFromStorage() || [];
    const newLog = {
      ...log,
      id: this.generateId(),
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    this.saveExportLogsToStorage(logs);
    return newLog;
  }

  // Upload (returns placeholder URL for client-side)
  async uploadFile(file) {
    await this.delay(1000);

    // For client-side only, we'll store the image as base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({ file_url: reader.result });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Health check
  async healthCheck() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  // Export all data — uploads to Google Drive if configured, otherwise downloads locally
  async exportAllData() {
    const data = {
      products: this.getProductsFromStorage(),
      users: this.getUsersFromStorage(),
      configs: this.getConfigsFromStorage(),
      edit_logs: this.getEditLogsFromStorage(),
      export_logs: this.getExportLogsFromStorage(),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    // Check if Google Drive is configured
    const driveAccessToken = localStorage.getItem('drive_access_token');
    const driveFolderId = localStorage.getItem('drive_folder_id');

    if (driveAccessToken && driveFolderId) {
      // Upload to Google Drive
      await this.uploadToGoogleDrive(data, driveAccessToken, driveFolderId);
      localStorage.setItem('last_sync', new Date().toISOString());
      return { success: true, message: 'Data exported successfully to Google Drive!' };
    }

    // Fallback: trigger file download
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `catalogue-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true, message: 'Data exported successfully! Check your downloads.' };
  }

  // Upload data to Google Drive
  async uploadToGoogleDrive(data, accessToken, folderId) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `catalogue-backup-${timestamp}.json`;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });

    // Step 1: Create metadata with the file name and parent folder
    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      parents: [folderId]
    };

    // Step 2: Upload using multipart upload
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blob, fileName);

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: form
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      const msg = error?.error?.message || response.statusText || 'Upload failed';
      throw new Error(msg);
    }

    return await response.json();
  }

  // Import data from online backup (replaces current local data)
  async importAllDataFromCloud() {
    const resp = await fetch('/api/backup', { method: 'GET' });
    if (!resp.ok) {
      const error = await resp.json().catch(() => null);
      throw new Error(error?.message || 'Failed to fetch cloud backup');
    }

    const data = await resp.json();

    // Validate data structure
    if (!data.products || !Array.isArray(data.products)) {
      throw new Error('Invalid backup payload');
    }

    const confirmed = confirm(
      `This will replace all your current data with the latest cloud backup.\n\n` +
      `Products: ${data.products.length}\n` +
      `Users: ${data.users?.length || 0}\n` +
      `Export Date: ${data.exportDate || 'Unknown'}\n\n` +
      `Are you sure you want to continue?`
    );

    if (!confirmed) {
      return { success: false, message: 'Import cancelled' };
    }

    if (data.products) this.saveProductsToStorage(data.products);
    if (data.users) this.saveUsersToStorage(data.users);
    if (data.configs) this.saveConfigsToStorage(data.configs);
    if (data.edit_logs) this.saveEditLogsToStorage(data.edit_logs);
    if (data.export_logs) this.saveExportLogsToStorage(data.export_logs);

    return {
      success: true,
      message: 'Data imported successfully from cloud! Please refresh the page.',
      data: {
        products: data.products.length,
        users: data.users?.length || 0,
        configs: data.configs?.length || 0
      }
    };
  }

  // --------- GitHub repo file sync (removed) ---------


  // Expected localStorage keys:
  // - github_repo_owner (e.g. "myuser")
  // - github_repo_name  (e.g. "catalogue-maker")
  // - github_branch     (default: "master")
  // - github_file_path  (default: "data/catalogue-data.json")

  async syncToRepoFile({ owner, repo, branch = 'master', filePath = 'data/catalogue-data.json', token }) {
    const data = {
      products: this.getProductsFromStorage(),
      users: this.getUsersFromStorage(),
      configs: this.getConfigsFromStorage(),
      edit_logs: this.getEditLogsFromStorage(),
      export_logs: this.getExportLogsFromStorage(),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    const content = btoa(JSON.stringify(data, null, 2));

    const apiBase = 'https://api.github.com';
    const url = `${apiBase}/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(branch)}`;

    // Check existing file to include SHA when updating
    let sha = null;
    const getResp = await fetch(url, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (getResp.ok) {
      const existing = await getResp.json();
      sha = existing.sha;
    }

    const putPayload = {
      message: 'Catalogue Maker: sync data',
      content: content,
      branch,
    };
    if (sha) putPayload.sha = sha;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(putPayload)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.message || 'Failed to sync to GitHub repo file');
    }

    const result = await response.json();

    localStorage.setItem('github_repo_owner', owner);
    localStorage.setItem('github_repo_name', repo);
    localStorage.setItem('github_branch', branch);
    localStorage.setItem('github_file_path', filePath);
    localStorage.setItem('github_repo_token', token);

    return {
      success: true,
      message: 'Data synced to GitHub repo file successfully',
      commit: result?.commit?.sha || null
    };
  }

  // Sync data from GitHub repo file
  async syncFromGist(_ignoredGistId, token, skipConfirmation = false) {
    const owner = localStorage.getItem('github_repo_owner');
    const repo = localStorage.getItem('github_repo_name');
    const branch = localStorage.getItem('github_branch') || 'master';
    const filePath = localStorage.getItem('github_file_path') || 'data/catalogue-data.json';

    if (!owner || !repo) throw new Error('Repo owner/name not configured.');

    const apiBase = 'https://api.github.com';
    const url = `${apiBase}/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(branch)}`;

    const response = await fetch(url, {
      headers: {
        ...(token ? { Authorization: `token ${token}` } : {}),
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.message || 'Failed to sync from GitHub repo file');
    }

    const file = await response.json();

    const decoded = atob((file.content || '').replace(/\n/g, ''));
    const data = JSON.parse(decoded);


    // Validate data structure
    if (!data.products || !Array.isArray(data.products)) {
      throw new Error('Invalid data in repo file');
    }

    // Confirm import (skip for auto-sync)
    if (!skipConfirmation) {
      const confirmed = confirm(
        `This will replace all your current data with data from the Gist.\n\n` +
        `Products: ${data.products.length}\n` +
        `Users: ${data.users?.length || 0}\n` +
        `Last Sync: ${data.exportDate || 'Unknown'}\n\n` +
        `Are you sure you want to continue?`
      );

      if (!confirmed) {
        return { success: false, message: 'Sync cancelled' };
      }
    }

    // Import data
    if (data.products) this.saveProductsToStorage(data.products);
    if (data.users) this.saveUsersToStorage(data.users);
    if (data.configs) this.saveConfigsToStorage(data.configs);
    if (data.edit_logs) this.saveEditLogsToStorage(data.edit_logs);
    if (data.export_logs) this.saveExportLogsToStorage(data.export_logs);

    return { 
      success: true, 
      message: 'Data synced from GitHub Gist successfully! Please refresh the page.',
      data: {
        products: data.products.length,
        users: data.users?.length || 0,
        configs: data.configs?.length || 0
      }
    };
  }

  // Get sync status
  getSyncStatus() {
    const owner = localStorage.getItem('github_repo_owner');
    const repo = localStorage.getItem('github_repo_name');
    const token = localStorage.getItem('github_repo_token');
    const lastSync = localStorage.getItem('last_sync');

    return {
      isConfigured: !!(owner && repo && token),
      // keep gistId field for backward compatibility with current UI
      gistId: null,
      lastSync: lastSync
    };
  }

  // Clear sync configuration
  clearSync() {
    localStorage.removeItem('github_repo_owner');
    localStorage.removeItem('github_repo_name');
    localStorage.removeItem('github_branch');
    localStorage.removeItem('github_file_path');
    localStorage.removeItem('github_repo_token');
    localStorage.removeItem('last_sync');
    localStorage.removeItem('auto_sync_enabled');
  }


  // Enable auto sync
  enableAutoSync() {
    localStorage.setItem('auto_sync_enabled', 'true');
  }

  // Disable auto sync
  disableAutoSync() {
    localStorage.removeItem('auto_sync_enabled');
  }


  // Check if auto sync is enabled
  isAutoSyncEnabled() {
    return localStorage.getItem('auto_sync_enabled') === 'true';
  }

  // Import data from JSON file
  async importAllData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          
          // Validate data structure
          if (!data.products || !Array.isArray(data.products)) {
            throw new Error('Invalid backup file: missing products data');
          }

          // Confirm import
          const confirmed = confirm(
            `This will replace all your current data with the imported data.\n\n` +
            `Products: ${data.products.length}\n` +
            `Users: ${data.users?.length || 0}\n` +
            `Export Date: ${data.exportDate || 'Unknown'}\n\n` +
            `Are you sure you want to continue?`
          );

          if (!confirmed) {
            resolve({ success: false, message: 'Import cancelled' });
            return;
          }

          // Import data
          if (data.products) this.saveProductsToStorage(data.products);
          if (data.users) this.saveUsersToStorage(data.users);
          if (data.configs) this.saveConfigsToStorage(data.configs);
          if (data.edit_logs) this.saveEditLogsToStorage(data.edit_logs);
          if (data.export_logs) this.saveExportLogsToStorage(data.export_logs);

          resolve({ 
            success: true, 
            message: 'Data imported successfully! Please refresh the page.',
            data: {
              products: data.products.length,
              users: data.users?.length || 0,
              configs: data.configs?.length || 0
            }
          });
        } catch (error) {
          reject(new Error('Invalid backup file: ' + error.message));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  // Helper methods
  delay(ms = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Storage helpers
  getProductsFromStorage() {
    const data = localStorage.getItem('products');
    return data ? JSON.parse(data) : this.getDefaultProducts();
  }

  saveProductsToStorage(products) {
    localStorage.setItem('products', JSON.stringify(products));
  }

  getUsersFromStorage() {
    const data = localStorage.getItem('users');
    if (data) return JSON.parse(data);

    // Initialize with default admin user
    const defaultUsers = [
      {
        id: 'user_dexter',
        username: 'dexter',
        password: 'admin123',
        role: 'admin',
        created_date: '2024-01-01T00:00:00.000Z'
      }
    ];
    this.saveUsersToStorage(defaultUsers);
    return defaultUsers;
  }

  saveUsersToStorage(users) {
    localStorage.setItem('users', JSON.stringify(users));
  }

  getConfigsFromStorage() {
    const data = localStorage.getItem('configs');
    return data ? JSON.parse(data) : [];
  }

  saveConfigsToStorage(configs) {
    localStorage.setItem('configs', JSON.stringify(configs));
  }

  getEditLogsFromStorage() {
    const data = localStorage.getItem('edit_logs');
    return data ? JSON.parse(data) : [];
  }

  saveEditLogsToStorage(logs) {
    localStorage.setItem('edit_logs', JSON.stringify(logs));
  }

  getExportLogsFromStorage() {
    const data = localStorage.getItem('export_logs');
    return data ? JSON.parse(data) : [];
  }

  saveExportLogsToStorage(logs) {
    localStorage.setItem('export_logs', JSON.stringify(logs));
  }

  getDefaultProducts() {
    return [
      {
        id: 'prod_001',
        name: 'Sample Product 1',
        brand: 'DUPONT',
        category: 'Lighter',
        price: 150,
        description: 'A high-quality lighter',
        image_url: '',
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString()
      },
      {
        id: 'prod_002',
        name: 'Sample Product 2',
        brand: 'ELIE BLEU',
        category: 'Humidor',
        price: 450,
        description: 'Premium humidor',
        image_url: '',
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString()
      }
    ];
  }
}

export const apiClient = new ApiClient();
export default apiClient;