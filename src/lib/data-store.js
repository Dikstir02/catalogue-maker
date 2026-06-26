// Cloud-enabled data store that uses API client instead of localStorage
import { apiClient } from './api-client';

// Helper function to generate IDs (kept for compatibility)
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Helper function to sort items (kept for compatibility)
function sortItems(items, sortStr) {
  if (!sortStr) return items;
  const desc = sortStr.startsWith('-');
  const field = desc ? sortStr.slice(1) : sortStr;
  return [...items].sort((a, b) => {
    const av = a[field] ?? '';
    const bv = b[field] ?? '';
    if (typeof av === 'number' && typeof bv === 'number') {
      return desc ? bv - av : av - bv;
    }
    const sA = String(av).toLowerCase();
    const sB = String(bv).toLowerCase();
    if (sA < sB) return desc ? 1 : -1;
    if (sA > sB) return desc ? -1 : 1;
    return 0;
  });
}

// Map entity types to API endpoints
const entityEndpoints = {
  Product: '/products',
  AppUser: '/users',
  CatalogueConfig: '/configs',
  EditLog: '/edit-logs',
  ExportLog: '/export-logs',
};

function createEntityApi(entityType) {
  const endpoint = entityEndpoints[entityType];
  
  // Get the appropriate API method based on entity type
  const getApiMethod = (method) => {
    switch(entityType) {
      case 'Product':
        return apiClient[method].bind(apiClient);
      case 'AppUser':
        if (method === 'getProducts') return apiClient.getUsers.bind(apiClient);
        if (method === 'getProduct') return apiClient.getUsers.bind(apiClient); // getUsers returns all
        if (method === 'createProduct') return apiClient.createUser.bind(apiClient);
        if (method === 'updateProduct') return apiClient.updateUser.bind(apiClient);
        if (method === 'deleteProduct') return apiClient.deleteUser.bind(apiClient);
        return apiClient[method].bind(apiClient);
      case 'CatalogueConfig':
        if (method === 'getProducts') return apiClient.getConfigs.bind(apiClient);
        if (method === 'getProduct') return apiClient.getConfigs.bind(apiClient);
        if (method === 'createProduct') return apiClient.updateConfig.bind(apiClient);
        if (method === 'updateProduct') return apiClient.updateConfig.bind(apiClient);
        return apiClient[method].bind(apiClient);
      case 'EditLog':
        if (method === 'getProducts') return apiClient.getEditLogs.bind(apiClient);
        if (method === 'createProduct') return apiClient.createEditLog.bind(apiClient);
        return apiClient[method].bind(apiClient);
      case 'ExportLog':
        if (method === 'getProducts') return apiClient.getExportLogs.bind(apiClient);
        if (method === 'createProduct') return apiClient.createExportLog.bind(apiClient);
        return apiClient[method].bind(apiClient);
      default:
        return apiClient[method].bind(apiClient);
    }
  };
  
  return {
    list: async (sortStr) => {
      const items = await getApiMethod('getProducts')();
      return sortStr ? sortItems(items, sortStr) : items;
    },
    filter: async (criteria) => {
      const items = await getApiMethod('getProducts')();
      if (!criteria || Object.keys(criteria).length === 0) return items;
      return items.filter((item) =>
        Object.entries(criteria).every(([key, value]) => {
          const itemVal = item[key];
          if (typeof value === 'string' && typeof itemVal === 'string') {
            return itemVal.toLowerCase() === value.toLowerCase();
          }
          return itemVal === value;
        })
      );
    },
    get: async (id) => {
      const items = await getApiMethod('getProduct')(id);
      return items;
    },
    create: async (data) => {
      const newItem = await getApiMethod('createProduct')(data);
      return newItem;
    },
    update: async (id, data) => {
      const updatedItem = await getApiMethod('updateProduct')(id, data);
      return updatedItem;
    },
    delete: async (id) => {
      await getApiMethod('deleteProduct')(id);
      return true;
    },
  };
}

// The db API that mirrors base44's globalThis.__B44_DB__ structure
// Set the global __B44_DB__ so that existing components that reference it work
globalThis.__B44_DB__ = {};

export const db = {
  auth: {
    isAuthenticated: async () => {
      try {
        const user = await apiClient.getCurrentUser();
        return !!user.user;
      } catch {
        return false;
      }
    },
    me: async () => {
      try {
        const data = await apiClient.getCurrentUser();
        return data.user;
      } catch {
        return null;
      }
    },
    login: async (username, password) => {
      return await apiClient.login(username, password);
    },
    logout: async () => {
      apiClient.logout();
    },
  },
  entities: {
    Product: createEntityApi('Product'),
    AppUser: createEntityApi('AppUser'),
    CatalogueConfig: createEntityApi('CatalogueConfig'),
    EditLog: createEntityApi('EditLog'),
    ExportLog: createEntityApi('ExportLog'),
  },
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        return await apiClient.uploadFile(file);
      },
    },
  },
};

// Assign to global so existing components using globalThis.__B44_DB__ work
globalThis.__B44_DB__ = {
  auth: db.auth,
  entities: db.entities,
  integrations: db.integrations,
};

export const base44 = db;
export default db;