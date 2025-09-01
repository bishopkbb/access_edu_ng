/**
 * Firebase Functions entry point
 * 
 * This file exports all Firebase Functions for the AccessEdu NG project.
 * Includes API endpoints and function exports with proper TypeScript typing.
 */

import * as functions from 'firebase-functions';
import { Request, Response, NextFunction } from 'express';

const express = require('express');
const cors = require('cors');

// Configure CORS
const corsOptions = {
  origin: true, // Allow all origins for now - configure specific domains in production
  credentials: true,
};

// Initialize Express app
const app = express();
app.use(cors(corsOptions));

// Type definitions
interface HelloWorldRequest extends Request {}
interface HelloWorldResponse extends Response {}

/**
 * Basic hello world function for testing
 * @param req - Express request object
 * @param res - Express response object
 */
export const helloWorld = (req: HelloWorldRequest, res: HelloWorldResponse): void => {
  console.log("Hello from Firebase Functions!");
  res.status(200).json({
    message: "Hello from AccessEdu NG Firebase Functions!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
};

/**
 * Test endpoint to verify CORS configuration
 */
app.get('/test', (req: Request, res: Response) => {
  res.status(200).json({
    message: "CORS is working ✅",
    timestamp: new Date().toISOString(),
    headers: req.headers.origin || 'No origin header'
  });
});

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'AccessEdu NG API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * Root endpoint
 */
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'AccessEdu NG API is running',
    version: '1.0.0',
    endpoints: ['/test', '/health']
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Export the API function
export const api = functions.https.onRequest(app);

// Paystack subscription functions (commented out until dependencies are installed)
/**
 * To enable Paystack subscription functions:
 * 
 * 1. Install dependencies:
 *    npm install axios @types/node
 * 
 * 2. Set environment variables:
 *    firebase functions:config:set paystack.secret_key="your_secret_key"
 *    firebase functions:config:set paystack.public_key="your_public_key"
 * 
 * 3. Create paystack-subscription.ts file with the required functions
 * 
 * 4. Uncomment the export section below:
 */

/*
export {
  initializeSubscription,
  verifyTransaction,
  getUserSubscription,
  cancelSubscription,
  paystackWebhook
} from './paystack-subscription';
*/

/**
 * Additional function exports can be added here as the project grows
 * Example:
 * 
 * export { authFunction } from './auth';
 * export { notificationFunction } from './notifications';
 * export { dataProcessingFunction } from './data-processing';
 */