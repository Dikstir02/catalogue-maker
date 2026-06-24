# Deployment Guide - Online Database Setup

This guide will help you deploy your catalogue maker app with a cloud database so you can access it from anywhere.

## Option 1: Deploy Backend to Render.com (Recommended - Free Tier Available)

### Step 1: Prepare Your Backend

1. Create a new repository on GitHub with your backend code:
   - Upload the `backend/` folder contents
   - Include: `package.json`, `server.js`

2. Create a `render.yaml` file in the backend folder:

```yaml
services:
  - type: web
    name: catalogue-maker-api
    env: node
    plan: free
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
```

### Step 2: Deploy to Render

1. Go to [Render.com](https://render.com) and sign up
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Select the backend repository
5. Render will auto-detect the configuration
6. Click "Create Web Service"
7. Wait for deployment to complete (2-3 minutes)
8. Your API will be available at: `https://your-app-name.onrender.com`

### Step 3: Update Frontend Configuration

1. Update your `.env` file in the root folder:

```env
VITE_API_URL=https://your-app-name.onrender.com/api
```

2. Rebuild your frontend:

```bash
npm run build
```

## Option 2: Deploy Backend to Railway.app (Free Tier Available)

### Step 1: Prepare Your Backend

1. Create a `railway.toml` file in the backend folder:

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "node server.js"
healthcheckPath = "/api/health"
healthcheckTimeout = 100
restartPolicyType = "on_failure"
```

### Step 2: Deploy to Railway

1. Go to [Railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your backend repository
4. Railway will automatically deploy
5. Your API will be available at: `https://your-app-name.up.railway.app`

### Step 3: Update Frontend

Same as Option 1, update `.env` with your Railway URL.

## Option 3: Deploy to Vercel with Serverless Functions

### Step 1: Convert Backend to Serverless

Create `backend/api/index.js`:

```javascript
import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Use /tmp directory for serverless (ephemeral storage)
const db = new Database(join(__dirname, '..', 'catalogue.db'));

// ... (copy all your routes from server.js)

export default app;
```

### Step 2: Deploy

1. Install Vercel CLI: `npm install -g vercel`
2. Run: `vercel --prod`
3. Follow the prompts

## Option 4: Use Supabase (PostgreSQL Database + Auto-generated API)

If you want a more robust cloud database:

### Step 1: Set Up Supabase

1. Go to [Supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to SQL Editor and run these commands:

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
```

4. Get your API credentials from Settings → API

### Step 2: Update Backend

Modify `backend/server.js` to use Supabase client instead of SQLite:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Replace all db.prepare() calls with supabase queries
```

### Step 3: Deploy Backend

Deploy the modified backend to Render/Railway with Supabase credentials as environment variables.

## Option 5: Quick Local Network Access (For Testing)

If you just want to access from other devices on your network:

### Step 1: Start Backend

```bash
cd backend
npm install
npm start
```

### Step 2: Find Your Local IP

On Windows:
```bash
ipconfig
```

Look for your IPv4 Address (e.g., 192.168.1.100)

### Step 3: Update Frontend

Update `.env`:
```env
VITE_API_URL=http://192.168.1.100:3001/api
```

### Step 4: Start Frontend

```bash
npm run dev
```

Now you can access the app from any device on your WiFi network using your computer's IP address.

## Recommended Approach

**For production use:** Use **Option 1 (Render.com)** or **Option 2 (Railway.app)** - both offer free tiers and are easy to set up.

**For testing/development:** Use **Option 5 (Local Network)** to test before deploying.

## Important Notes

1. **Database Persistence**: 
   - Render/Railway free tiers use ephemeral storage - data resets on redeployment
   - For permanent data, use Supabase (Option 4) or upgrade to paid tier

2. **File Uploads**:
   - Current implementation stores images as base64 in database
   - For production, consider using Cloudinary or AWS S3 for file storage

3. **Security**:
   - Current auth uses simple token validation
   - For production, implement proper JWT authentication
   - Add rate limiting and input validation

4. **Environment Variables**:
   - Never commit `.env` file to git
   - Use platform-specific environment variable settings

## Testing Your Deployment

1. Start backend locally: `cd backend && npm start`
2. Start frontend: `npm run dev`
3. Open browser to `http://localhost:5173`
4. Login with: `dexter` / `admin123`
5. Test creating/editing products
6. Verify data persists after page refresh

## Need Help?

If you encounter issues:
1. Check backend logs in Render/Railway dashboard
2. Verify API URL is correct in `.env`
3. Ensure CORS is properly configured
4. Check browser console for errors