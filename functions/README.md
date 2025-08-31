# Firebase Functions for AccessEdu NG

This directory contains Firebase Functions for the AccessEdu NG application.

## Current Status

- ✅ Basic hello world function working
- ⏸️ Paystack subscription functions (temporarily disabled)

## Setup Instructions

### 1. Install Dependencies

```bash
cd functions
npm install
```

### 2. Enable Paystack Subscription Functions

To enable the Paystack subscription functionality:

1. **Install required dependencies:**
   ```bash
   npm install axios
   ```

2. **Configure environment variables:**
   ```bash
   firebase functions:config:set paystack.secret_key="your_paystack_secret_key"
   firebase functions:config:set paystack.public_key="your_paystack_public_key"
   ```

3. **Uncomment the export in `src/index.ts`:**
   ```typescript
   export {
     initializeSubscription,
     verifyTransaction,
     getUserSubscription,
     cancelSubscription,
     paystackWebhook
   } from './paystack-subscription';
   ```

### 3. Available Functions

#### Basic Functions
- `helloWorld` - Test function to verify Firebase Functions are working

#### Paystack Subscription Functions (when enabled)
- `initializeSubscription` - Initialize a new subscription with Paystack
- `verifyTransaction` - Verify payment transactions
- `getUserSubscription` - Get user's current subscription status
- `cancelSubscription` - Cancel user's subscription
- `paystackWebhook` - Handle Paystack webhook events

### 4. Development

```bash
# Build functions
npm run build

# Start emulator
npm run serve

# Deploy to production
npm run deploy
```

### 5. Environment Variables

Required environment variables for Paystack integration:

- `PAYSTACK_SECRET_KEY` - Your Paystack secret key
- `PAYSTACK_PUBLIC_KEY` - Your Paystack public key

### 6. Database Collections

The functions use the following Firestore collections:

- `users` - User profiles and subscription status
- `subscriptions` - Subscription records
- `payment_logs` - Payment transaction logs
- `forum_posts` - Community forum posts
- `forum_comments` - Forum comments

## Troubleshooting

### Common Issues

1. **TypeScript compilation errors:**
   - Ensure all dependencies are installed
   - Check that Firebase Functions types are available

2. **Paystack integration not working:**
   - Verify environment variables are set correctly
   - Check Paystack API keys are valid
   - Ensure webhook URLs are configured in Paystack dashboard

3. **Function deployment fails:**
   - Check Node.js version (requires Node 18+)
   - Verify all dependencies are in package.json
   - Check for syntax errors in TypeScript files

### Getting Help

If you encounter issues:

1. Check the Firebase Functions logs: `firebase functions:log`
2. Verify your Firebase project configuration
3. Ensure you have the necessary permissions for the Firebase project
