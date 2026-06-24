# Complete Deployment Guide - Make Your App Live Online

## Prerequisites Check

### 1. Install Git (if not installed)
Download from: https://git-scm.com/download/win
- Run the installer
- Use all default settings
- Restart your computer after installation

### 2. Create GitHub Account
- Go to https://github.com
- Sign up for a free account

---

## Phase 1: Prepare Your Code

### Step 1: Update .gitignore (Already Done ✅)
The `.gitignore` file has been created to exclude:
- node_modules
- .env files (secrets)
- database files
- build outputs

### Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `catalogue-maker`
3. Description: "Online catalogue maker with cloud database"
4. Select: **Public** (or Private if you prefer)
5. **DO NOT** check "Add a README file"
6. Click **Create repository**

### Step 3: Initialize Git and Push Code

Open Git Bash (installed with Git) or Command Prompt and run:

```bash
# Navigate to your project
cd c:/Users/Dexter/Desktop/catalogue-maker

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - cloud database setup"

# Rename branch to main
git branch -M main

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/catalogue-maker.git

# Push to GitHub
git push -u origin main
```

**Example:**
```bash
git remote add origin https://github.com/dexter/catalogue-maker.git
git push -u origin main
```

---

## Phase 2: Deploy Backend to Cloud

### Option A: Deploy Backend to Render.com (RECOMMENDED - Free)

#### Step 1: Create Separate Backend Repository

1. Go to https://github.com/new
2. Repository name: `catalogue-maker-backend`
3. Description: "Backend API for catalogue maker"
4. Create repository

#### Step 2: Push Backend Code

```bash
# Create a temporary folder
mkdir c:/temp/catalogue-backend
cd c:/temp/catalogue-backend

# Copy backend files
copy c:/Users/Dexter/Desktop/catalogue-maker/backend/* .

# Initialize git
git init
git add .
git commit -m "Backend API"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/catalogue-maker-backend.git

# Push
git branch -M main
git push -u origin main
```

#### Step 3: Deploy on Render

1. Go to https://render.com and sign up with GitHub
2. Click **New** → **Web Service**
3. Click **Connect** next to your `catalogue-maker-backend` repository
4. Configure:
   - **Name**: catalogue-maker-api
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free
5. Click **Create Web Service**
6. Wait 2-3 minutes for deployment
7. Your API URL will be: `https://catalogue-maker-api.onrender.com`

#### Step 4: Test Backend

Open browser to: `https://catalogue-maker-api.onrender.com/api/health`

You should see: `{"status":"ok","timestamp":"..."}`

---

## Phase 3: Deploy Frontend to Cloud

### Option A: Deploy to Netlify (Recommended - Free)

#### Step 1: Build Frontend

```bash
cd c:/Users/Dexter/Desktop/catalogue-maker

# Update .env with your Render URL
# Edit .env file and change to:
# VITE_API_URL=https://catalogue-maker-api.onrender.com/api

# Install dependencies
npm install

# Build for production
npm run build
```

#### Step 2: Deploy to Netlify

1. Go to https://app.netlify.com/drop
2. Drag the `dist` folder from your project into the browser
3. Your site will be live at: `https://random-name.netlify.app`

**OR use Netlify CLI:**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

### Option B: Deploy to Vercel (Alternative - Free)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd c:/Users/Dexter/Desktop/catalogue-maker
vercel --prod
```

Follow the prompts to complete deployment.

---

## Phase 4: Configure Online Database

### Current Setup: SQLite (Ephemeral)

**Important**: Render's free tier uses ephemeral storage. Your database will reset when the app redeploys.

### For Permanent Database: Use Supabase (Free PostgreSQL)

#### Step 1: Create Supabase Account

1. Go to https://supabase.com
2. Sign up with GitHub
3. Click **New Project**
4. Fill in:
   - Name: catalogue-maker
   - Database Password: (save this!)
   - Region: Select closest to you
5. Click **Create new project**
6. Wait 2 minutes for setup

#### Step 2: Create Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Paste and run this SQL:

```sql
CREATE TABLE products (
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

CREATE TABLE app_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_date TEXT
);

CREATE TABLE catalogue_configs (
  id TEXT PRIMARY KEY,
  config_key TEXT UNIQUE NOT NULL,
  values TEXT,
  created_date TEXT
);

