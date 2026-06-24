# Quick Deployment Guide - Get Live Site in 10 Minutes

This guide will deploy your catalogue maker with a **free online database** using:
- **Supabase** (free PostgreSQL database)
- **Render.com** (free backend hosting)
- **Vercel** (free frontend hosting)

## Step 1: Set Up Supabase Database (3 minutes)

1. Go to [supabase.com](https://supabase.com) and sign up with GitHub
2. Click "New Project"
3. Fill in:
   - **Name**: catalogue-maker
   - **Database Password**: (save this!)
   - **Region**: Choose closest to you
   - **Plan**: Free
4. Click "Create new project" and wait 2 minutes

5. Once created, go to **Project Settings** (gear icon) → **API**
6. Copy these two values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

7. Go to **SQL Editor** and run the SQL from `backend/supabase-setup.sql`:
   - Click "New query"
   - Copy all SQL from `backend/supabase-setup.sql`
   - Paste and click "Run"
   - You should see "Success. No rows returned"

## Step 2: Deploy Backend to Render.com (3 minutes)

1. Go to [render.com](https://render.com) and sign up with GitHub
2. Click "New" → "Web Service"
3. Connect your GitHub account and select the `catalogue-maker` repository
4. Fill in:
   - **Name**: catalogue-maker-api
   - **Region**: Same as Supabase
   - **Branch**: master
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server-supabase.js`
   - **Plan**: Free

5. Scroll down to **Environment Variables** and add:
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
   - `SUPABASE_URL` = (your Supabase Project URL from Step 1)
   - `SUPABASE_ANON_KEY` = (your Supabase anon key from Step 1)

6. Click "Create Web Service"
7. Wait 3-5 minutes for deployment
8. Your backend URL will be: `https://catalogue-maker-api.onrender.com`

## Step 3: Deploy Frontend to Vercel (2 minutes)

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click "Add New" → "Project"
3. Import your `catalogue-maker` repository
4. Vercel will auto-detect Vite settings
5. Add environment variable:
   - `VITE_API_URL` = `https://catalogue-maker-api.onrender.com/api`
6. Click "Deploy"
7. Wait 2 minutes
8. Your live site will be: `https://catalogue-maker.vercel.app` (or similar)

## Step 4: Test Your Live Site

1. Open your Vercel URL
2. Login with:
   - **Username**: `dexter`
   - **Password**: `admin123`
3. Try creating/editing products
4. Data is now stored in Supabase cloud database!

## Important Notes

- **Free Tier Limits**:
  - Supabase: 500MB database, 2GB bandwidth/month
  - Render: 750 hours/month, sleeps after 15min inactivity
  - Vercel: 100GB bandwidth/month

- **Database is Persistent**: Unlike Render's free tier, Supabase free tier keeps your data forever

- **First Load**: Render free tier sleeps after inactivity, so first load takes ~30 seconds

## Troubleshooting

**Backend not working?**
- Check Render logs for errors
- Verify SUPABASE_URL and SUPABASE_ANON_KEY are correct
- Make sure you ran the SQL in Supabase SQL Editor

**Frontend can't connect?**
- Check VITE_API_URL matches your Render URL
- Open browser console (F12) to see errors
- Make sure backend is running (visit `https://your-backend.onrender.com/api/health`)

**Data not saving?**
- Verify Supabase tables were created (check Supabase dashboard → Table Editor)
- Check backend logs in Render

## Your Live Links

After deployment, you'll have:
- **Frontend**: `https://catalogue-maker.vercel.app`
- **Backend API**: `https://catalogue-maker-api.onrender.com`
- **Database**: Supabase cloud PostgreSQL

## Need Help?

If you get stuck:
1. Check the deployment logs in Render/Vercel dashboards
2. Verify all environment variables are set correctly
3. Make sure Supabase SQL was executed successfully