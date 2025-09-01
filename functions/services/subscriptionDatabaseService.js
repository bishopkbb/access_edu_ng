const admin = require('firebase-admin');

/**
 * Subscription Database Service
 * Handles all database operations for subscriptions using Firestore
 */
class SubscriptionDatabaseService {
  constructor() {
    // Initialize Firebase Admin if not already initialized
    if (!admin.apps.length) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
      } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error);
        throw new Error('Firebase Admin initialization failed');
      }
    }
    
    this.db = admin.firestore();
    this.subscriptionsCollection = this.db.collection('subscriptions');
    this.plansCollection = this.db.collection('subscription_plans');
    this.transactionsCollection = this.db.collection('subscription_transactions');
    this.webhookLogsCollection = this.db.collection('webhook_logs');
  }

  /**
   * Create or update a subscription record
   * @param {Object} subscriptionData - Subscription data
   * @returns {Promise<Object>} Operation result
   */
  async createOrUpdateSubscription(subscriptionData) {
    try {
      const {
        userId,
        email,
        subscriptionCode,
        customerCode,
        planCode,
        planName,
        amount,
        currency,
        status,
        startDate,
        nextPaymentDate,
        metadata = {}
      } = subscriptionData;

      const subscriptionDoc = {
        userId,
        email,
        subscriptionCode,
        customerCode,
        planCode,
        planName,
        amount,
        currency,
        status,
        startDate: admin.firestore.Timestamp.fromDate(new Date(startDate)),
        nextPaymentDate: nextPaymentDate ? admin.firestore.Timestamp.fromDate(new Date(nextPaymentDate)) : null,
        metadata,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Use subscriptionCode as document ID for easy retrieval
      await this.subscriptionsCollection.doc(subscriptionCode).set(subscriptionDoc, { merge: true });

      return {
        success: true,
        subscriptionId: subscriptionCode,
        message: 'Subscription saved successfully'
      };
    } catch (error) {
      console.error('Error saving subscription:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get subscription by subscription code
   * @param {string} subscriptionCode - Subscription code
   * @returns {Promise<Object>} Subscription data
   */
  async getSubscription(subscriptionCode) {
    try {
      const doc = await this.subscriptionsCollection.doc(subscriptionCode).get();
      
      if (!doc.exists) {
        return {
          success: false,
          error: 'Subscription not found'
        };
      }

      const data = doc.data();
      return {
        success: true,
        data: {
          ...data,
          id: doc.id,
          startDate: data.startDate?.toDate(),
          nextPaymentDate: data.nextPaymentDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        }
      };
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get subscriptions by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User subscriptions
   */
  async getUserSubscriptions(userId) {
    try {
      const snapshot = await this.subscriptionsCollection
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      const subscriptions = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        subscriptions.push({
          ...data,
          id: doc.id,
          startDate: data.startDate?.toDate(),
          nextPaymentDate: data.nextPaymentDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        });
      });

      return {
        success: true,
        data: subscriptions
      };
    } catch (error) {
      console.error('Error fetching user subscriptions:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update subscription status
   * @param {string} subscriptionCode - Subscription code
   * @param {string} status - New status
   * @param {Object} additionalData - Additional data to update
   * @returns {Promise<Object>} Operation result
   */
  async updateSubscriptionStatus(subscriptionCode, status, additionalData = {}) {
    try {
      const updateData = {
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...additionalData
      };

      // Convert dates to Firestore timestamps
      if (additionalData.nextPaymentDate) {
        updateData.nextPaymentDate = admin.firestore.Timestamp.fromDate(new Date(additionalData.nextPaymentDate));
      }
      if (additionalData.cancelledAt) {
        updateData.cancelledAt = admin.firestore.Timestamp.fromDate(new Date(additionalData.cancelledAt));
      }
      if (additionalData.endDate) {
        updateData.endDate = admin.firestore.Timestamp.fromDate(new Date(additionalData.endDate));
      }

      await this.subscriptionsCollection.doc(subscriptionCode).update(updateData);

      return {
        success: true,
        message: 'Subscription status updated successfully'
      };
    } catch (error) {
      console.error('Error updating subscription status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create or update a subscription plan
   * @param {Object} planData - Plan data
   * @returns {Promise<Object>} Operation result
   */
  async createOrUpdatePlan(planData) {
    try {
      const {
        planCode,
        name,
        description,
        amount,
        currency,
        interval,
        features = [],
        isActive = true
      } = planData;

      const planDoc = {
        planCode,
        name,
        description,
        amount,
        currency,
        interval,
        features,
        isActive,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await this.plansCollection.doc(planCode).set(planDoc, { merge: true });

      return {
        success: true,
        planId: planCode,
        message: 'Plan saved successfully'
      };
    } catch (error) {
      console.error('Error saving plan:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all active subscription plans
   * @returns {Promise<Object>} Active plans
   */
  async getActivePlans() {
    try {
      const snapshot = await this.plansCollection
        .where('isActive', '==', true)
        .orderBy('amount', 'asc')
        .get();

      const plans = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        plans.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        });
      });

      return {
        success: true,
        data: plans
      };
    } catch (error) {
      console.error('Error fetching active plans:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Log a transaction
   * @param {Object} transactionData - Transaction data
   * @returns {Promise<Object>} Operation result
   */
  async logTransaction(transactionData) {
    try {
      const {
        reference,
        subscriptionCode,
        userId,
        amount,
        currency,
        status,
        channel,
        gatewayResponse,
        paidAt,
        metadata = {}
      } = transactionData;

      const transactionDoc = {
        reference,
        subscriptionCode,
        userId,
        amount,
        currency,
        status,
        channel,
        gatewayResponse,
        paidAt: paidAt ? admin.firestore.Timestamp.fromDate(new Date(paidAt)) : null,
        metadata,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await this.transactionsCollection.doc(reference).set(transactionDoc);

      return {
        success: true,
        transactionId: reference,
        message: 'Transaction logged successfully'
      };
    } catch (error) {
      console.error('Error logging transaction:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get transactions for a subscription
   * @param {string} subscriptionCode - Subscription code
   * @param {number} limit - Number of transactions to fetch
   * @returns {Promise<Object>} Subscription transactions
   */
  async getSubscriptionTransactions(subscriptionCode, limit = 50) {
    try {
      const snapshot = await this.transactionsCollection
        .where('subscriptionCode', '==', subscriptionCode)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const transactions = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        transactions.push({
          ...data,
          id: doc.id,
          paidAt: data.paidAt?.toDate(),
          createdAt: data.createdAt?.toDate()
        });
      });

      return {
        success: true,
        data: transactions
      };
    } catch (error) {
      console.error('Error fetching subscription transactions:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Log webhook event
   * @param {Object} webhookData - Webhook data
   * @returns {Promise<Object>} Operation result
   */
  async logWebhookEvent(webhookData) {
    try {
      const {
        eventType,
        eventId,
        subscriptionCode,
        processed,
        processingResult,
        rawPayload,
        signature
      } = webhookData;

      const webhookDoc = {
        eventType,
        eventId,
        subscriptionCode,
        processed,
        processingResult,
        rawPayload,
        signature,
        receivedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await this.webhookLogsCollection.add(webhookDoc);

      return {
        success: true,
        webhookLogId: docRef.id,
        message: 'Webhook event logged successfully'
      };
    } catch (error) {
      console.error('Error logging webhook event:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get subscription analytics
   * @param {Object} filters - Analytics filters
   * @returns {Promise<Object>} Analytics data
   */
  async getSubscriptionAnalytics(filters = {}) {
    try {
      const { startDate, endDate, planCode } = filters;
      
      let query = this.subscriptionsCollection;
      
      if (startDate) {
        query = query.where('createdAt', '>=', admin.firestore.Timestamp.fromDate(new Date(startDate)));
      }
      
      if (endDate) {
        query = query.where('createdAt', '<=', admin.firestore.Timestamp.fromDate(new Date(endDate)));
      }
      
      if (planCode) {
        query = query.where('planCode', '==', planCode);
      }

      const snapshot = await query.get();
      
      const analytics = {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        cancelledSubscriptions: 0,
        totalRevenue: 0,
        planBreakdown: {},
        statusBreakdown: {}
      };

      snapshot.forEach(doc => {
        const data = doc.data();
        analytics.totalSubscriptions++;
        
        // Status breakdown
        analytics.statusBreakdown[data.status] = (analytics.statusBreakdown[data.status] || 0) + 1;
        
        if (data.status === 'active') {
          analytics.activeSubscriptions++;
          analytics.totalRevenue += data.amount || 0;
        } else if (data.status === 'cancelled') {
          analytics.cancelledSubscriptions++;
        }
        
        // Plan breakdown
        analytics.planBreakdown[data.planCode] = (analytics.planBreakdown[data.planCode] || 0) + 1;
      });

      return {
        success: true,
        data: analytics
      };
    } catch (error) {
      console.error('Error fetching subscription analytics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get subscriptions expiring soon
   * @param {number} days - Number of days to look ahead
   * @returns {Promise<Object>} Expiring subscriptions
   */
  async getExpiringSubscriptions(days = 7) {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const snapshot = await this.subscriptionsCollection
        .where('status', '==', 'active')
        .where('nextPaymentDate', '<=', admin.firestore.Timestamp.fromDate(futureDate))
        .orderBy('nextPaymentDate', 'asc')
        .get();

      const subscriptions = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        subscriptions.push({
          ...data,
          id: doc.id,
          startDate: data.startDate?.toDate(),
          nextPaymentDate: data.nextPaymentDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        });
      });

      return {
        success: true,
        data: subscriptions
      };
    } catch (error) {
      console.error('Error fetching expiring subscriptions:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = SubscriptionDatabaseService;
