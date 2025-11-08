# Backend Server Startup Guide - CRITICAL

## 🚨 Why Your Bookings Weren't Working

### The Problem
Your booking page (`booking.html`) was loading `booking-standalone.js` which was still using **localStorage** instead of the API. That's why:
- ❌ Bookings weren't showing on admin dashboard
- ❌ Bookings weren't syncing across browsers (Chrome/Firefox)
- ❌ Bookings weren't showing on active booking page

### The Solution
✅ **I've now fixed `booking-standalone.js`** to use the API (just pushed to GitHub)

### BUT... You Need the Backend Server Running!

The API calls will **fail** if the backend server isn't running. Here's how to start it:

---

## 🚀 START BACKEND SERVER (Required!)

### Step 1: Open a New Terminal/Command Prompt

Navigate to your backend folder:
```bash
cd "D:\fishing app\backend"
```

### Step 2: Install Dependencies (First Time Only)

```bash
npm install
```

Expected output:
```
added 150 packages
```

### Step 3: Create .env File (First Time Only)

Create a file named `.env` in the **project root** (not in backend folder):

**Location:** `D:\fishing app\.env`

**Contents:**
```
DATABASE_URL=your-neon-postgresql-connection-string
NODE_ENV=development
JWT_SECRET=your-secure-random-string-here
PORT=3000
```

### Step 4: Start the Backend Server

```bash
npm start
```

Expected output:
```
🚀 ═══════════════════════════════════════════
   Bignor Park Fishing API Server
   ═══════════════════════════════════════════
   ✅ Server running on port 3000
   🌐 API: http://localhost:3000/api
   🏥 Health: http://localhost:3000/api/health
   📊 Database: Connected
   🔒 Environment: development
   ═══════════════════════════════════════════
```

**⚠️ KEEP THIS TERMINAL WINDOW OPEN!** The server must stay running while you use the app.

---

## ✅ Verify Backend is Working

### Test 1: Health Check

Open your browser and visit:
```
http://localhost:3000/api/health
```

Should show:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-08T...",
  "database": "connected",
  "uptime": 10.5
}
```

### Test 2: Check Browser Console

1. Open your booking page in Chrome
2. Press F12 (open Developer Tools)
3. Go to "Console" tab
4. Look for:
```
✅ Bignor Park API Client initialized
📡 API Base URL: http://localhost:3000/api
```

---

## 🧪 Now Test Cross-Browser Sync

### Test Scenario

**Step 1: Chrome**
1. Open `http://localhost:8000/booking.html`
2. Login as a user
3. Select a date and lake
4. Click "Confirm Booking"
5. ✅ You should see success message

**Step 2: Check Console (Chrome)**
Press F12 and check console for:
```
[Booking] Creating booking via API...
[Booking] Booking created successfully via API: {...}
[Booking] Loaded 1 bookings from API
```

**Step 3: Firefox**
1. Open `http://localhost:8000/admin/dashboard.html`
2. Login as admin
3. ✅ You should see the booking from Chrome!

**Step 4: Cross-Browser Verification**
The booking should now appear in:
- ✅ Chrome user's "Active Booking" tab
- ✅ Firefox admin dashboard
- ✅ Admin calendar page
- ✅ Any other browser you open

---

## 🔧 Troubleshooting

### Error: "Unable to connect to server"

**Cause:** Backend server is not running  
**Solution:**
```bash
cd "D:\fishing app\backend"
npm start
```

### Error: "Cannot find module 'express'"

**Cause:** Dependencies not installed  
**Solution:**
```bash
cd "D:\fishing app\backend"
npm install
```

### Error: "Database connection failed"

**Cause:** DATABASE_URL not configured  
**Solution:**
1. Check if `.env` file exists in project root
2. Verify DATABASE_URL is correct
3. Make sure your Neon database is active

### Backend Starts But Bookings Still Don't Work

**Check Console for Errors:**
1. Open browser console (F12)
2. Try to create a booking
3. Look for red error messages
4. Common issues:
   - "401 Unauthorized" → Need to login again
   - "404 Not Found" → Backend URL is wrong
   - "Network error" → Backend not running

