# 🚀 Deploy Your Site NOW - Quick Guide

Follow these steps to launch your fishing app to the internet!

---

## ✅ **Step 1: Push to GitHub** (5 min)

### A. Create GitHub Repository

1. Go to: https://github.com/new
2. **Repository name:** `bignor-park-fishing`
3. **Visibility:** Public (required for free hosting)
4. **DON'T** check any boxes (no README, no .gitignore)
5. Click **"Create repository"**

### B. Push Your Code

In your terminal, run these commands (replace YOUR-USERNAME with your GitHub username):

```bash
git remote add origin https://github.com/YOUR-USERNAME/bignor-park-fishing.git
git branch -M main
git push -u origin main
```

If it asks for credentials, use your GitHub username and password (or personal access token).

---

## ✅ **Step 2: Deploy Backend API** (10 min)

### A. Sign up for Render

1. Go to: https://render.com
2. Click **"Get Started"**
3. **Sign up with GitHub** (easiest option)
4. Authorize Render to access your repositories

### B. Create Web Service

1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Click **"Connect account"** if needed
3. Find and select: **`bignor-park-fishing`**
4. Click **"Connect"**

### C. Configure Backend Service

Fill in these settings:

- **Name:** `bignor-park-api` (or whatever you want)
- **Region:** Choose closest to you (e.g., Frankfurt, Oregon)
- **Branch:** `main`
- **Root Directory:** `backend` ⚠️ IMPORTANT!
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Instance Type:** **Free**

### D. Add Environment Variables

Scroll down to **"Environment Variables"** section and add these:

```
DATABASE_URL = paste-your-neon-connection-string-here
JWT_SECRET = temporary-dev-secret-key-change-for-production
JWT_EXPIRES_IN = 7d
FISHING_CODE = 1187
NODE_ENV = production
FRONTEND_URL = https://bignor-park.onrender.com
```

⚠️ **IMPORTANT:** 
- Use your REAL Neon database URL for `DATABASE_URL`
- You can find it in your Neon dashboard

### E. Deploy!

1. Click **"Create Web Service"**
2. Wait 2-3 minutes while it deploys
3. You'll see: ✅ "Deploy succeeded"
4. Copy your API URL (looks like: `https://bignor-park-api.onrender.com`)

---

## ✅ **Step 3: Update API URL in Code** (2 min)

### A. Update api-client.js

Open `api-client.js` and find line 10:

```javascript
? 'https://bignor-park-api.onrender.com/api'  // PRODUCTION
```

**Replace** `bignor-park-api` with YOUR backend service name from Render.

For example, if your backend is at:
- `https://my-fishing-api.onrender.com`

Change line 10 to:
```javascript
? 'https://my-fishing-api.onrender.com/api'  // PRODUCTION
```

### B. Commit and Push

```bash
git add api-client.js
git commit -m "Update production API URL"
git push
```

---

## ✅ **Step 4: Deploy Frontend** (5 min)

### A. Create Static Site in Render

1. In Render dashboard, click **"New +"** → **"Static Site"**
2. Select: **`bignor-park-fishing`** (same repo)
3. Click **"Connect"**

### B. Configure Frontend

- **Name:** `bignor-park` (or whatever you want)
- **Branch:** `main`
- **Build Command:** (leave EMPTY)
- **Publish Directory:** `.` (just a dot)

### C. Deploy!

1. Click **"Create Static Site"**
2. Wait 1-2 minutes
3. You'll get a URL like: `https://bignor-park.onrender.com`

---

## ✅ **Step 5: Update CORS** (1 min)

Go back to your backend service in Render:

1. Click on your backend service (`bignor-park-api`)
2. Go to **"Environment"** tab
3. Find `FRONTEND_URL`
4. Update it to your actual frontend URL (e.g., `https://bignor-park.onrender.com`)
5. Click **"Save Changes"**
6. Service will redeploy automatically (takes 1 minute)

---

## 🎉 **Step 6: Test Your Live Site!**

1. **Open your frontend URL** (the one from Step 4)
2. **Try signing up** with fishing code: `1187`
3. **Try logging in** as admin:
   - Email: `ross-regencycarpets@hotmail.com`
   - Password: `Bignor4877`
   - Leave fishing code BLANK

If everything works - **YOU'RE LIVE!** 🚀

---

## 🐛 **Troubleshooting**

### "Cannot connect to backend"
- Check that backend deployed successfully (green checkmark in Render)
- Verify API URL in `api-client.js` line 10 matches your backend URL
- Check browser console for errors (F12)

### "Database connection failed"
- Verify `DATABASE_URL` in backend environment variables is correct
- Check it's your Neon pooled connection string
- Make sure Neon database is active

### "Login not working"
- Backend might still be deploying (wait 2-3 minutes)
- Check `FRONTEND_URL` in backend matches your frontend URL
- Clear browser cache and try again

### "500 Internal Server Error"
- Check backend logs in Render (click on service → "Logs" tab)
- Usually means database connection issue
- Verify environment variables are correct

---

## 📱 **Custom Domain (Optional)**

Want `fishing.yourdomain.com` instead of `.onrender.com`?

1. Buy a domain (Namecheap, Google Domains, etc.)
2. In Render, go to your frontend site
3. Click "Settings" → "Custom Domain"
4. Follow the instructions to add DNS records
5. Wait 10-60 minutes for DNS to propagate

---

## 💰 **Cost**

- **Everything is FREE!**
- Render free tier includes:
  - Backend: 750 hours/month (plenty!)
  - Frontend: Unlimited
  - SSL/HTTPS: Included
  
⚠️ **Note:** Free backend "spins down" after 15 minutes of inactivity. First request after inactivity takes 30-60 seconds to wake up.

**To keep it always on:** Upgrade to $7/month (optional)

---

## 🎯 **Quick Command Summary**

```bash
# Push to GitHub
git remote add origin https://github.com/YOUR-USERNAME/bignor-park-fishing.git
git branch -M main  
git push -u origin main

# After updating code
git add .
git commit -m "Your update message"
git push
```

---

## ✨ **You're Done!**

Your fishing app is now live on the internet! 

Share your URL with members and start taking bookings! 🎣

---

**Need help?** Check the error logs in Render or the browser console (F12).

