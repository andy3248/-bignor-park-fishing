@echo off
echo ================================================
echo  Bignor Park - Deploy Mobile Fixes
echo ================================================
echo.

REM Change to project directory
cd /d "%~dp0"

echo Current directory: %CD%
echo.

echo [Step 1/4] Checking Git status...
git status
echo.

echo [Step 2/4] Adding all changed files...
git add mobile-fixes.css
git add booking.html home.html profile.html my-bookings.html index.html signup.html
git add styles.css booking-styles.css index-clean.css
echo ✓ Files staged for commit
echo.

echo [Step 3/4] Committing changes...
git commit -m "Fix mobile layout - add aggressive responsive CSS"
echo ✓ Changes committed
echo.

echo [Step 4/4] Pushing to GitHub...
git push origin main
IF ERRORLEVEL 1 (
    echo.
    echo ⚠ Push to 'main' failed, trying 'master'...
    git push origin master
)
echo.

echo ================================================
echo  ✓ Deploy Complete!
echo ================================================
echo.
echo Your changes are now on GitHub.
echo Render will automatically deploy in 2-5 minutes.
echo.
echo Check deployment at: https://dashboard.render.com
echo.
pause

