@echo off
REM 🚀 Paystack Subscription System Deployment Script for Windows
REM This script automates the deployment process on Windows

echo 🚀 Starting Paystack Subscription System Deployment...

REM Check if .env file exists
if not exist ".env" (
    echo [ERROR] .env file not found!
    echo Please create a .env file with your configuration:
    echo.
    echo REACT_APP_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
    echo REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
    echo REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    echo REACT_APP_FIREBASE_PROJECT_ID=your_project_id
    echo REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
    echo REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    echo REACT_APP_FIREBASE_APP_ID=your_app_id
    echo REACT_APP_FUNCTIONS_REGION=us-central1
    pause
    exit /b 1
)

echo [SUCCESS] .env file found!

REM Step 1: Install frontend dependencies
echo [INFO] Installing frontend dependencies...
call npm install react-paystack-inline-js
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    exit /b 1
)
echo [SUCCESS] Frontend dependencies installed!

REM Step 2: Install backend dependencies
echo [INFO] Installing backend dependencies...
cd functions
call npm install paystack axios crypto
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)
cd ..
echo [SUCCESS] Backend dependencies installed!

REM Step 3: Build functions
echo [INFO] Building Firebase Functions...
cd functions
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Failed to build functions
    pause
    exit /b 1
)
cd ..
echo [SUCCESS] Functions built successfully!

REM Step 4: Deploy Firestore rules
echo [INFO] Deploying Firestore security rules...
call firebase deploy --only firestore:rules
if %errorlevel% neq 0 (
    echo [WARNING] Failed to deploy Firestore rules (you may need to configure them manually)
) else (
    echo [SUCCESS] Firestore rules deployed!
)

REM Step 5: Deploy functions
echo [INFO] Deploying Firebase Functions...
call firebase deploy --only functions
if %errorlevel% neq 0 (
    echo [ERROR] Failed to deploy functions
    pause
    exit /b 1
)
echo [SUCCESS] Functions deployed successfully!

REM Step 6: Build frontend
echo [INFO] Building frontend application...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Failed to build frontend
    pause
    exit /b 1
)
echo [SUCCESS] Frontend built successfully!

REM Step 7: Deploy frontend
echo [INFO] Deploying to Firebase Hosting...
call firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo [ERROR] Failed to deploy frontend
    pause
    exit /b 1
)
echo [SUCCESS] Frontend deployed successfully!

echo.
echo 🎉 Deployment completed successfully!
echo.
echo 📋 Next Steps:
echo 1. Configure Paystack webhook: https://your-project-id.cloudfunctions.net/paystackWebhook
echo 2. Test the subscription flow at: your-deployed-url/subscription
echo 3. Monitor function logs: firebase functions:log
echo.
echo [WARNING] Don't forget to:
echo - Set up Paystack webhooks in your dashboard
echo - Test with Paystack test cards
echo - Monitor function logs for any issues
echo.
pause
