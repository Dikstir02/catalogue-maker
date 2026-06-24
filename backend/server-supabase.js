import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware
app.use(cors());
app.use(express.json());

// Helper functions
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

// Auth endpoints
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const { data, error } = await supabase
    .from('app_users')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .single();

  if (error || !data) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  res.json({ 
    success: true, 
    user: { id: data.id, username: data.username, role: data.role } 
  });
});

app.get('/api/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.json({ user: null });
  }

  const token = authHeader.split(' ')[1];
  if (token === 'demo-token') {
    const { data } = await supabase
      .from('app_users')
      .select('id, username, role')
      .eq('username', 'dexter')
      .single();
    
    return res.json({ user: data });
  }
  
  res.json({ user: null });
});

// Product endpoints
app.get('/api/products', async (req, res) => {
  const { sort, filter } = req.query;
  let query = supabase.from('products').select('*');

  if (filter) {
    const filters = JSON.parse(filter);
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  if (sort) {
    const desc = sort.startsWith('-');
    const field = desc ? sort.slice(1) : sort;
    query = query.order(field, { ascending: !desc });
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data || []);
});

app.get('/api/products/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error || !data) {
    return res.status(404).json({ message: 'Product not found' });
  }

  res.json(data);
});

app.post('/api/products', async (req, res) => {
  const product = req.body;
  const id = generateId();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('products')
    .insert([{
      id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: product.price,
      description: product.description,
      image_url: product.image_url,
      created_date: now,
      updated_date: now
    }])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

app.put('/api/products/:id', async (req, res) => {
  const product = req.body;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('products')
    .update({
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: product.price,
      description: product.description,
      image_url: product.image_url,
      updated_date: now
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

app.delete('/api/products/:id', async (req, res) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', req.params.id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true });
});

// AppUser endpoints
app.get('/api/users', async (req, res) => {
  const { data, error } = await supabase
    .from('app_users')
    .select('id, username, role, created_date');

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data || []);
});

app.post('/api/users', async (req, res) => {
  const user = req.body;
  const id = generateId();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('app_users')
    .insert([{
      id,
      username: user.username,
      password: user.password,
      role: user.role,
      created_date: now
    }])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

app.put('/api/users/:id', async (req, res) => {
  const user = req.body;

  const { data, error } = await supabase
    .from('app_users')
    .update({
      username: user.username,
      password: user.password,
      role: user.role
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

app.delete('/api/users/:id', async (req, res) => {
  const { error } = await supabase
    .from('app_users')
    .delete()
    .eq('id', req.params.id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true });
});

// CatalogueConfig endpoints
app.get('/api/configs', async (req, res) => {
  const { data, error } = await supabase
    .from('catalogue_configs')
    .select('*');

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data || []);
});

app.put('/api/configs/:id', async (req, res) => {
  const config = req.body;

  const { data, error } = await supabase
    .from('catalogue_configs')
    .update({
      config_key: config.config_key,
      values: config.values
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// EditLog endpoints
app.get('/api/edit-logs', async (req, res) => {
  const { data, error } = await supabase
    .from('edit_logs')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data || []);
});

app.post('/api/edit-logs', async (req, res) => {
  const log = req.body;
  const id = generateId();

  const { data, error } = await supabase
    .from('edit_logs')
    .insert([{
      id,
      action: log.action,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      changes: JSON.stringify(log.changes),
      user: log.user,
      timestamp: log.timestamp
    }])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ ...log, id });
});

// ExportLog endpoints
app.get('/api/export-logs', async (req, res) => {
  const { data, error } = await supabase
    .from('export_logs')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data || []);
});

app.post('/api/export-logs', async (req, res) => {
  const log = req.body;
  const id = generateId();

  const { data, error } = await supabase
    .from('export_logs')
    .insert([{
      id,
      filename: log.filename,
      format: log.format,
      record_count: log.record_count,
      user: log.user,
      timestamp: log.timestamp
    }])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ ...log, id });
});

// File upload endpoint
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  // For production, upload to Supabase Storage
  const fileExt = req.file.originalname.split('.').pop();
  const fileName = `${generateId()}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  const { data, error } = await supabase.storage
    .from('catalogue-images')
    .upload(filePath, req.file.buffer, {
      contentType: req.file.mimetype
    });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const { data: { publicUrl } } = supabase.storage
    .from('catalogue-images')
    .getPublicUrl(filePath);

  res.json({ file_url: publicUrl });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});