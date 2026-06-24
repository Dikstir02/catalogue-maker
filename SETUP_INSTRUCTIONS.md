# Quick Setup Instructions

## Step 1: Install Backend Dependencies

Open a new terminal (important - use a fresh terminal window) and run:

```bash
cd backend
npm install
```

If npm is still not recognized, try:
```bash
# Close and reopen your terminal/VS Code, then run:
cd backend
npm install
```

## Step 2: Start the Backend Server

In the same terminal:
```bash
cd backend
npm start
```

You should see: `Server running on http://localhost:3001`

Keep this terminal running!

## Step 3: Start the Frontend

Open a **second** terminal window and run:
```bash
npm run dev
```

You should see: `Local: http://localhost:5173/`

## Step 4: Access Your App

1. Open browser to `http://localhost:5173`
2. Login with: `dexter` / `admin123`
3. Start using your app with cloud database!

## Step 5: Test the Database

1. Create a new product in the app
2. Stop the frontend (Ctrl+C)
3. Restart the frontend: `npm run dev`
4. Your product should still be there (stored in cloud database)

## Troubleshooting

### If npm is not recognized:
1. Close ALL terminal windows
2. Close VS Code completely
3. Reopen VS Code
4. Try the commands again

### If port 3001 is already in use:
Edit `backend/server.js` line 12:
```javascript
const PORT = process.env.PORT || 3002;  // Change to 3002 or another port
```

### If you get database errors:
The SQLite database file `catalogue.db` will be created automatically in the backend folder on first run.

## What's Next?

Once local testing works, deploy to cloud:

1. **For permanent cloud database**: Follow "Option 4: Supabase" in DEPLOYMENT.md
2. **For quick online access**: Follow "Option 1: Render.com" in DEPLOYMENT.md
3. **For local network access**: Follow "Option 5" in DEPLOYMENT.md

## File Structure

```
catalogue-maker/
├── backend/
│   ├── package.json          # Backend dependencies
│   ├── server.js             # API server
│   └── catalogue.db          # SQLite database (created on first run)
├── src/
│   └── lib/
│       ├── api-client.js     # API communication
│       └── data-store.js     # Data management
├── .env                      # API configuration
├── package.json              # Frontend dependencies
└── DEPLOYMENT.md             # Full deployment guide
```

## Need Help?

If you encounter issues:
1. Make sure you're using a fresh terminal (close and reopen)
2. Check that both servers are running
3. Verify the API URL in `.env` matches your backend port
4. Check browser console (F12) for errors