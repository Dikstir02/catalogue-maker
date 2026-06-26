# Catalogue Maker - GitHub Pages Deployment

Your catalogue maker app is ready to be deployed on GitHub Pages!

## 🚀 Quick Start (Deploy to GitHub Pages)

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
git commit -m "Initial commit"
git branch -M main

# Create repo at github.com/new, then:
git remote add origin https://github.com/YOUR_USERNAME/catalogue-maker.git
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select **Deploy from a branch**
4. Under **Branch**, select **main** and folder **/ (root)**
5. Click **Save**
6. Wait 2-3 minutes for deployment
7. Your site will be available at: `https://YOUR_USERNAME.github.io/catalogue-maker/`

## 📚 Local Development

### Running the App Locally

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open browser to: `http://localhost:5173`

### Default Login
- Username: `dexter`
- Password: `admin123`

## 💡 Features

- ✅ Modern React frontend with Vite
- ✅ Local data storage (SQLite)
- ✅ User authentication
- ✅ Product management
- ✅ Export to Excel/PDF
- ✅ Responsive design with Tailwind CSS
- ✅ Drag and drop interface

## 🛠️ Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: None (client-side only for GitHub Pages)
- **Database**: Browser localStorage/SQLite (local)
- **Hosting**: GitHub Pages (free)

## 📝 Project Structure

```
catalogue-maker/
├── src/
│   ├── components/       # React components
│   ├── pages/           # Page components
│   ├── lib/             # Utilities and data store
│   └── main.jsx         # Entry point
├── index.html
├── package.json
└── vite.config.js
```

## 🆘 Need Help?

1. Check the browser console (F12) for errors
2. Ensure all dependencies are installed: `npm install`
3. Try clearing browser cache and reloading

## 🎯 Next Steps

1. Install Git
2. Push code to GitHub
3. Enable GitHub Pages in repository settings
4. Share your app with the world!

Your catalogue maker is now ready to go live on GitHub Pages! 🌍