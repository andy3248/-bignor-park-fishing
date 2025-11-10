# Database Setup Guide - Bignor Park Fishing App

## Option 1: Neon (Recommended - PostgreSQL)

### Why Neon?
- ✅ **No pausing** on free tier (unlike Supabase)
- ✅ PostgreSQL database
- ✅ 0.5 GB storage free
- ✅ Generous compute limits
- ✅ Easy setup with connection pooling
- ✅ Automatic backups

### Setup Steps:

1. **Create Neon Account**
   - Go to https://neon.tech/
   - Click "Sign Up" (can use GitHub/Google)
   - It's completely free, no credit card required

2. **Create Your Project**
   - Once logged in, click "Create Project"
   - Name it: `bignor-park-fishing`
   - Region: Choose closest to your users (e.g., US East, EU West)
   - Click "Create Project"

3. **Get Connection Details**
   - After creation, you'll see your connection string
   - It looks like: `postgresql://[user]:[password]@[host]/[database]?sslmode=require`
   - **SAVE THIS** - you'll need it!

4. **Copy Connection String**
   - Copy the "Pooled connection" string (better for serverless)
   - Save it securely

---

## Alternative: Turso (SQLite-based Edge Database)

### Why Turso?
- ✅ SQLite-compatible (simple, fast)
- ✅ Edge deployment (ultra-fast globally)
- ✅ 9 GB storage free
- ✅ 500 databases free
- ✅ No pausing

### Setup Steps:

1. Go to https://turso.tech/
2. Sign up (GitHub/Google)
3. Install CLI: `npm install -g @turso/cli` or `curl -sSfL https://get.turso.tech/install.sh | bash`
4. Login: `turso auth login`
5. Create database: `turso db create bignor-park`
6. Get URL: `turso db show bignor-park --url`
7. Get token: `turso db tokens create bignor-park`

---

## Database Schema for Bignor Park

Below is the complete schema for your fishing app. Use this in Neon's SQL editor or run it via connection.

---

## Next Steps

1. Choose your database (Neon recommended)
2. Create an account
3. Run the schema (see `schema.sql`)
4. Update your app with connection details
5. Test the connection

---

## Security Notes

- Never commit connection strings to GitHub
- Use environment variables for production
- Rotate passwords regularly
- Use connection pooling for better performance








