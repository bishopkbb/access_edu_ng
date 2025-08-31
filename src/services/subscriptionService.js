import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

/**
 * Subscription Service
 * Handles all subscription-related API calls to Firebase Functions
 */
class SubscriptionService {
  /**
   * Initialize a subscription with Paystack
   * @param {Object} data - Subscription data
   * @param {string} data.planType - Type of plan (monthly, yearly, premium)
   * @param {string} data.email - User's email
   * @param {Object} data.metadata - Additional metadata
   * @returns {Promise<Object>} Subscription initialization result
   */
  async initializeSubscription(data) {
    try {
      const initializeSubscriptionFunction = httpsCallable(functions, 'initializeSubscription');
      const result = await initializeSubscriptionFunction(data);
      return result.data;
    } catch (error) {
      console.error('Error initializing subscription:', error);
      throw error;
    }
  }

  /**
   * Verify a transaction with Paystack
   * @param {string} reference - Transaction reference
   * @returns {Promise<Object>} Transaction verification result
   */
  async verifyTransaction(reference) {
    try {
      const verifyTransactionFunction = httpsCallable(functions, 'verifyTransaction');
      const result = await verifyTransactionFunction({ reference });
      return result.data;
    } catch (error) {
      console.error('Error verifying transaction:', error);
      throw error;
    }
  }

  /**
   * Get user's current subscription status
   * @returns {Promise<Object>} User subscription data
   */
  async getUserSubscription() {
    try {
      const getUserSubscriptionFunction = httpsCallable(functions, 'getUserSubscription');
      const result = await getUserSubscriptionFunction();
      return result.data;
    } catch (error) {
      console.error('Error getting user subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel user's subscription
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelSubscription() {
    try {
      const cancelSubscriptionFunction = httpsCallable(functions, 'cancelSubscription');
      const result = await cancelSubscriptionFunction();
      return result.data;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }
}

export default new SubscriptionService();
