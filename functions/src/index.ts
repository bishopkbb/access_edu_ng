/**
 * Firebase Functions entry point
 * 
 * This file exports all Firebase Functions for the project.
 * Currently includes a basic hello world function for testing.
 * 
 * To enable Paystack subscription functions:
 * 1. Install dependencies: npm install axios
 * 2. Uncomment the export section below
 * 3. Configure Paystack environment variables
 */

// Basic hello world function for testing
export const helloWorld = (req: any, res: any) => {
  console.log("Hello from Firebase Functions!");
  res.send("Hello from AccessEdu NG Firebase Functions!");
};

// Note: Paystack subscription functions are temporarily disabled
// To enable them:
// 1. Add axios to package.json dependencies
// 2. Configure Paystack environment variables
// 3. Uncomment the export below:
/*
export {
  initializeSubscription,
  verifyTransaction,
  getUserSubscription,
  cancelSubscription,
  paystackWebhook
} from './paystack-subscription';
*/
