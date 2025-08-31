# Paystack Subscription System Setup Guide

This guide provides step-by-step instructions for setting up the Paystack subscription system in the Accessedung web application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 18+ and npm
- Firebase project with Firestore database
- Paystack account with API keys
- React application with Firebase integration

## Backend Setup

### 1. Install Dependencies

Navigate to the `functions` directory and install the required dependencies:

```bash
cd functions
npm install paystack axios crypto
```

### 2. Configure Firebase Functions

The backend functions are already created in `functions/src/paystack-subscription.ts`. These functions handle:

- Subscription initialization
- Transaction verification
- Webhook processing
- Subscription management

### 3. Set Environment Variables

Configure your Paystack API keys in Firebase Functions:

```bash
firebase functions:config:set paystack.secret_key="sk_test_your_secret_key_here"
firebase functions:config:set paystack.public_key="pk_test_your_public_key_here"
```

### 4. Deploy Functions

Deploy the Firebase Functions:

```bash
firebase deploy --only functions
```

## Frontend Setup

### 1. Install Dependencies

Install the required frontend dependencies:

```bash
npm install react-paystack-inline-js
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
REACT_APP_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FUNCTIONS_REGION=us-central1
```

### 3. Components Structure

The subscription system includes the following components:

```
src/
├── components/subscription/
│   ├── SubscriptionCheckout.jsx      # Main checkout component
│   ├── SubscriptionManagement.jsx    # Subscription management
│   ├── PremiumContentGuard.jsx       # Content protection
│   └── PaystackScript.jsx            # Script loader
├── services/
│   └── subscriptionService.js        # API service layer
├── config/
│   ├── subscriptionPlans.js          # Plan configuration
│   └── paystack.js                   # Paystack configuration
├── context/
│   └── SubscriptionContext.jsx       # State management
└── pages/
    ├── subscription.jsx              # Subscription page
    └── subscriptionManagement.jsx    # Management page
```

## Environment Configuration

### Paystack Configuration

1. **Get API Keys**: Log into your Paystack dashboard and get your test/live API keys
2. **Set Public Key**: Add your public key to the frontend environment variables
3. **Set Secret Key**: Add your secret key to Firebase Functions configuration

### Firebase Configuration

1. **Enable Firestore**: Ensure Firestore is enabled in your Firebase project
2. **Set Security Rules**: Configure Firestore security rules for subscription data
3. **Enable Functions**: Ensure Firebase Functions are enabled

## Database Setup

### Firestore Collections

The system creates the following collections:

1. **subscriptions**: Stores subscription data
   ```javascript
   {
     userId: string,
     planType: string,
     paystackSubscriptionCode: string,
     paystackCustomerCode: string,
     paystackPlanCode: string,
     status: string,
     amount: number,
     currency: string,
     interval: string,
     startDate: timestamp,
     endDate: timestamp,
     metadata: object,
     createdAt: timestamp,
     updatedAt: timestamp
   }
   ```

2. **payment_logs**: Stores payment events
   ```javascript
   {
     userId: string,
     action: string,
     subscriptionCode: string,
     amount: number,
     status: string,
     timestamp: timestamp
   }
   ```

3. **users**: Extended with subscription fields
   ```javascript
   {
     // ... existing user fields
     subscriptionStatus: string,
     subscriptionPlan: string,
     subscriptionEndDate: timestamp
   }
   ```

### Firestore Security Rules

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

## Testing

### 1. Test Cards

Use these Paystack test cards:

- **Success**: 4084 0840 8408 4081
- **Declined**: 4084 0840 8408 4082
- **Insufficient Funds**: 4084 0840 8408 4083

### 2. Test Flow

1. Navigate to `/subscription`
2. Select a plan
3. Fill in payment details
4. Use test card for payment
5. Verify subscription activation

### 3. Webhook Testing

Use ngrok or similar tool to test webhooks locally:

```bash
ngrok http 5001
```

Then set the webhook URL in your Paystack dashboard.

## Deployment

### 1. Production Environment

1. **Update API Keys**: Switch to live Paystack API keys
2. **Update Environment Variables**: Set production environment variables
3. **Deploy Functions**: Deploy to production Firebase project
4. **Build Frontend**: Build and deploy the React application

### 2. Webhook Configuration

Set up webhook endpoints in Paystack dashboard:

```
https://your-project.cloudfunctions.net/paystackWebhook
```

### 3. Security Considerations

- Never expose secret keys in frontend code
- Use environment variables for sensitive data
- Implement proper error handling
- Add rate limiting for API endpoints
- Monitor payment logs for suspicious activity

## Usage Examples

### 1. Protecting Premium Content

```jsx
import PremiumContentGuard from '../components/subscription/PremiumContentGuard';

function PremiumFeature() {
  return (
    <PremiumContentGuard>
      <div>This is premium content</div>
    </PremiumContentGuard>
  );
}
```

### 2. Checking Subscription Status

```jsx
import { useSubscription } from '../context/SubscriptionContext';

function MyComponent() {
  const { hasPremiumAccess, getSubscriptionPlan } = useSubscription();
  
  if (hasPremiumAccess()) {
    return <div>Premium content here</div>;
  }
  
  return <div>Upgrade to access this content</div>;
}
```

### 3. Subscription Management

```jsx
import SubscriptionManagement from '../components/subscription/SubscriptionManagement';

function SettingsPage() {
  return (
    <div>
      <h1>Account Settings</h1>
      <SubscriptionManagement />
    </div>
  );
}
```

## Troubleshooting

### Common Issues

1. **Payment Not Processing**
   - Check Paystack API keys
   - Verify webhook configuration
   - Check browser console for errors

2. **Subscription Not Activating**
   - Verify transaction verification
   - Check Firestore security rules
   - Review payment logs

3. **Webhook Not Working**
   - Check webhook URL configuration
   - Verify signature validation
   - Check Firebase Functions logs

### Debug Mode

Enable debug logging by adding to your environment:

```env
REACT_APP_DEBUG=true
```

### Support

For issues related to:
- **Paystack**: Contact Paystack support
- **Firebase**: Check Firebase documentation
- **Application**: Review logs and error messages

## Security Best Practices

1. **API Key Management**
   - Use environment variables
   - Rotate keys regularly
   - Never commit keys to version control

2. **Data Validation**
   - Validate all input data
   - Sanitize user inputs
   - Implement proper error handling

3. **Payment Security**
   - Always verify transactions server-side
   - Use HTTPS for all communications
   - Implement webhook signature validation

4. **Access Control**
   - Implement proper authentication
   - Use Firestore security rules
   - Validate user permissions

## Monitoring and Analytics

### 1. Payment Analytics

Track subscription metrics:
- Conversion rates
- Payment success/failure rates
- Revenue analytics
- User retention

### 2. Error Monitoring

Monitor for:
- Payment failures
- Webhook errors
- API timeouts
- Database errors

### 3. Performance Monitoring

Track:
- Payment processing times
- API response times
- Database query performance
- User experience metrics

## Conclusion

This subscription system provides a complete solution for handling recurring payments with Paystack. It includes:

- Secure payment processing
- Subscription management
- Content protection
- Webhook handling
- Error handling
- Analytics support

Follow this guide to set up and deploy the system successfully. For additional support, refer to the Paystack and Firebase documentation.
