@echo off
echo Setting up Git for HR System...
echo.

REM Check if git is available
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Git is not installed or not in PATH
    echo Please restart your computer after Git installation
    echo Then run this script again
    pause
    exit /b 1
)

echo Git is available!
echo.

REM Initialize git repository if not already initialized
if not exist .git (
    echo Initializing Git repository...
    git init
    echo.
)

REM Configure git user (you can change these)
echo Configuring Git user...
git config user.name "HR System Developer"
git config user.email "developer@hrsystem.com"
echo.

REM Add all files to git
echo Adding files to Git...
git add .
echo.

REM Create commit with our changes
echo Creating commit...
git commit -m "إصلاح مشكلة TypeError في تتبع الوقت وتحسين معالجة البيانات

- إصلاح خطأ Cannot read properties of undefined (reading 'length')
- إضافة فحص Array.isArray() قبل استخدام خاصية length
- تحسين معالجة البيانات في الباك إند مع إرجاع هيكل بيانات ثابت
- إضافة قيم افتراضية لجميع الحقول في البيانات المرجعة
- تحسين استقرار النظام ومنع الأخطاء المتعلقة بالبيانات غير المعرفة"
echo.

echo Setup complete!
echo.
echo To push to GitHub, run:
echo git remote add origin YOUR_GITHUB_REPO_URL
echo git branch -M main
echo git push -u origin main
echo.
pause 