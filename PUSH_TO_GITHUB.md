# Push Your Code to GitHub

## Quick Method (Use the Script)

I've created `push-to-github.bat` in your project folder. Here's how to use it:

### Step 1: Create GitHub Repository

1. Open browser to: https://github.com/new
2. Repository name: `catalogue-maker`
3. Description: "Online catalogue maker"
4. Select: **Public** (or Private)
5. **DO NOT** check "Add a README file"
6. Click **Create repository**

### Step 2: Run the Script

1. Go to your project folder: `c:\Users\Dexter\Desktop\catalogue-maker`
2. Double-click `push-to-github.bat`
3. It will ask for your GitHub repository URL
4. Paste the URL (e.g., `https://github.com/yourusername/catalogue-maker.git`)
5. Press Enter
6. Wait for it to complete

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select **Deploy from a branch**
4. Under **Branch**, select **main** and folder **/ (root)**
5. Click **Save**
6. Wait 2-3 minutes for deployment

### Step 4: Access Your Site

Your site will be available at: `https://YOUR_USERNAME.github.io/catalogue-maker/`

Login with:
- Username: `dexter`
- Password: `admin123`

---

## Manual Method (If Script Doesn't Work)

### Step 1: Open Git Bash

1. Right-click in your project folder
2. Select "Git Bash Here"

### Step 2: Run These Commands

```bash
# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Rename branch
git branch -M main

# Add your GitHub repo (replace with your URL)
git remote add origin https://github.com/YOUR_USERNAME/catalogue-maker.git

# Push to GitHub
git push -u origin main
```

### Step 3: Enter GitHub Credentials

When prompted:
- Username: Your GitHub username
- Password: Use a Personal Access Token (not your GitHub password)

**To create a Personal Access Token:**
1. Go to GitHub → Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. Generate new token
4. Select scopes: `repo`
5. Copy the token and use it as password

---

## After Pushing to GitHub

### Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select **Deploy from a branch**
4. Under **Branch**, select **main** and folder **/ (root)**
5. Click **Save**
6. Wait 2-3 minutes for deployment

### Access Your Live Site

Your site will be at: `https://YOUR_USERNAME.github.io/catalogue-maker/`

---

## Troubleshooting

### "git is not recognized"
- Close and reopen Git Bash/Command Prompt
- Or restart your computer

### "Permission denied"
- Use Personal Access Token instead of password
- Or configure SSH keys

### "Repository not found"
- Check the URL is correct
- Make sure you created the repo on GitHub
- Verify you have access to the repo

### Site not loading?
- Wait 2-3 minutes after enabling GitHub Pages
- Check that all files were pushed to GitHub
- Verify GitHub Pages is enabled in Settings → Pages

---

## Your Files Are Ready!

All the code is in place:
- ✅ React frontend with Vite
- ✅ Local data storage
- ✅ User authentication
- ✅ Product management
- ✅ Export functionality
- ✅ .gitignore (protects sensitive files)

Just run the script or follow the manual steps above!