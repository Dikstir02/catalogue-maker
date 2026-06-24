# Catalogue Maker - Online Database Setup

Your catalogue maker app is now ready to be deployed online with a cloud database!

## 🚀 Quick Start (3 Steps to Go Live)

### Step 1: Install Git
Download from: https://git-scm.com/download/win
- Run installer with default settings
- Restart your computer

### Step 2: Push to GitHub
```bash
# Open Git Bash or Command Prompt and run:

cd c:/Users/Dexter/Desktop/catalogue-maker

git init
git add .
git commit -m "Initial commit - cloud database setup"
git branch -M main

# Create repo at github.com/new, then:
git remote add origin https://github.com/YOUR_USERNAME/catalogue-maker.git
git push -u origin main
```

### Step 3: Deploy Backend to Render
1. Go to https://render.com and sign up with GitHub
2. Click **New** → **Web Service**
3. Connect your `catalogue-maker-backend` repo (create it first on GitHub)
4. Configure:
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Plan: Free
5. Click **Create Web Service**
6. Copy your API URL (e.g., `https://catalogue-maker-api.onrender.com`)

### Step 4: Deploy Frontend to Netlify
1. Update `.env` with your Render URL:
   ```
   VITE_API_URL=https://catalogue-maker-api.onrender.com/api
   ```
2. Build: `npm run build`
3. Go to https://app.netlify.com/drop
4. Drag the `dist` folder into the browser
5. Your app is live! 🎉

## 📚 Detailed Guides

- **SETUP_INSTRUCTIONS.md** - Quick local testing guide
- **DEPLOYMENT.md** - 5 different deployment options
- **COMPLETE_DEPLOYMENT_GUIDE.md** - Step-by-step with Supabase for permanent database

## 🔐 Default Login

- Username: `dexter`
- Password: `admin123`

## 💡 What You Get

- ✅ Cloud database (accessible from anywhere)
- ✅ REST API backend
- ✅ Modern React frontend
- ✅ File upload support
- ✅ User authentication
- ✅ Free hosting (Render + Netlify)
- ✅ $0/month cost

## 🛠️ Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: SQLite (local) / Supabase PostgreSQL (cloud)
- **Hosting**: Render (backend) + Netlify (frontend)

## 📝 Project Structure

```
catalogue-maker/
├── backend/              # API server
│   ├── server.js        # Express server
│   └── package.json     # Backend dependencies
├── src/
│   └── lib/
│       ├── api-client.js    # API communication
│       └── data-store.js    # Data management
├── .env                 # API configuration
└── package.json         # Frontend dependencies
```

## 🆘 Need Help?

1. Read **COMPLETE_DEPLOYMENT_GUIDE.md** for detailed instructions
2. Check browser console (F12) for errors
3. Verify API URL in `.env` is correct
4. Test backend: `https://your-api.onrender.com/api/health`

## 🎯 Next Steps

1. Install Git
2. Push code to GitHub
3. Deploy backend to Render
4. Deploy frontend to Netlify
5. Share your app with the world!

Your catalogue maker is now ready to go live! 🌍