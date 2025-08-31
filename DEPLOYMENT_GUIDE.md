# 🚀 Live Server Deployment Guide

This guide will help you deploy the Paystack subscription system to a live server.

## 📋 **Prerequisites Checklist**

Before deployment, ensure you have:

- [ ] Node.js 18+ installed
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Paystack account with API keys
- [ ] Firebase project set up
- [ ] Git repository ready

## 🔧 **Step 1: Environment Setup**

### **1.1 Install Dependencies**

```bash
# Install frontend dependencies
npm install react-paystack-inline-js

# Install backend dependencies
cd functions
npm install paystack axios crypto
cd ..
```

### **1.2 Create Environment File**

Create a `.env` file in the root directory:

```env
# Paystack Configuration
REACT_APP_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FUNCTIONS_REGION=us-central1
```

## 🔑 **Step 2: Paystack Configuration**

### **2.1 Get Paystack API Keys**

1. Log into your [Paystack Dashboard](https://dashboard.paystack.com/)
2. Go to Settings → API Keys & Webhooks
3. Copy your **Test Public Key** and **Test Secret Key**
4. Replace the placeholder values in your `.env` file

### **2.2 Configure Firebase Functions**

```bash
# Set Paystack secret key
firebase functions:config:set paystack.secret_key="sk_test_your_secret_key_here"

# Set Paystack public key
firebase functions:config:set paystack.public_key="pk_test_your_public_key_here"
```

## 🗄️ **Step 3: Database Setup**

### **3.1 Update Firestore Security Rules**

Add these rules to your `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Subscription rules
    match /subscriptions/{subscriptionId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Payment logs rules
    match /payment_logs/{logId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // User subscription data
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
  }
}
```

### **3.2 Deploy Firestore Rules**

```bash
firebase deploy --only firestore:rules
```

## 🚀 **Step 4: Deploy Firebase Functions**

### **4.1 Build Functions**

```bash
cd functions
npm run build
cd ..
```

### **4.2 Deploy Functions**

```bash
firebase deploy --only functions
```

## 🌐 **Step 5: Deploy Frontend**

### **5.1 Build Frontend**

```bash
npm run build
```

### **5.2 Deploy to Firebase Hosting**

```bash
firebase deploy --only hosting
```

## 🔗 **Step 6: Configure Webhooks**

### **6.1 Get Webhook URL**

After deploying functions, get your webhook URL:

```
https://your-project-id.cloudfunctions.net/paystackWebhook
```

### **6.2 Set Webhook in Paystack**

1. Go to Paystack Dashboard → Settings → API Keys & Webhooks
2. Add new webhook with URL: `https://your-project-id.cloudfunctions.net/paystackWebhook`
3. Select these events:
   - `subscription.create`
   - `subscription.enable`
   - `subscription.disable`
   - `charge.success`
   - `charge.failed`

## 🧪 **Step 7: Testing**

### **7.1 Test Cards**

Use these Paystack test cards:

- **Success**: 4084 0840 8408 4081
- **Declined**: 4084 0840 8408 4082
- **Insufficient Funds**: 4084 0840 8408 4083

### **7.2 Test Flow**

1. Navigate to your live site
2. Go to `/subscription`
3. Select a plan
4. Fill in payment details
5. Use test card for payment
6. Verify subscription activation

## 🔍 **Step 8: Verification**

### **8.1 Check Functions Logs**

```bash
firebase functions:log
```

### **8.2 Check Firestore Data**

Verify these collections are created:
- `subscriptions`
- `payment_logs`
- `users` (with subscription fields)

### **8.3 Test Webhook**

Check if webhook events are being received in Firebase Functions logs.

## 🛠️ **Troubleshooting**

### **Common Issues**

1. **Functions Not Deploying**
   ```bash
   # Check Node.js version
   node --version
   
   # Clear cache and retry
   firebase functions:delete
   firebase deploy --only functions
   ```

2. **Webhook Not Working**
   - Verify webhook URL is correct
   - Check Firebase Functions logs
   - Ensure webhook signature validation is working

3. **Payment Not Processing**
   - Verify Paystack API keys
   - Check browser console for errors
   - Ensure Paystack script is loading

### **Debug Commands**

```bash
# View function logs
firebase functions:log --only paystackWebhook

# Test function locally
firebase emulators:start --only functions

# Check deployment status
firebase projects:list
```

## 🔒 **Security Checklist**

- [ ] API keys are in environment variables
- [ ] Secret keys are not exposed in frontend
- [ ] Firestore security rules are configured
- [ ] Webhook signature validation is working
- [ ] HTTPS is enabled for all communications

## 📊 **Monitoring**

### **Set Up Monitoring**

1. **Firebase Console**: Monitor function executions and errors
2. **Paystack Dashboard**: Monitor payment success/failure rates
3. **Firestore**: Monitor subscription data and payment logs

### **Key Metrics to Track**

- Payment success rate
- Subscription conversion rate
- Function execution times
- Error rates

## 🎯 **Production Checklist**

Before going live:

- [ ] Switch to live Paystack API keys
- [ ] Update environment variables
- [ ] Test with real payment methods
- [ ] Set up monitoring and alerts
- [ ] Configure backup and recovery
- [ ] Document deployment process

## 📞 **Support**

If you encounter issues:

1. Check Firebase Functions logs
2. Review Paystack webhook events
3. Verify environment configuration
4. Test with different payment methods

## 🎉 **Success!**

Your subscription system is now live! Users can:

- View subscription plans at `/subscription`
- Manage subscriptions at `/subscription/management`
- Access premium content with `PremiumContentGuard`
- Make secure payments through Paystack

---

**Next Steps:**
- Monitor system performance
- Gather user feedback
- Optimize conversion rates
- Scale as needed
