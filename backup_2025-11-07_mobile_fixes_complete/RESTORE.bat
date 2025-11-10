@echo off
echo ================================================
echo  Restore Backup - Mobile Fixes Complete
echo  Date: November 7, 2025
echo ================================================
echo.
echo WARNING: This will restore all files from this backup!
echo Current files will be overwritten.
echo.
pause
echo.

echo Restoring files...
robocopy "%~dp0" ".." /E /IS /XD .git node_modules backup_* /NFL

echo.
echo ================================================
echo  Restore Complete!
echo ================================================
echo.
echo Files have been restored from:
echo   backup_2025-11-07_mobile_fixes_complete
echo.
echo You may need to:
echo   1. Restart your development server
echo   2. Clear browser cache (Ctrl + Shift + R)
echo   3. Rebuild if using a build system
echo.
pause



