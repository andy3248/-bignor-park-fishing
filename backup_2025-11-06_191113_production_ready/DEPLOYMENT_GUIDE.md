# 🚀 Deployment Guide - Bignor Park Fishing App

Complete guide to deploying your fishing app to production.

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- [x] Backend API complete and tested locally
- [x] Database schema deployed to Neon
- [x] Admin user created in database
- [x] All environment variables documented
- [ ] Frontend updated to use API
- [ ] Chosen hosting provider
- [ ] Domain name (optional but recommended)

---

## Option 1: Render.com (Recommended) ⭐

**Why Render?**
- Free tier available
- Easy setup
- Automatic deployments from GitHub
- Built-in HTTPS
- Great for Node.js apps

### Step 1: Prepare Your Repository

1. **Create a `.gitignore` file** (already done)
   - Ensures `.env` files aren't committed

2. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Backend complete"
   git branch -M main
   git remote add origin https://github.com/yourusername/bignor-park.git
   git push -u origin main
   ```

### Step 2: Deploy Backend to Render

1. **Sign up at Render.com:**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create New Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Name: `bignor-park-api`
   - Region: Choose closest to your users
   - Branch: `main`
   - Root Directory: `backend`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Add Environment Variables:**
   Click "Environment" and add:
   ```
   DATABASE_URL=your_neon_connection_string
   JWT_SECRET=your_generated_secret
   JWT_EXPIRES_IN=7d
   FISHING_CODE=1187
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-url.com
   ```

4. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment (2-3 minutes)
   - Your API will be at: `https://bignor-park-api.onrender.com`

### Step 3: Deploy Frontend to Render

1. **Create New Static Site:**
   - Click "New +" → "Static Site"
   - Connect same GitHub repository
   - Name: `bignor-park`
   - Branch: `main`
   - Build Command: (leave empty)
   - Publish Directory: `.` (root)

2. **Update API URL:**
   Before deploying, update `api-client.js`:
   ```javascript
   const API_CONFIG = {
       baseURL: 'https://bignor-park-api.onrender.com/api',
       timeout: 10000
   };
   ```

3. **Deploy:**
   - Click "Create Static Site"
   - Your frontend will be at: `https://bignor-park.onrender.com`

### Step 4: Update CORS

Go back to your backend environment variables and update:
```
FRONTEND_URL=https://bignor-park.onrender.com
```

### Step 5: Test Everything

1. Visit your frontend URL
2. Try signing up
3. Try logging in
4. Create a booking
5. Test admin login

---

## Option 2: Railway.app

**Why Railway?**
- $5/month credit free
- Simple deployment
- Good for databases + backend together
- Automatic HTTPS

### Backend Deployment

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login:**
   ```bash
   railway login
   ```

3. **Initialize Project:**
   ```bash
   cd backend
   railway init
   ```

4. **Add Environment Variables:**
   ```bash
   railway variables set DATABASE_URL="your_connection_string"
   railway variables set JWT_SECRET="your_secret"
   railway variables set FISHING_CODE="1187"
   railway variables set NODE_ENV="production"
   ```

5. **Deploy:**
   ```bash
   railway up
   ```

6. **Get URL:**
   ```bash
   railway domain
   ```

### Frontend Deployment

Use Netlify or Vercel for frontend (see below).

---

## Option 3: Vercel (Frontend) + Render (Backend)

### Backend on Render
Follow Option 1 steps for backend.

### Frontend on Vercel

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Configure:**
   - Framework Preset: Other
   - Build Command: (none)
   - Output Directory: `.`
   - Install Command: (none)

4. **Update API URL** in `api-client.js` to your Render backend URL

5. **Environment Variables:**
   If needed, add via Vercel dashboard

---

## Option 4: VPS (DigitalOcean, Linode, AWS)

For more control and potentially lower cost at scale.

### Step 1: Set Up Server

1. **Create a Droplet/Instance:**
   - Ubuntu 22.04 LTS
   - 1GB RAM minimum
   - Choose region closest to users

2. **SSH into server:**
   ```bash
   ssh root@your_server_ip
   ```

3. **Update system:**
   ```bash
   apt update && apt upgrade -y
   ```

4. **Install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
   apt install -y nodejs
   ```

5. **Install PM2 (process manager):**
   ```bash
   npm install -g pm2
   ```

6. **Install Nginx:**
   ```bash
   apt install -y nginx
   ```

### Step 2: Deploy Backend

1. **Clone your repository:**
   ```bash
   cd /var/www
   git clone https://github.com/yourusername/bignor-park.git
   cd bignor-park/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create .env file:**
   ```bash
   nano .env
   ```
   Add all your environment variables.

4. **Start with PM2:**
   ```bash
   pm2 start server.js --name bignor-api
   pm2 save
   pm2 startup
   ```

### Step 3: Configure Nginx

1. **Create Nginx config:**
   ```bash
   nano /etc/nginx/sites-available/bignor-park
   ```

2. **Add configuration:**
   ```nginx
   # Backend API
   server {
       listen 80;
       server_name api.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   
   # Frontend
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       root /var/www/bignor-park;
       index index.html;
       
       location / {
           try_files $uri $uri/ =404;
       }
   }
   ```

3. **Enable site:**
   ```bash
   ln -s /etc/nginx/sites-available/bignor-park /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   ```

### Step 4: Add SSL (HTTPS)

1. **Install Certbot:**
   ```bash
   apt install -y certbot python3-certbot-nginx
   ```

