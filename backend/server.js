import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const db = new Database(path.join(__dirname, 'catalogue.db'));

// Create tables
db.exec(`
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
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS app_users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_date TEXT
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS catalogue_configs (
    id TEXT PRIMARY KEY,
    config_key TEXT UNIQUE NOT NULL,
    config_values TEXT,
    created_date TEXT
  )
`);


db.exec(`
  CREATE TABLE IF NOT EXISTS edit_logs (
    id TEXT PRIMARY KEY,
    action TEXT,
    entity_type TEXT,
    entity_id TEXT,
    changes TEXT,
    user TEXT,
    timestamp TEXT
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS export_logs (
    id TEXT PRIMARY KEY,
    filename TEXT,
    format TEXT,
    record_count INTEGER,
    user TEXT,
    timestamp TEXT
  )
`);

// Initialize default data
const defaultUsers = [
  { id: 'user_dexter', username: 'dexter', password: 'admin123', role: 'admin', created_date: new Date().toISOString() }
];

const defaultConfigs = [
  { id: 'config_brands', config_key: 'brands', values: JSON.stringify(['DUPONT', 'ELIE BLEU', 'LFL', 'MORICI', 'RECIFE', 'SIGLO', 'VINBRO', 'XIKAR']), created_date: new Date().toISOString() },
  { id: 'config_categories', config_key: 'categories', values: JSON.stringify(['Ashtray', 'Case', 'Cutter', 'Humidor', 'Lighter', 'Pen', 'Others', 'Set']), created_date: new Date().toISOString() }
];


const insertUser = db.prepare('INSERT OR IGNORE INTO app_users (id, username, password, role, created_date) VALUES (?, ?, ?, ?, ?)');
const insertConfig = db.prepare('INSERT OR IGNORE INTO catalogue_configs (id, config_key, config_values, created_date) VALUES (?, ?, ?, ?)');


const insertManyUsers = db.transaction((users) => {
  for (const user of users) {
    insertUser.run(user.id, user.username, user.password, user.role, user.created_date);
  }
});

const insertManyConfigs = db.transaction((configs) => {
  for (const config of configs) {
    insertConfig.run(config.id, config.config_key, config.values, config.created_date);
  }
});

// Seed defaults. Guarded to prevent Render startup failure due to any single bad row.
try {
  insertManyUsers(defaultUsers);
  insertManyConfigs(defaultConfigs);
} catch (e) {
  console.error('SQLite default seed failed:', e?.message || e);
}


// Helper functions
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

// --- Backup storage (latest cloud backup JSON) ---
const BACKUP_FILE = path.join(__dirname, 'latest-backup.json');

const readLatestBackup = () => {
  try {
    const raw = require('fs').readFileSync(BACKUP_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const writeLatestBackup = (data) => {
  require('fs').writeFileSync(BACKUP_FILE, JSON.stringify(data, null, 2), 'utf-8');
};

// Backup endpoints
app.post('/api/backup', (req, res) => {
  try {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ message: 'Invalid backup payload' });
    }
    writeLatestBackup(data);
    res.json({ success: true, message: 'Backup stored successfully' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to store backup' });
  }
});

app.get('/api/backup', (req, res) => {
  const data = readLatestBackup();
  if (!data) {
    return res.status(404).json({ message: 'No backup found yet' });
  }
  res.json(data);
});

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM app_users WHERE username = ? AND password = ?').get(username, password);
  if (user) {
    res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.json({ user: null });
  }
  // Simple token validation (in production, use JWT)
  const token = authHeader.split(' ')[1];
  if (token === 'demo-token') {
    const user = db.prepare('SELECT id, username, role FROM app_users WHERE username = ?').get('dexter');
    return res.json({ user });
  }
  res.json({ user: null });
});

