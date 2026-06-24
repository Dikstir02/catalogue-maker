import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

const app = express();
const PORT = process.env.PORT || 3001;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('Missing DATABASE_URL env var');
}

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

app.use(cors());
app.use(express.json({ limit: '20mb' }));

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

async function initDb() {
  // Create schema compatible with existing app expectations.
  // Note: We store configs.values as TEXT (JSON string).
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT,
      category TEXT,
      price REAL,
      description TEXT,
      image_url TEXT,
      created_date TEXT,
      updated_date TEXT
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_date TEXT
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS catalogue_configs (
      id TEXT PRIMARY KEY,
      config_key TEXT UNIQUE NOT NULL,
      values TEXT,
      created_date TEXT
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS edit_logs (
      id TEXT PRIMARY KEY,
      action TEXT,
      entity_type TEXT,
      entity_id TEXT,
      changes TEXT,
      user TEXT,
      timestamp TEXT
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS export_logs (
      id TEXT PRIMARY KEY,
      filename TEXT,
      format TEXT,
      record_count INTEGER,
      user TEXT,
      timestamp TEXT
    );
  `);

  // Seed defaults (idempotent)
  await pool.query(`
    INSERT INTO app_users (id, username, password, role, created_date)
    VALUES ('user_dexter', 'dexter', 'admin123', 'admin', NOW()::text)
    ON CONFLICT (id) DO NOTHING;
  `);

  await pool.query(`
    INSERT INTO catalogue_configs (id, config_key, values, created_date)
    VALUES
      ('config_brands', 'brands', '["DUPONT", "ELIE BLEU", "LFL", "MORICI", "RECIFE", "SIGLO", "VINBRO", "XIKAR"]', NOW()::text),
      ('config_categories', 'categories', '["Ashtray", "Case", "Cutter", "Humidor", "Lighter", "Pen", "Others", "Set"]', NOW()::text)
    ON CONFLICT (id) DO NOTHING;
  `);
}

// Auth
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const r = await pool.query(
      'SELECT id, username, role FROM app_users WHERE username=$1 AND password=$2 LIMIT 1',
      [username, password]
    );

    if (r.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = r.rows[0];
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
    const r = await pool.query('SELECT id, username, role FROM app_users WHERE username=$1 LIMIT 1', ['dexter']);
    return res.json({ user: r.rows[0] || null });
  } catch (e) {
    return res.status(500).json({ message: e?.message || 'Auth me failed' });
  }
});

// Products
app.get('/api/products', async (req, res) => {
  const { sort, filter } = req.query;
  const where = [];
  const params = [];

  try {
    if (filter) {
      const filters = JSON.parse(filter);
      let i = 1;
      for (const [key, value] of Object.entries(filters)) {
        where.push(`${key} = $${i}`);
        params.push(value);
        i++;
      }
    }

    let sql = 'SELECT * FROM products';
    if (where.length) sql += ' WHERE ' + where.join(' AND ');

    if (sort) {
      const desc = String(sort).startsWith('-');
      const field = desc ? String(sort).slice(1) : String(sort);
      // Basic whitelist to avoid SQL injection on column names.
      const allowed = new Set(['id', 'name', 'brand', 'category', 'price', 'description', 'image_url', 'created_date', 'updated_date']);
      if (allowed.has(field)) {
        sql += ` ORDER BY ${field} ${desc ? 'DESC' : 'ASC'}`;
      }
    }

    const r = await pool.query(sql, params);
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Failed to fetch products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM products WHERE id=$1 LIMIT 1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ message: 'Product not found' });
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Failed' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const product = req.body;
    const id = generateId();
    const now = new Date().toISOString();

    const r = await pool.query(
      `INSERT INTO products (id, name, brand, category, price, description, image_url, created_date, updated_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        id,
        product.name,
        product.brand,
        product.category,
        product.price,
        product.description,
        product.image_url,
        now,
        now,
      ]
    );

    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Create product failed' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const product = req.body;
    const now = new Date().toISOString();

    const r = await pool.query(
      `UPDATE products
       SET name=$1, brand=$2, category=$3, price=$4, description=$5, image_url=$6, updated_date=$7
       WHERE id=$8
       RETURNING *`,
      [
        product.name,
        product.brand,
        product.category,
        product.price,
        product.description,
        product.image_url,
        now,
        req.params.id,
      ]
    );

    if (r.rows.length === 0) return res.status(404).json({ message: 'Product not found' });
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Update product failed' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Delete failed' });
  }
});

// Users
app.get('/api/users', async (req, res) => {
  try {
    const r = await pool.query('SELECT id, username, role, created_date FROM app_users ORDER BY created_date DESC');
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Failed' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const user = req.body;
    const id = generateId();
    const now = new Date().toISOString();

    const r = await pool.query(
      `INSERT INTO app_users (id, username, password, role, created_date)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, username, role, created_date`,
      [id, user.username, user.password, user.role, now]
    );

    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Create user failed' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const user = req.body;
    const r = await pool.query(
      `UPDATE app_users
       SET username=$1, password=$2, role=$3
       WHERE id=$4
       RETURNING id, username, role, created_date`,
      [user.username, user.password, user.role, req.params.id]
    );

    if (r.rows.length === 0) return res.status(404).json({ success: false });
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Update user failed' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM app_users WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Delete failed' });
  }
});

// Configs
app.get('/api/configs', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM catalogue_configs ORDER BY created_date DESC');
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Failed' });
  }
});

app.put('/api/configs/:id', async (req, res) => {
  try {
    const config = req.body;
    const r = await pool.query(
      `UPDATE catalogue_configs
       SET config_key=$1, values=$2
       WHERE id=$3
       RETURNING *`,
      [config.config_key, config.values, req.params.id]
    );

    if (r.rows.length === 0) return res.status(404).json({ success: false });
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Update config failed' });
  }
});

// Edit logs
app.get('/api/edit-logs', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM edit_logs ORDER BY timestamp DESC');
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Failed' });
  }
});

app.post('/api/edit-logs', async (req, res) => {
  try {
    const log = req.body;
    const id = generateId();

    const r = await pool.query(
      `INSERT INTO edit_logs (id, action, entity_type, entity_id, changes, user, timestamp)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [id, log.action, log.entity_type, log.entity_id, JSON.stringify(log.changes), log.user, log.timestamp]
    );

    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Failed' });
  }
});

// Export logs
app.get('/api/export-logs', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM export_logs ORDER BY timestamp DESC');
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Failed' });
  }
});

app.post('/api/export-logs', async (req, res) => {
  try {
    const log = req.body;
    const id = generateId();

    const r = await pool.query(
      `INSERT INTO export_logs (id, filename, format, record_count, user, timestamp)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [id, log.filename, log.format, log.record_count, log.user, log.timestamp]
    );

    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Failed' });
  }
});

// Upload: still returns data URL (no extra storage setup)
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const base64 = req.file.buffer.toString('base64');
  const fileUrl = `data:${req.file.mimetype};base64,${base64}`;
  res.json({ file_url: fileUrl });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((e) => {
    console.error('DB init failed', e);
    process.exit(1);
  });