CREATE TABLE edit_logs (
  id TEXT PRIMARY KEY,
  action TEXT,
  entity_type TEXT,
  entity_id TEXT,
  changes TEXT,
  user TEXT,
  timestamp TEXT
);

CREATE TABLE export_logs (
  id TEXT PRIMARY KEY,
  filename TEXT,
  format TEXT,
  record_count INTEGER,
  user TEXT,
  timestamp TEXT
);

-- Insert default admin user
INSERT INTO app_users (id, username, password, role, created_date)
VALUES ('user_dexter', 'dexter', 'admin123', 'admin', '2024-01-01T00:00:00.000Z');

-- Insert default configs
INSERT INTO catalogue_configs (id, config_key, values, created_date)
VALUES ('config_brands', 'brands', '["DUPONT", "ELIE BLEU", "LFL", "MORICI", "RECIFE", "SIGLO", "VINBRO", "XIKAR"]', '2024-01-01T00:00:00.000Z');

INSERT INTO catalogue_configs (id, config_key, values, created_date)
VALUES ('config_categories', 'categories', '["Ashtray", "Case", "Cutter", "Humidor", "Lighter", "Pen", "Others", "Set"]', '2024-01-01T00:00:00.000Z');
```

4. Click **Run** to execute

#### Step 3: Get Supabase Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### Step 4: Update Backend for Supabase

Create `backend/supabase-server.js`:

```javascript
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

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
    return res.status(500).json({ message: error.message });
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
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('products')
    .insert([{ ...product, created_date: now, updated_date: now }])
    .select()
    .single();
  
  if (error) {
    return res.status(500).json({ message: error.message });
  }
  
  res.json(data);
});

app.put('/api/products/:id', async (req, res) => {
  const product = req.body;
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('products')
    .update({ ...product, updated_date: now })
    .eq('id', req.params.id)
    .select()
    .single();
  
  if (error) {
    return res.status(500).json({ message: error.message });
  }
  
  res.json(data);
});

app.delete('/api/products/:id', async (req, res) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', req.params.id);
  
  if (error) {
    return res.status(500).json({ message: error.message });
  }
  
  res.json({ success: true });
});

// Users endpoints
app.get('/api/users', async (req, res) => {
  const { data, error } = await supabase
    .from('app_users')
    .select('id, username, role, created_date');
  
  if (error) {
    return res.status(500).json({ message: error.message });
  }
  
  res.json(data || []);
});

app.post('/api/users', async (req, res) => {
  const user = req.body;
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('app_users')
    .insert([{ ...user, created_date: now }])
    .select()
    .single();
  
  if (error) {
    return res.status(500).json({ message: error.message });
  }
  
  res.json(data);
});

app.put('/api/users/:id', async (req, res) => {
  const user = req.body;
  
  const { data, error } = await supabase
    .from('app_users')
    .update(user)
    .eq('id', req.params.id)
    .select()
    .single();
  
  if (error) {
    return res.status(500).json({ message: error.message });
  }
  
  res.json(data);
});

app.delete('/api/users/:id', async (req, res) => {
  const { error } = await supabase
    .from('app_users')
    .delete()
    .eq('id', req.params.id);
  
  if (error) {
    return res.status(500).json({ message: error.message });
  }
  
  res.json({ success: true });
});

// Configs endpoints
app.get('/api/configs', async (req, res) => {
  const { data, error } = await supabase
    .from('catalogue_configs')
    .select('*');
  
  if (error) {
    return res.status(500).json({ message: error.message });
  }
  
  res.json(data || []);
});

app.put('/api/configs/:id', async (req, res) => {
  const config = req.body;
  
  const { data, error } = await supabase
    .from('catalogue_configs')
    .update(config)
    .eq('id', req.params.id)
    .select()
    .single();
  
  if (error) {
    return res.status(500).json({ message: error.message });
  }
  
  res.json(data);
});

// Edit Logs endpoints
app.get('/api/edit-logs', async (req, res) => {
  const { data, error } = await supabase
    .from('edit_logs')
    .select('*')
    .order('timestamp', { ascending: false });
  
  if (error) {
    return res.status(500).json({ message: error.message });
  }
  
  res.json(data || []);
});

