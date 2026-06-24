@echo off
echo ============================================
echo Pushing Catalogue Maker to GitHub
echo ============================================
echo.

echo Step 1: Initializing Git repository...
git init

echo.
echo Step 2: Adding all files...
git add .

echo.
echo Step 3: Committing files...
git commit -m "Initial commit - cloud database setup"

echo.
echo Step 4: Renaming branch to main...
git branch -M main

echo.
echo ============================================
echo IMPORTANT: Create a repository on GitHub first!
echo ============================================
echo.
echo 1. Go to: https://github.com/new
echo 2. Repository name: catalogue-maker
echo 3. Click "Create repository"
echo 4. Copy the repository URL
echo.
set /p repo_url="Paste your GitHub repository URL here: "

echo.
echo Step 5: Adding remote repository...
git remote add origin %repo_url%

echo.
echo Step 6: Pushing to GitHub...
git push -u origin main

echo.
echo ============================================
echo SUCCESS! Your code is now on GitHub!
echo ============================================
pause