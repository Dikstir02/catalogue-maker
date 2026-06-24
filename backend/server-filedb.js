import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

// ---------- File DB ----------
const DATA_DIR = path.join(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function defaultStore() {
  return {
    products: [],
    app_users: [
      {
        id: 'user_dexter',
        username: 'dexter',
        password: 'admin123',
        role: 'admin',
        created_date: new Date().toISOString(),
      },
    ],
    catalogue_configs: [
      {
        id: 'config_brands',
        config_key: 'brands',
        values: JSON.stringify(['DUPONT', 'ELIE BLEU', 'LFL', 'MORICI', 'RECIFE', 'SIGLO', 'VINBRO', 'XIKAR']),
        created_date: new Date().toISOString(),
      },
      {
        id: 'config_categories',
        config_key: 'categories',
        values: JSON.stringify(['Ashtray', 'Case', 'Cutter', 'Humidor', 'Lighter', 'Pen', 'Others', 'Set']),
        created_date: new Date().toISOString(),
      },
    ],
    edit_logs: [],
    export_logs: [],
  };
}

function loadStore() {
  ensureDataDir();
  if (!fs.existsSync(STORE_PATH)) {
    const s = defaultStore();
    fs.writeFileSync(STORE_PATH, JSON.stringify(s, null, 2), 'utf-8');
    return s;
  }

  const raw = fs.readFileSync(STORE_PATH, 'utf-8');
  if (!raw) return defaultStore();
  return JSON.parse(raw);
}

function saveStore(store) {
  ensureDataDir();
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

// Simple in-process mutex to reduce concurrent write corruption.
let writeQueue = Promise.resolve();
function queueWrite(fn) {
  writeQueue = writeQueue.then(() => fn()).catch((e) => {
    console.error('FileDB write failed', e);
    throw e;
  });
  return writeQueue;
}

function jsonOk(res, data) {
  return res.json(data);
}

// ---------- Auth (matches existing frontend expectations) ----------
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  try {
    const store = loadStore();
    const user = store.app_users.find((u) => u.username === username && u.password === password);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    return res.json({
      success: true,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (e) {
    return res.status(500).json({ message: e?.message || 'Login failed' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.json({ user: null });
  const token = authHeader.split(' ')[1];

  if (token !== 'demo-token') return res.json({ user: null });

  try {
    const store = loadStore();
    const user = store.app_users.find((u) => u.username === 'dexter') || null;
    return res.json({ user });
  } catch (e) {
    return res.status(500).json({ message: e?.message || 'Auth me failed' });
  }
});

// ---------- Products ----------
app.get('/api/products', async (req, res) => {
  const { sort, filter } = req.query;

  try {
    const store = loadStore();
    let products = [...store.products];

    if (filter) {
      const filters = JSON.parse(filter);
      for (const [key, value] of Object.entries(filters)) {
        products = products.filter((p) => String(p[key]) === String(value));
      }
    }

    if (sort) {
      const desc = String(sort).startsWith('-');
      const field = desc ? String(sort).slice(1) : String(sort);
      const allowed = new Set(['id', 'name', 'brand', 'category', 'price', 'description', 'image_url', 'created_date', 'updated_date']);
      if (allowed.has(field)) {
        products.sort((a, b) => {
          const av = a[field];
          const bv = b[field];
          if (av === bv) return 0;
          if (av == null) return 1;
          if (bv == null) return -1;
          // numeric compare for price
          if (field === 'price') return desc ? Number(bv) - Number(av) : Number(av) - Number(bv);
          const cmp = String(av).localeCompare(String(bv));
          return desc ? -cmp : cmp;
        });
      }
    }

    return jsonOk(res, products);
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to fetch products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const store = loadStore();
    const product = store.products.find((p) => p.id === req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    return jsonOk(res, product);
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed' });
  }
});

app.post('/api/products', async (req, res) => {
  const product = req.body || {};
  try {
    const now = new Date().toISOString();
    const id = generateId();
    const created = {
      id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: product.price,
      description: product.description,
      image_url: product.image_url,
      created_date: now,
      updated_date: now,
    };

    await queueWrite(() => {
      const store = loadStore();
      store.products.push(created);
      saveStore(store);
    });

    return jsonOk(res, created);
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Create product failed' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  const product = req.body || {};
  try {
    const now = new Date().toISOString();
    const updated = {
      ...product,
      id: req.params.id,
      updated_date: now,
    };

    let result;
    await queueWrite(() => {
      const store = loadStore();
      const idx = store.products.findIndex((p) => p.id === req.params.id);
      if (idx === -1) return;
      const prev = store.products[idx];
      store.products[idx] = {
        ...prev,
        name: product.name,
        brand: product.brand,
        category: product.category,
        price: product.price,
        description: product.description,
        image_url: product.image_url,
        updated_date: now,
      };
      result = store.products[idx];
      saveStore(store);
    });

    if (!result) return res.status(404).json({ message: 'Product not found' });
    return jsonOk(res, result);
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Update product failed' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await queueWrite(() => {
      const store = loadStore();
      store.products = store.products.filter((p) => p.id !== req.params.id);
      saveStore(store);
    });
    return jsonOk(res, { success: true });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Delete failed' });
  }
});

// ---------- Users ----------
app.get('/api/users', async (req, res) => {
  try {
    const store = loadStore();
    return jsonOk(res, store.app_users.map((u) => ({ id: u.id, username: u.username, role: u.role, created_date: u.created_date })));
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed' });
  }
});

app.post('/api/users', async (req, res) => {
  const user = req.body || {};
  try {
    const id = generateId();
    const now = new Date().toISOString();

    let created;
    await queueWrite(() => {
      const store = loadStore();
      // simplistic: allow duplicates? Keep behavior similar to sqlite unique username.
      if (store.app_users.some((u) => u.username === user.username)) {
        return;
      }
      created = {
        id,
        username: user.username,
        password: user.password,
        role: user.role,
        created_date: now,
      };
      store.app_users.push(created);
      saveStore(store);
    });

    if (!created) return res.status(409).json({ message: 'Username already exists' });
    return jsonOk(res, created);
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Create user failed' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const user = req.body || {};
  try {
    let updated;
    await queueWrite(() => {
      const store = loadStore();
      const idx = store.app_users.findIndex((u) => u.id === req.params.id);
      if (idx === -1) return;
      store.app_users[idx] = {
        ...store.app_users[idx],
        username: user.username,
        password: user.password,
        role: user.role,
      };
      updated = store.app_users[idx];
      saveStore(store);
    });

    if (!updated) return res.status(404).json({ success: false });
    return jsonOk(res, updated);
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Update user failed' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await queueWrite(() => {
      const store = loadStore();
      store.app_users = store.app_users.filter((u) => u.id !== req.params.id);
      saveStore(store);
    });
    return jsonOk(res, { success: true });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Delete failed' });
  }
});

// ---------- Configs ----------
app.get('/api/configs', async (req, res) => {
  try {
    const store = loadStore();
    return jsonOk(res, store.catalogue_configs);
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed' });
  }
});

app.put('/api/configs/:id', async (req, res) => {
  const config = req.body || {};
  try {
    let updated;
    await queueWrite(() => {
      const store = loadStore();
      const idx = store.catalogue_configs.findIndex((c) => c.id === req.params.id);
      if (idx === -1) return;
      store.catalogue_configs[idx] = {
        ...store.catalogue_configs[idx],
        config_key: config.config_key,
        values: config.values,
      };
      updated = store.catalogue_configs[idx];
      saveStore(store);
    });

    if (!updated) return res.status(404).json({ success: false });
    return jsonOk(res, updated);
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Update config failed' });
  }
});

// ---------- Logs ----------
app.get('/api/edit-logs', async (req, res) => {
  try {
    const store = loadStore();
    const logs = [...store.edit_logs].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    return jsonOk(res, logs);
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed' });
  }
});

app.post('/api/edit-logs', async (req, res) => {
  const log = req.body || {};
  try {
    const id = generateId();
    const created = {
      id,
      action: log.action,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      changes: JSON.stringify(log.changes),
      user: log.user,
      timestamp: log.timestamp || new Date().toISOString(),
    };

    await queueWrite(() => {
      const store = loadStore();
      store.edit_logs.push(created);
      saveStore(store);
    });

    return jsonOk(res, created);
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed' });
  }
});

app.get('/api/export-logs', async (req, res) => {
  try {
    const store = loadStore();
    const logs = [...store.export_logs].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    return jsonOk(res, logs);
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed' });
  }
});

app.post('/api/export-logs', async (req, res) => {
  const log = req.body || {};
  try {
    const id = generateId();
    const created = {
      id,
      filename: log.filename,
      format: log.format,
      record_count: log.record_count,
      user: log.user,
      timestamp: log.timestamp || new Date().toISOString(),
    };

    await queueWrite(() => {
      const store = loadStore();
      store.export_logs.push(created);
      saveStore(store);
    });

    return jsonOk(res, created);
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed' });
  }
});

// ---------- Upload (texts only: accept but ignore) ----------
const upload = multer({ storage: multer.memoryStorage() });
app.post('/api/upload', upload.single('file'), (req, res) => {
  // You said no images needed; just return an empty URL.
  // If frontend expects a string, it will still receive one.
  return res.json({ file_url: '' });
});

// ---------- Health ----------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