app.post('/api/edit-logs', async (req, res) => {
  const log = req.body;
  
  const { data, error } = await supabase
    .from('edit_logs')
    .insert([log])
    .select()
    .single();
  
  if (error) {
    return res.status(500).json({ message: error.message });
  }
  
  res.json(data);
});

// Export Logs endpoints
app.get('/api/export-logs', async (req, res) => {
  const { data, error } = await supabase
    .from('export_logs')
    .select('*')
    .order('timestamp', { ascending: false });
  
  if (error) {
    return res.status(500).json({ message: error.message });
  }
  
  res.json(data || []);
});

app.post('/api/export-logs', async (req, res) => {
  const log = req.body;
  
  const { data, error } = await supabase
    .from('export_logs')
    .insert([log])
    .select()
    .single();
  
  if (error) {
    return res.status(500).json({ message: error.message });
  }
  
  res.json(data);
});

// File upload endpoint
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  
  // Upload to Supabase Storage
  const fileExt = req.file.originalname.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(fileName, req.file.buffer, {
      contentType: req.file.mimetype,
    });
  
  if (error) {
    return res.status(500).json({ message: error.message });
  }
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('uploads')
    .getPublicUrl(fileName);
  
  res.json({ file_url: publicUrl });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

#### Step 5: Update Backend package.json

Create `backend/package-supabase.json`:

```json
{
  "name": "catalogue-maker-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node supabase-server.js",
    "dev": "node --watch supabase-server.js"
  },
  "dependencies": {
    "express": "^4.21.0",
    "cors": "^2.8.5",
    "@supabase/supabase-js": "^2.39.0",
    "multer": "^1.4.5-lts.1"
  }
}
```

#### Step 6: Deploy Supabase Backend

1. In your backend GitHub repo, replace `server.js` with `supabase-server.js`
2. Replace `package.json` with `package-supabase.json`
3. Commit and push changes
4. In Render dashboard, add environment variables:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anon key
5. Redeploy on Render

#### Step 7: Create Storage Bucket in Supabase

1. In Supabase dashboard, go to **Storage**
2. Click **New bucket**
3. Name: `uploads`
4. Set as **Public**
5. Click **Create bucket**

---

## Phase 5: Final Configuration

### Update Frontend .env

```env
VITE_API_URL=https://catalogue-maker-api.onrender.com/api
```

### Rebuild and Deploy Frontend

```bash
cd c:/Users/Dexter/Desktop/catalogue-maker
npm install
npm run build
```

Deploy the `dist` folder to Netlify/Vercel again.

---

## Your Live App URLs

After deployment, you'll have:

- **Frontend**: `https://your-site.netlify.app` (or Vercel URL)
- **Backend API**: `https://catalogue-maker-api.onrender.com`
- **Database**: Supabase PostgreSQL (permanent, never resets)

---

## Testing Your Live App

1. Open your frontend URL
2. Login with: `dexter` / `admin123`
3. Create a product
4. Close browser
5. Reopen URL - your data persists!
6. Share URL with others - they can access too!

---

## Cost: $0/month

- GitHub: Free
- Render Backend: Free (with limitations)
- Supabase Database: Free (500MB)
- Netlify Frontend: Free
- **Total: $0**

---

## Maintenance

### Backup Database (Supabase)
1. Go to Supabase → Settings → Database
2. Click **Backup** → **Download backup**

### Monitor Backend
1. Go to Render dashboard
2. Check logs for errors
3. Monitor usage

### Update Code
```bash
git add .
git commit -m "Update description"
git push
```

Render will auto-deploy on push!

---

## Troubleshooting

### Backend not responding?
- Check Render logs
- Verify SUPABASE_URL and SUPABASE_ANON_KEY are set
- Test API directly: `https://your-app.onrender.com/api/health`

### Frontend can't connect?
- Check .env has correct API URL
- Verify CORS is enabled (it is in the code)
- Check browser console for errors

### Database errors?
- Verify Supabase tables were created
- Check Supabase logs
- Ensure storage bucket exists for uploads

---

## Next Steps

1. ✅ Install Git
2. ✅ Create GitHub account
3. ✅ Push code to GitHub
4. ✅ Deploy backend to Render
5. ✅ Set up Supabase database
6. ✅ Deploy frontend to Netlify
7. ✅ Test your live app!
8. ✅ Share with others!

Your app is now accessible from anywhere in the world! 🌍