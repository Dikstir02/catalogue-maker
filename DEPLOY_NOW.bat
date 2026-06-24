@echo off
chcp 65001 >nul
echo.
echo ============================================
echo   CATALOGUE MAKER - AUTO DEPLOYMENT
echo ============================================
echo.
echo This script will guide you through deployment.
echo You will need to:
echo   1. Create a GitHub account (free)
echo   2. Create accounts on Render and Netlify (free)
echo   3. Copy/paste some URLs
echo.
pause
echo.
echo Step 1: Create GitHub Repository
echo --------------------------------------------
echo.
echo 1. Opening GitHub in your browser...
start https://github.com/new
echo.
echo 2. Create a repository named: catalogue-maker
echo 3. Keep this window open and switch to browser
echo.
pause
echo.
echo Step 2: Initialize Git and Push
echo --------------------------------------------
echo.
echo Initializing git repository...
git init
git add .
git commit -m "Initial commit - cloud database setup"
git branch -M main
echo.
echo Files committed successfully!
echo.
echo Now you need to:
echo 1. Copy the GitHub repository URL from your browser
echo    (Example: https://github.com/yourname/catalogue-maker.git)
echo 2. Paste it below
echo.
set /p repo_url="GitHub Repository URL: "
echo.
echo Adding remote and pushing...
git remote add origin %repo_url%
git push -u origin main
echo.
echo ============================================
echo   SUCCESS! Code pushed to GitHub!
echo ============================================
echo.
echo Next steps:
echo 1. Create a NEW repo: catalogue-maker-backend
echo 2. Copy backend folder contents to new folder
echo 3. Push to catalogue-maker-backend
echo 4. Deploy on Render.com
echo.
echo See COMPLETE_DEPLOYMENT_GUIDE.md for details.
echo.
pause