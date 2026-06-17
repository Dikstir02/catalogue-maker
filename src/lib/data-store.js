// Standalone data store that replaces base44's globalThis.__B44_DB__
// All data is stored in localStorage using a prefix-based approach

const PREFIX = 'catalogue_';

function getStorageKey(entityType) {
  return `${PREFIX}${entityType}`;
}

function getAll(entityType) {
  try {
    const raw = localStorage.getItem(getStorageKey(entityType));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(entityType, items) {
  localStorage.setItem(getStorageKey(entityType), JSON.stringify(items));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

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

function createEntityApi(entityType) {
  return {
    list: (sortStr) => {
      const items = getAll(entityType);
      return sortStr ? sortItems(items, sortStr) : items;
    },
    filter: (criteria) => {
      const items = getAll(entityType);
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
    get: (id) => {
      const items = getAll(entityType);
      return items.find((item) => item.id === id) || null;
    },
    create: (data) => {
      const items = getAll(entityType);
      const newItem = { id: generateId(), ...data, created_date: new Date().toISOString() };
      items.push(newItem);
      saveAll(entityType, items);
      return newItem;
    },
    update: (id, data) => {
      const items = getAll(entityType);
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) throw new Error(`Entity ${entityType} with id ${id} not found`);
      items[index] = { ...items[index], ...data };
      saveAll(entityType, items);
      return items[index];
    },
    delete: (id) => {
      const items = getAll(entityType);
      const filtered = items.filter((item) => item.id !== id);
      if (filtered.length === items.length) throw new Error(`Entity ${entityType} with id ${id} not found`);
      saveAll(entityType, filtered);
      return true;
    },
  };
}

// Initialize with default admin user if not exists
function ensureDefaults() {
  const users = getAll('AppUser');
  const hasDexter = users.some((u) => u.username.toLowerCase() === 'dexter');
  if (!hasDexter) {
    users.push({
      id: generateId(),
      username: 'dexter',
      password: 'admin123',
      role: 'admin',
      created_date: new Date().toISOString(),
    });
    saveAll('AppUser', users);
  }

  const configs = getAll('CatalogueConfig');
  const hasBrands = configs.some((c) => c.config_key === 'brands');
  const hasCategories = configs.some((c) => c.config_key === 'categories');
  if (!hasBrands) {
    configs.push({
      id: generateId(),
      config_key: 'brands',
      values: JSON.stringify(['DUPONT', 'ELIE BLEU', 'LFL', 'MORICI', 'RECIFE', 'SIGLO', 'VINBRO', 'XIKAR']),
      created_date: new Date().toISOString(),
    });
  }
  if (!hasCategories) {
    configs.push({
      id: generateId(),
      config_key: 'categories',
      values: JSON.stringify(['Ashtray', 'Case', 'Cutter', 'Humidor', 'Lighter', 'Pen', 'Others', 'Set']),
      created_date: new Date().toISOString(),
    });
  }
  saveAll('CatalogueConfig', configs);
}

// Ensure defaults are set
ensureDefaults();

// The db API that mirrors base44's globalThis.__B44_DB__ structure
// Set the global __B44_DB__ so that existing components that reference it work
globalThis.__B44_DB__ = {};

export const db = {
  auth: {
    isAuthenticated: async () => true,
    me: async () => null,
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
        // For standalone app, we convert image files to data URLs
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({ file_url: reader.result });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
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