2. **Get SSL certificate:**
   ```bash
   certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
   ```

3. **Auto-renewal:**
   ```bash
   certbot renew --dry-run
   ```

---

## 🔒 Security Checklist

Before going live:

### Environment Variables
- [ ] JWT_SECRET is a strong random string (32+ characters)
- [ ] DATABASE_URL doesn't contain default passwords
- [ ] FISHING_CODE is not easily guessable
- [ ] No sensitive data in code or git history

### Database
- [ ] Database password is strong
- [ ] SSL is enabled for database connections
- [ ] Regular backups are configured
- [ ] Only necessary ports are open

### Server
- [ ] UFW firewall is enabled (if using VPS)
- [ ] SSH key authentication (disable password auth)
- [ ] Regular security updates enabled
- [ ] Fail2ban installed (if using VPS)

### Application
- [ ] Rate limiting is enabled
- [ ] CORS is configured for your domain only
- [ ] Helmet.js security headers are enabled
- [ ] Input validation on all endpoints
- [ ] Proper error messages (don't leak sensitive info)

---

## 📊 Monitoring & Maintenance

### Free Monitoring Tools

1. **UptimeRobot** (https://uptimerobot.com)
   - Monitor if your site is up
   - Free for 50 monitors
   - Email alerts

2. **Sentry** (https://sentry.io)
   - Error tracking
   - Free tier available
   - Integrates with Node.js

3. **LogRocket** (https://logrocket.com)
   - Frontend error tracking
   - Session replay
   - Free tier available

### Setting Up Monitoring

1. **Health Check Endpoint:**
   Already available at `/api/health`
   
2. **Add to UptimeRobot:**
   - URL: `https://your-api.com/api/health`
   - Interval: 5 minutes
   - Alert: Email when down

3. **PM2 Monitoring (if using VPS):**
   ```bash
   pm2 install pm2-logrotate
   pm2 set pm2-logrotate:max_size 10M
   pm2 set pm2-logrotate:retain 7
   ```

### Database Maintenance

**Neon automatically handles:**
- Backups
- Updates
- Scaling
- Monitoring

**Manual tasks:**
1. **Expire old bookings** (run weekly):
   ```bash
   curl -X POST https://your-api.com/api/admin/expire-bookings \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```

2. **Check booking stats** (monitor usage):
   ```bash
   curl https://your-api.com/api/admin/bookings/stats \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```

---

## 🔄 Updating Your App

### Using Render/Vercel/Railway
Just push to GitHub:
```bash
git add .
git commit -m "Update description"
git push
```
Auto-deploys in 1-2 minutes!

### Using VPS
```bash
ssh root@your_server_ip
cd /var/www/bignor-park
git pull
cd backend
npm install
pm2 restart bignor-api
```

---

## 🐛 Common Issues

### "Database connection failed"
- Check DATABASE_URL is correct
- Verify Neon project is active
- Check IP allowlist (Neon allows all by default)

### "CORS error"
- Update FRONTEND_URL in backend env vars
- Make sure it matches your actual frontend URL
- No trailing slash in URL

### "502 Bad Gateway" (Nginx)
- Backend isn't running: `pm2 status`
- Wrong port in Nginx config
- Check logs: `pm2 logs bignor-api`

### "Module not found"
- Run `npm install` in backend directory
- Check node_modules exists
- Restart: `pm2 restart bignor-api`

---

## 💰 Cost Estimates

### Free Tier (Good for getting started)
- Neon Database: Free (0.5GB)
- Render Backend: Free (spins down after 15 min inactivity)
- Netlify/Vercel Frontend: Free
- **Total: $0/month**
- **Limitation:** Backend cold starts (slow first request)

### Hobby Tier (Recommended for launch)
- Neon Database: Free
- Render Backend: $7/month (always on)
- Vercel Frontend: Free
- **Total: $7/month**
- **Good for:** Up to 1000 users

### Production Tier
- Neon Database: $19/month (more storage)
- Render Backend: $25/month (more resources)
- Cloudflare CDN: Free
- **Total: $44/month**
- **Good for:** 10,000+ users

---

## 🎯 Launch Day Checklist

### 1 Week Before:
- [ ] Test all features thoroughly
- [ ] Create admin accounts
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Write user guide

### 1 Day Before:
- [ ] Do final test of entire flow
- [ ] Check all links work
- [ ] Verify emails/phone numbers
- [ ] Test on mobile devices
- [ ] Have rollback plan ready

### Launch Day:
- [ ] Deploy to production
- [ ] Verify all features work
- [ ] Monitor logs closely
- [ ] Be ready to respond to issues
- [ ] Celebrate! 🎉

### Post-Launch:
- [ ] Monitor error rates
- [ ] Collect user feedback
- [ ] Fix critical bugs quickly
- [ ] Plan next features

---

## 📞 Support Resources

- **Neon Docs:** https://neon.tech/docs
- **Render Docs:** https://render.com/docs
- **Express.js:** https://expressjs.com/
- **Node.js:** https://nodejs.org/docs

---

## ⚡ Performance Tips

1. **Enable gzip compression** (Render does this automatically)
2. **Use CDN for images** (Cloudflare free tier)
3. **Database indexes** (already in schema.sql)
4. **Cache static files** (Nginx/Render handles this)
5. **Minify JavaScript** (for production)

---

You're ready to deploy! Good luck with your launch! 🚀🎣

