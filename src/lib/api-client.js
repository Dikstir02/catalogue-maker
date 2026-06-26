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
    // Return users without passwords
    return users.map(({ password, ...user }) => user);
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