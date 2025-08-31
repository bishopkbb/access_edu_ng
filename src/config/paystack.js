/**
 * Paystack Configuration
 * Centralized configuration for Paystack integration
 */

// Paystack public key - should be set in environment variables
export const PAYSTACK_PUBLIC_KEY = process.env.REACT_APP_PAYSTACK_PUBLIC_KEY || 'pk_test_your_public_key_here';

// Paystack configuration
export const PAYSTACK_CONFIG = {
  // Base URL for Paystack API
  BASE_URL: 'https://api.paystack.co',
  
  // Currency for payments
  CURRENCY: 'NGN',
  
  // Supported payment channels
  CHANNELS: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
  
  // Payment callback URL (optional)
  CALLBACK_URL: window.location.origin + '/payment/callback',
  
  // Payment cancel URL
  CANCEL_URL: window.location.origin + '/subscription',
};

/**
 * Initialize Paystack payment
 * @param {Object} config - Payment configuration
 * @returns {Object} Paystack handler
 */
export const initializePaystackPayment = (config) => {
  if (!window.PaystackPop) {
    throw new Error('Paystack script not loaded');
  }

  return window.PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email: config.email,
    amount: config.amount,
    currency: PAYSTACK_CONFIG.CURRENCY,
    ref: config.reference,
    channels: PAYSTACK_CONFIG.CHANNELS,
    callback: config.callback,
    onClose: config.onClose,
    metadata: config.metadata || {},
  });
};

/**
 * Validate Paystack configuration
 */
export const validatePaystackConfig = () => {
  if (!PAYSTACK_PUBLIC_KEY || PAYSTACK_PUBLIC_KEY === 'pk_test_your_public_key_here') {
    console.warn('Paystack public key not configured. Please set REACT_APP_PAYSTACK_PUBLIC_KEY in your environment variables.');
    return false;
  }
  return true;
};

/**
 * Get Paystack script URL
 */
export const getPaystackScriptUrl = () => {
  return 'https://js.paystack.co/v1/inline.js';
};