---

## 📋 Database Setup (If Not Done Yet)

### Option 1: Using Neon (Recommended)

1. Go to https://console.neon.tech
2. Create a new project
3. Copy the connection string
4. Add to `.env` as `DATABASE_URL`

### Option 2: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database: `createdb bignor_fishing`
3. Run schema: `psql bignor_fishing < schema.sql`
4. Update `.env` with local connection string

---

## 🎯 Quick Start Checklist

Before using the app, make sure:

- [ ] ✅ Backend dependencies installed (`npm install` in backend folder)
- [ ] ✅ `.env` file created with DATABASE_URL
- [ ] ✅ Backend server running (`npm start` in backend folder)
- [ ] ✅ Terminal shows "✅ Server running on port 3000"
- [ ] ✅ Health check works: http://localhost:3000/api/health
- [ ] ✅ Frontend server running (Python: `python server.py`)
- [ ] ✅ Browser console shows "API Client initialized"

---

## 🔄 Development Workflow

### Every Day Before Working:

1. **Start Backend Server:**
   ```bash
   cd "D:\fishing app\backend"
   npm start
   ```
   (Keep this terminal open)

2. **Start Frontend Server:**
   ```bash
   cd "D:\fishing app"
   python server.py
   ```
   (Keep this terminal open too)

3. **Open Browser:**
   - Go to http://localhost:8000/booking.html
   - Check console for API initialization message

### When You're Done:

1. Press `Ctrl+C` in backend terminal to stop backend
2. Press `Ctrl+C` in frontend terminal to stop frontend
3. Close terminals

---

## 📝 Environment Variables Explained

```env
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
# Your Neon PostgreSQL connection string

NODE_ENV=development
# Set to 'production' when deploying to Render

JWT_SECRET=generate-a-very-long-random-string-here
# Used for authentication tokens (make it unique!)

PORT=3000
# Backend server port (don't change unless necessary)
```

---

## 🚀 Production Deployment (Render)

Once backend is running locally and working:

1. **Push to GitHub** (already done!)
   ```bash
   git push origin main
   ```

2. **Deploy to Render:**
   - Go to https://dashboard.render.com
   - Create new "Web Service"
   - Connect to your GitHub repo
   - Select `backend` folder
   - Add environment variables in Render dashboard
   - Click "Deploy"

3. **Update Frontend:**
   - Your frontend already auto-detects if it's on Render
   - No changes needed!

---

## ✅ Success Indicators

You'll know everything is working when:

1. **Backend Terminal Shows:**
   ```
   ✅ Server running on port 3000
   📊 Database: Connected
   ```

2. **Browser Console Shows:**
   ```
   ✅ Bignor Park API Client initialized
   📡 API Base URL: http://localhost:3000/api
   ```

3. **When You Create a Booking:**
   ```
   [Booking] Creating booking via API...
   [Booking] Booking created successfully via API
   [Booking] Loaded 1 bookings from API
   ```

4. **Booking Appears:**
   - ✅ In your active bookings tab
   - ✅ In admin dashboard
   - ✅ In other browsers immediately!

---

## 🆘 Still Having Issues?

### Check These in Order:

1. **Backend logs** - Look for errors in the backend terminal
2. **Browser console** - Press F12, check for red errors
3. **Network tab** - In DevTools, check if API calls are being made
4. **Database connection** - Verify Neon database is active

### Common Fixes:

**Issue:** "Booking created but not showing"
- Refresh the page (F5)
- Check if backend is still running
- Verify API calls are successful in Network tab

**Issue:** "API client not available"
- Make sure `api-client.js` is loaded before `booking-standalone.js`
- Check browser console for script loading errors

**Issue:** "Cross-browser sync not working"
- Both browsers must use same backend (localhost:3000)
- Make sure both browsers are on localhost:8000 (not file://)
- Check if CORS is enabled in backend (already configured)

---

## 📞 Need Help?

If you're still stuck:
1. Share backend terminal output
2. Share browser console errors (F12 → Console)
3. Check if health check works: http://localhost:3000/api/health

**Your bookings WILL sync across browsers once the backend is running!** 🎉

