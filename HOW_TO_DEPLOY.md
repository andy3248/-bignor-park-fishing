# How to Deploy Updates to the Website

## ⚡ Quick Deploy (Easiest Method)

**Just double-click this file: `deploy.bat`**

That's it! The script will automatically:
1. Add all your changes
2. Commit with a message
3. Push to GitHub
4. Trigger Render to update the live site

Wait 2-5 minutes and your site is updated! ✅

---

## 🖥️ Manual Deploy (Command Line)

If you prefer to do it manually, follow these 3 steps:

### Step 1: Open PowerShell
- Navigate to your project folder: `D:\fishing app`
- Or right-click in the folder and select "Open in Terminal"

### Step 2: Run These Commands
```bash
git add .
git commit -m "Your description of what you changed"
git push origin main
```

### Step 3: Wait for Deployment
- Render automatically detects the push
- Deploys in 2-5 minutes
- Check at: https://dashboard.render.com

---

## 📋 Complete Step-by-Step Process

### 1. Make Your Changes
- Edit HTML, CSS, JavaScript files
- Test locally to make sure everything works
- Save all files

### 2. Deploy to GitHub
Choose one of these methods:

**Method A: Use deploy.bat (Recommended)**
- Double-click `deploy.bat`
- It handles everything automatically

**Method B: Use Command Line**
```bash
cd "D:\fishing app"
git add .
git commit -m "Description of changes"
git push origin main
```

**Method C: Use GitHub Desktop** (if installed)
- Open GitHub Desktop
- Review changed files
- Write commit message
- Click "Commit to main"
- Click "Push origin"

### 3. Verify GitHub Upload
- Go to: https://github.com/andy3248/-bignor-park-fishing
- Refresh the page
- You should see your latest commit at the top
- Commit message shows what you changed

### 4. Check Render Deployment
- Go to: https://dashboard.render.com
- Find your service (bignor-park-fishing)
- Look for "Deploying..." status
- Wait for "Live" status (2-5 minutes)

### 5. Test Live Site
- Go to your live website URL
- Clear browser cache: `Ctrl + Shift + R`
- Test your changes
- Check on mobile device if you changed mobile styles

---

## 🎯 What Happens Behind the Scenes

```
1. You make changes → Edit files locally
                    ↓
2. You run deploy → Adds changes to Git
                    ↓
3. Push to GitHub → Uploads to cloud repository
                    ↓
4. Render detects → Automatically starts deployment
                    ↓
5. Render builds → Installs dependencies, builds project
                    ↓
6. Render deploys → Updates live website
                    ↓
7. ✅ Site is live → Your changes are now public
```

**Total time: 2-5 minutes** from push to live

---

## 💾 Backup Before Major Changes

**Always backup before big changes:**

```bash
# Create backup with today's date
mkdir backup_2025-MM-DD_description
robocopy . backup_2025-MM-DD_description /E /XD node_modules .git backup_*
```

Or use the existing backup folders as examples.

---

## 🔧 Troubleshooting

### Problem: "Git not recognized"
**Solution**: Install Git from https://git-scm.com/download/win

### Problem: "Authentication failed"
**Solution**: 
```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```
May need GitHub Personal Access Token

### Problem: "Changes not showing on live site"
**Solution**: Clear browser cache (`Ctrl + Shift + R`)

### Problem: "Render not auto-deploying"
**Solution**: 
1. Go to Render dashboard
2. Settings → Auto-Deploy → Ensure it's "Yes"
3. Manually trigger: Click "Manual Deploy"

### Problem: "Deploy failed on Render"
**Solution**:
1. Check Render logs for errors
2. Usually a missing dependency or build issue
3. Check that all files were pushed to GitHub

---

## 📝 Common Git Commands

```bash
# Check what files changed
git status

# See your change history
git log --oneline

# Undo last commit (but keep changes)
git reset --soft HEAD~1

# Discard all local changes (careful!)
git reset --hard HEAD

# Pull latest from GitHub
git pull origin main

# Check which branch you're on
git branch

# Create backup of current state
git checkout -b backup-branch-name
```

---

## ✅ Pre-Deployment Checklist

Before deploying, make sure:
- [ ] All files saved
- [ ] Tested locally (if possible)
- [ ] No console errors
- [ ] Backup created (for major changes)
- [ ] You know what you changed (for commit message)

---

## 📱 Testing After Deployment

After site updates:
- [ ] Test on desktop browser
- [ ] Test on mobile device
- [ ] Check booking system works
- [ ] Test user login/logout
- [ ] Clear cache if changes not visible
- [ ] Test on different browsers

---

## 🚀 Quick Reference Card

```
┌─────────────────────────────────────────┐
│     DEPLOY TO WEBSITE - 3 STEPS         │
├─────────────────────────────────────────┤
│                                         │
│  1. Double-click: deploy.bat           │
│                                         │
│  2. Wait 2-5 minutes                   │
│                                         │
│  3. Check: dashboard.render.com        │
│                                         │
│  4. Test: Your live site URL           │
│     (Clear cache: Ctrl+Shift+R)        │
│                                         │
└─────────────────────────────────────────┘

OR Manual:
  git add .
  git commit -m "What I changed"
  git push origin main
```

---

## 📍 Important URLs

**GitHub Repository**:
- https://github.com/andy3248/-bignor-park-fishing

**Render Dashboard**:
- https://dashboard.render.com

**Your Live Site**:
- Check Render dashboard for the URL
- Usually: https://[your-app-name].onrender.com

---

## 💡 Pro Tips

1. **Commit often**: Make small, frequent commits rather than large ones
2. **Good commit messages**: Describe what you changed clearly
3. **Test locally first**: Catch errors before deploying
4. **Backup major changes**: Create backup before big updates
5. **Check Render logs**: If deploy fails, check logs for clues
6. **Clear cache**: Always clear cache when testing changes
7. **Mobile testing**: Test on real mobile device for mobile changes

---

## 📖 Example Workflow

Here's a typical workflow when making changes:

```bash
# 1. Make changes to files
# Edit booking.html, styles.css, etc.

# 2. Save all files
# Ctrl + S in your editor

# 3. Test locally if possible
# Open files in browser, check for errors

# 4. Deploy
Double-click deploy.bat

# 5. Verify on GitHub
# Go to GitHub, see new commit

# 6. Check Render
# Go to dashboard.render.com, wait for "Live"

# 7. Test live site
# Open site, press Ctrl+Shift+R, test changes

# 8. Done! ✅
```

---

## 🆘 Need Help?

If something goes wrong:
1. Check Render logs (Dashboard → Logs tab)
2. Check GitHub (verify files were pushed)
3. Check Git status: `git status`
4. Try manual deploy in Render
5. Restore from backup if needed

---

**Last Updated**: November 7, 2025  
**Created for**: Bignor Park Fishing App  
**Keep this file**: Reference it whenever you need to deploy!



