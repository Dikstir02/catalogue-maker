# Quick Deployment Guide - Deploy to GitHub Pages

This guide will help you deploy your catalogue maker to GitHub Pages in 5 minutes.

## Step 1: Push Code to GitHub (2 minutes)

1. Go to https://github.com/new and create a repository named `catalogue-maker`
2. Open Git Bash or Command Prompt and run:

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

## Step 2: Enable GitHub Pages (1 minute)

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select **Deploy from a branch**
4. Under **Branch**, select **main** and folder **/ (root)**
5. Click **Save**

## Step 3: Access Your Live Site (2 minutes)

1. Wait 2-3 minutes for GitHub Pages to build
2. Your site will be available at: `https://YOUR_USERNAME.github.io/catalogue-maker/`
3. Login with:
   - **Username**: `dexter`
   - **Password**: `admin123`

## Important Notes

- **Data Storage**: Data is stored locally in your browser (localStorage)
- **No Backend**: This is a client-side only application
- **Free Hosting**: GitHub Pages is completely free
- **Static Site**: All functionality runs in the browser

## Troubleshooting

**Site not loading?**
- Wait 2-3 minutes after enabling GitHub Pages
- Check that all files were pushed to GitHub
- Verify GitHub Pages is enabled in Settings → Pages

**Data not saving?**
- Data is stored in browser localStorage
- Each browser/device has its own data
- Clearing browser cache will delete data

## Your Live Link

After deployment, your app will be at:
- **Frontend**: `https://YOUR_USERNAME.github.io/catalogue-maker/`

## Need Help?

If you get stuck:
1. Check browser console (F12) for errors
2. Verify all files are in your GitHub repository
3. Wait a few minutes for GitHub Pages to finish building