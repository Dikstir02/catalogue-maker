# Complete Deployment Guide - Deploy to GitHub Pages

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
3. Description: "Online catalogue maker"
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
git commit -m "Initial commit"

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

## Phase 2: Enable GitHub Pages

### Step 1: Configure GitHub Pages

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

### Step 2: Test Your Live Site

1. Open browser to your GitHub Pages URL
2. Login with:
   - **Username**: `dexter`
   - **Password**: `admin123`
3. Try creating/editing products
4. Data will be stored in your browser's localStorage

---

## Important Notes

### Data Storage
- This version uses browser localStorage for data storage
- Data is stored locally in each user's browser
- No backend server or database required
- Each browser/device has its own separate data

### GitHub Pages Limitations
- Static site hosting only
- No server-side code execution
- All functionality runs client-side in the browser
- Data is not shared between users

### Advantages
- Completely free hosting
- No backend maintenance required
- Fast and secure
- Easy to update (just push to GitHub)

---

## Testing Your Deployment

1. Visit your GitHub Pages URL
2. Login with: `dexter` / `admin123`
3. Test creating/editing products
4. Verify data persists after page refresh
5. Try exporting to Excel/PDF

---

## Maintenance

### Update Code
```bash
git add .
git commit -m "Update description"
git push
```

GitHub Pages will automatically rebuild and deploy!

### Backup Data
- Data is stored in browser localStorage
- To backup, use the export functionality in the app
- Export to Excel or PDF to save your data

---

## Troubleshooting

### Site not loading?
- Wait 2-3 minutes after enabling GitHub Pages
- Check that all files were pushed to GitHub
- Verify GitHub Pages is enabled in Settings → Pages
- Try clearing browser cache and reloading

### Data not saving?
- Data is stored in browser localStorage
- Check browser console (F12) for errors
- Ensure JavaScript is enabled
- Try a different browser

### Build errors?
- Check that all dependencies are in package.json
- Verify package-lock.json is committed
- Try running `npm install` locally first

---

## Next Steps

1. ✅ Install Git
2. ✅ Create GitHub account
3. ✅ Push code to GitHub
4. ✅ Enable GitHub Pages
5. ✅ Test your live app!
6. ✅ Share with others!

Your app is now accessible from anywhere in the world! 🌍

---

## Cost: $0/month

- GitHub: Free
- GitHub Pages: Free
- **Total: $0**