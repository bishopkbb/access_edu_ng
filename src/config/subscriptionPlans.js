/**
 * Subscription Plans Configuration
 * Defines available subscription plans with pricing and features
 */
export const SUBSCRIPTION_PLANS = {
  monthly: {
    id: 'monthly',
    name: 'Monthly Plan',
    description: 'Access to all features for 30 days',
    price: 50, // ₦50.00
    priceInKobo: 5000,
    interval: 'monthly',
    duration: 30,
    features: [
      'Unlimited access to educational content',
      'Priority customer support',
      'Ad-free experience',
      'Download resources',
      'Access to premium courses'
    ],
    popular: false,
    savings: null
  },
  yearly: {
    id: 'yearly',
    name: 'Yearly Plan',
    description: 'Best value - Save 17% with annual billing',
    price: 500, // ₦500.00
    priceInKobo: 50000,
    interval: 'yearly',
    duration: 365,
    features: [
      'All Monthly features',
      '2 months free',
      'Exclusive yearly content',
      'Priority access to new features',
      'Annual progress reports'
    ],
    popular: true,
    savings: '17%'
  },
  premium: {
    id: 'premium',
    name: 'Premium Plan',
    description: 'Enhanced features with monthly billing',
    price: 100, // ₦100.00
    priceInKobo: 10000,
    interval: 'monthly',
    duration: 30,
    features: [
      'All Monthly features',
      '1-on-1 tutoring sessions',
      'Custom learning paths',
      'Advanced analytics',
      'Direct mentor access'
    ],
    popular: false,
    savings: null
  }
};

/**
 * Get plan by ID
 * @param {string} planId - Plan identifier
 * @returns {Object|null} Plan object or null if not found
 */
export const getPlanById = (planId) => {
  return SUBSCRIPTION_PLANS[planId] || null;
};

/**
 * Get all available plans
 * @returns {Array} Array of plan objects
 */
export const getAllPlans = () => {
  return Object.values(SUBSCRIPTION_PLANS);
};

/**
 * Format price for display
 * @param {number} price - Price in kobo
 * @returns {string} Formatted price string
 */
export const formatPrice = (price) => {
  const naira = price / 100;
  return `₦${naira.toLocaleString()}`;
};

/**
 * Calculate savings percentage
 * @param {number} originalPrice - Original price in kobo
 * @param {number} discountedPrice - Discounted price in kobo
 * @returns {string} Savings percentage
 */
export const calculateSavings = (originalPrice, discountedPrice) => {
  const savings = ((originalPrice - discountedPrice) / originalPrice) * 100;
  return `${Math.round(savings)}%`;
};