// Product endpoints
app.get('/api/products', (req, res) => {
  const { sort, filter } = req.query;
  let query = 'SELECT * FROM products';
  const params = [];
  
  if (filter) {
    const filters = JSON.parse(filter);
    const conditions = [];
    for (const [key, value] of Object.entries(filters)) {
      conditions.push(`${key} = ?`);
      params.push(value);
    }
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  if (sort) {
    const desc = sort.startsWith('-');
    const field = desc ? sort.slice(1) : sort;
    query += ` ORDER BY ${field} ${desc ? 'DESC' : 'ASC'}`;
  }
  
  const products = db.prepare(query).all(...params);
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
});

app.post('/api/products', (req, res) => {
  const product = req.body;
  const id = generateId();
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO products (id, name, brand, category, price, description, image_url, created_date, updated_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, product.name, product.brand, product.category, product.price, product.description, product.image_url, now, now);
  
  res.json({ ...product, id, created_date: now, updated_date: now });
});

app.put('/api/products/:id', (req, res) => {
  const product = req.body;
  const now = new Date().toISOString();
  
  db.prepare(`
    UPDATE products 
    SET name = ?, brand = ?, category = ?, price = ?, description = ?, image_url = ?, updated_date = ?
    WHERE id = ?
  `).run(product.name, product.brand, product.category, product.price, product.description, product.image_url, now, req.params.id);
  
  res.json({ ...product, id: req.params.id, updated_date: now });
});

app.delete('/api/products/:id', (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// AppUser endpoints
app.get('/api/users', (req, res) => {
  const users = db.prepare('SELECT id, username, role, created_date FROM app_users').all();
  res.json(users);
});

app.post('/api/users', (req, res) => {
  const user = req.body;
  const id = generateId();
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO app_users (id, username, password, role, created_date)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, user.username, user.password, user.role, now);
  
  res.json({ ...user, id, created_date: now });
});

app.put('/api/users/:id', (req, res) => {
  const user = req.body;
  db.prepare(`
    UPDATE app_users SET username = ?, password = ?, role = ?
    WHERE id = ?
  `).run(user.username, user.password, user.role, req.params.id);
  
  res.json({ ...user, id: req.params.id });
});

app.delete('/api/users/:id', (req, res) => {
  db.prepare('DELETE FROM app_users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// CatalogueConfig endpoints
app.get('/api/configs', (req, res) => {
  const configs = db.prepare('SELECT * FROM catalogue_configs').all();
  res.json(configs);
});

app.put('/api/configs/:id', (req, res) => {
  const config = req.body;
db.prepare(`
    UPDATE catalogue_configs SET config_key = ?, config_values = ?
    WHERE id = ?
  `).run(config.config_key, config.values, req.params.id);

  
  res.json({ ...config, id: req.params.id });
});

// EditLog endpoints
app.get('/api/edit-logs', (req, res) => {
  const logs = db.prepare('SELECT * FROM edit_logs ORDER BY timestamp DESC').all();
  res.json(logs);
});

app.post('/api/edit-logs', (req, res) => {
  const log = req.body;
  const id = generateId();
  
  db.prepare(`
    INSERT INTO edit_logs (id, action, entity_type, entity_id, changes, user, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, log.action, log.entity_type, log.entity_id, JSON.stringify(log.changes), log.user, log.timestamp);
  
  res.json({ ...log, id });
});

// ExportLog endpoints
app.get('/api/export-logs', (req, res) => {
  const logs = db.prepare('SELECT * FROM export_logs ORDER BY timestamp DESC').all();
  res.json(logs);
});

app.post('/api/export-logs', (req, res) => {
  const log = req.body;
  const id = generateId();
  
  db.prepare(`
    INSERT INTO export_logs (id, filename, format, record_count, user, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, log.filename, log.format, log.record_count, log.user, log.timestamp);
  
  res.json({ ...log, id });
});

// File upload endpoint
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  
  // In production, you would upload to cloud storage (S3, Cloudinary, etc.)
  // For now, we'll return a data URL
  const base64 = req.file.buffer.toString('base64');
  const fileUrl = `data:${req.file.mimetype};base64,${base64}`;
  
  res.json({ file_url: fileUrl });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});