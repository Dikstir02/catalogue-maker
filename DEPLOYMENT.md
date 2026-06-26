# Deployment Guide - GitHub Pages

This guide will help you deploy your catalogue maker app to GitHub Pages.

## Deploy to GitHub Pages

### Step 1: Push Code to GitHub

1. Create a new repository on GitHub at https://github.com/new
2. Name it: `catalogue-maker`
3. Keep it public or private (your choice)
4. Do NOT check "Add a README file"
5. Click "Create repository"

6. Open Git Bash or Command Prompt and run:

```bash
cd c:/Users/Dexter/Desktop/catalogue-maker

git init
git add .
git commit -m "Initial commit"
git branch -M main

# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/catalogue-maker.git
git push -u origin main
```

### Step 2: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** (top menu)
3. Click **Pages** (left sidebar)
4. Under **Build and deployment** → **Source**:
   - Select **Deploy from a branch**
5. Under **Branch**:
   - Select **main**
   - Select folder **/ (root)**
6. Click **Save**
7. Wait 2-3 minutes for deployment
8. Your site will be available at: `https://YOUR_USERNAME.github.io/catalogue-maker/`

## Local Development

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

## Important Notes

1. **Data Storage**: 
   - This version uses local storage (browser localStorage/SQLite)
   - Data is stored locally in the browser
   - Each user has their own local data

2. **No Backend Required**:
   - This is a client-side only application
   - No server or database setup needed
   - Works entirely in the browser

3. **GitHub Pages Limitations**:
   - Static site hosting only
   - No server-side code execution
   - All data is client-side

## Testing Your Deployment

1. Visit your GitHub Pages URL
2. Login with: `dexter` / `admin123`
3. Try creating/editing products
4. Data will be stored in your browser

## Need Help?

If you encounter issues:
1. Check browser console (F12) for errors
2. Verify GitHub Pages is enabled in repository settings
3. Ensure all files were pushed to GitHub
4. Wait a few minutes for GitHub Pages to build