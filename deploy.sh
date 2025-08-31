#!/bin/bash

# 🚀 Paystack Subscription System Deployment Script
# This script automates the deployment process

echo "🚀 Starting Paystack Subscription System Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found!"
    echo "Please create a .env file with your configuration:"
    echo ""
    echo "REACT_APP_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here"
    echo "REACT_APP_FIREBASE_API_KEY=your_firebase_api_key"
    echo "REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com"
    echo "REACT_APP_FIREBASE_PROJECT_ID=your_project_id"
    echo "REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com"
    echo "REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id"
    echo "REACT_APP_FIREBASE_APP_ID=your_app_id"
    echo "REACT_APP_FUNCTIONS_REGION=us-central1"
    exit 1
fi

print_success ".env file found!"

# Step 1: Install frontend dependencies
print_status "Installing frontend dependencies..."
if npm install react-paystack-inline-js; then
    print_success "Frontend dependencies installed!"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

# Step 2: Install backend dependencies
print_status "Installing backend dependencies..."
cd functions
if npm install paystack axios crypto; then
    print_success "Backend dependencies installed!"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi
cd ..

# Step 3: Build functions
print_status "Building Firebase Functions..."
cd functions
if npm run build; then
    print_success "Functions built successfully!"
else
    print_error "Failed to build functions"
    exit 1
fi
cd ..

# Step 4: Deploy Firestore rules
print_status "Deploying Firestore security rules..."
if firebase deploy --only firestore:rules; then
    print_success "Firestore rules deployed!"
else
    print_warning "Failed to deploy Firestore rules (you may need to configure them manually)"
fi

# Step 5: Deploy functions
print_status "Deploying Firebase Functions..."
if firebase deploy --only functions; then
    print_success "Functions deployed successfully!"
else
    print_error "Failed to deploy functions"
    exit 1
fi

# Step 6: Build frontend
print_status "Building frontend application..."
if npm run build; then
    print_success "Frontend built successfully!"
else
    print_error "Failed to build frontend"
    exit 1
fi

# Step 7: Deploy frontend
print_status "Deploying to Firebase Hosting..."
if firebase deploy --only hosting; then
    print_success "Frontend deployed successfully!"
else
    print_error "Failed to deploy frontend"
    exit 1
fi

# Get the deployed URL
DEPLOYED_URL=$(firebase hosting:channel:list --json | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)

print_success "🎉 Deployment completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Configure Paystack webhook: https://your-project-id.cloudfunctions.net/paystackWebhook"
echo "2. Test the subscription flow at: $DEPLOYED_URL/subscription"
echo "3. Monitor function logs: firebase functions:log"
echo ""
echo "🔗 Your deployed application: $DEPLOYED_URL"
echo ""
print_warning "Don't forget to:"
echo "- Set up Paystack webhooks in your dashboard"
echo "- Test with Paystack test cards"
echo "- Monitor function logs for any issues"
