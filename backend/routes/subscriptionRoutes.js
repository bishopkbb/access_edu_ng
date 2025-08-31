const express = require('express');
const SubscriptionService = require('../services/subscriptionService');
const SubscriptionDatabaseService = require('../services/subscriptionDatabaseService');

const router = express.Router();
const subscriptionService = new SubscriptionService();
const dbService = new SubscriptionDatabaseService();

/**
 * Initialize a new subscription
 * POST /api/subscriptions/initialize
 */
router.post('/initialize', async (req, res) => {
  try {
    const { email, planCode, userId, metadata = {} } = req.body;

    // Validate required fields
    if (!email || !planCode || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Email, planCode, and userId are required'
      });
    }

    // Get plan details from database
    const planResult = await dbService.getActivePlans();
    if (!planResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch subscription plans'
      });
    }

    const plan = planResult.data.find(p => p.planCode === planCode);
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Subscription plan not found'
      });
    }

    // Initialize subscription with Paystack
    const initResult = await subscriptionService.initializeSubscription({
      email,
      planCode,
      amount: plan.amount,
      metadata: {
        ...metadata,
        userId,
        planName: plan.name
      }
    });

    if (!initResult.success) {
      return res.status(400).json(initResult);
    }

    res.json({
      success: true,
      data: {
        authorization_url: initResult.data.authorization_url,
        access_code: initResult.data.access_code,
        reference: initResult.data.reference,
        plan: {
          code: plan.planCode,
          name: plan.name,
          amount: plan.amount,
          interval: plan.interval
        }
      }
    });

  } catch (error) {
    console.error('Error initializing subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Verify a subscription transaction
 * POST /api/subscriptions/verify
 */
router.post('/verify', async (req, res) => {
  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({
        success: false,
        error: 'Transaction reference is required'
      });
    }

    // Verify transaction with Paystack
    const verifyResult = await subscriptionService.verifyTransaction(reference);
    
    if (!verifyResult.success) {
      return res.status(400).json(verifyResult);
    }

    const transaction = verifyResult.data;

    // If transaction is successful, save subscription to database
    if (transaction.status === 'success') {
      const subscriptionData = {
        userId: transaction.metadata?.userId,
        email: transaction.customer.email,
        subscriptionCode: transaction.subscription?.subscription_code,
        customerCode: transaction.customer.customer_code,
        planCode: transaction.plan?.plan_code,
        planName: transaction.metadata?.planName,
        amount: transaction.amount,
        currency: transaction.currency,
        status: 'active',
        startDate: transaction.paid_at,
        nextPaymentDate: transaction.subscription?.next_payment_date,
        metadata: transaction.metadata
      };

      // Save subscription to database
      const saveResult = await dbService.createOrUpdateSubscription(subscriptionData);
      
      if (!saveResult.success) {
        console.error('Failed to save subscription:', saveResult.error);
      }

      // Log transaction
      await dbService.logTransaction({
        reference: transaction.reference,
        subscriptionCode: transaction.subscription?.subscription_code,
        userId: transaction.metadata?.userId,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        channel: transaction.channel,
        gatewayResponse: transaction.gateway_response,
        paidAt: transaction.paid_at,
        metadata: transaction.metadata
      });
    }

    res.json({
      success: true,
      data: {
        status: transaction.status,
        reference: transaction.reference,
        amount: transaction.amount,
        currency: transaction.currency,
        subscription: transaction.subscription,
        customer: transaction.customer,
        paid_at: transaction.paid_at
      }
    });

  } catch (error) {
    console.error('Error verifying subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get user subscriptions
 * GET /api/subscriptions/user/:userId
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const result = await dbService.getUserSubscriptions(userId);
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get subscription details
 * GET /api/subscriptions/:subscriptionCode
 */
router.get('/:subscriptionCode', async (req, res) => {
  try {
    const { subscriptionCode } = req.params;

    if (!subscriptionCode) {
      return res.status(400).json({
        success: false,
        error: 'Subscription code is required'
      });
    }

    // Get subscription from database
    const dbResult = await dbService.getSubscription(subscriptionCode);
    
    if (!dbResult.success) {
      return res.status(404).json(dbResult);
    }

    // Get latest subscription details from Paystack
    const paystackResult = await subscriptionService.getSubscription(subscriptionCode);
    
    let combinedData = dbResult.data;
    
    if (paystackResult.success) {
      // Merge database data with Paystack data
      combinedData = {
        ...dbResult.data,
        paystackData: paystackResult.data,
        lastSyncedAt: new Date().toISOString()
      };

      // Update database if status has changed
      if (paystackResult.data.status !== dbResult.data.status) {
        await dbService.updateSubscriptionStatus(
          subscriptionCode,
          paystackResult.data.status,
          {
            nextPaymentDate: paystackResult.data.next_payment_date
          }
        );
      }
    }

    res.json({
      success: true,
      data: combinedData
    });

  } catch (error) {
    console.error('Error fetching subscription details:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Cancel a subscription
 * POST /api/subscriptions/:subscriptionCode/cancel
 */
router.post('/:subscriptionCode/cancel', async (req, res) => {
  try {
    const { subscriptionCode } = req.params;
    const { token } = req.body;

    if (!subscriptionCode) {
      return res.status(400).json({
        success: false,
        error: 'Subscription code is required'
      });
    }

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Email token is required for cancellation'
      });
    }

    // Cancel subscription with Paystack
    const cancelResult = await subscriptionService.cancelSubscription(subscriptionCode, token);
    
    if (!cancelResult.success) {
      return res.status(400).json(cancelResult);
    }

    // Update subscription status in database
    const updateResult = await dbService.updateSubscriptionStatus(
      subscriptionCode,
      'cancelled',
      {
        cancelledAt: new Date().toISOString()
      }
    );

    if (!updateResult.success) {
      console.error('Failed to update subscription status:', updateResult.error);
    }

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: cancelResult.data
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Reactivate a subscription
 * POST /api/subscriptions/:subscriptionCode/reactivate
 */
router.post('/:subscriptionCode/reactivate', async (req, res) => {
  try {
    const { subscriptionCode } = req.params;
    const { token } = req.body;

    if (!subscriptionCode) {
      return res.status(400).json({
        success: false,
        error: 'Subscription code is required'
      });
    }

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Email token is required for reactivation'
      });
    }

    // Enable subscription with Paystack
    const enableResult = await subscriptionService.enableSubscription(subscriptionCode, token);
    
    if (!enableResult.success) {
      return res.status(400).json(enableResult);
    }

    // Update subscription status in database
    const updateResult = await dbService.updateSubscriptionStatus(
      subscriptionCode,
      'active',
      {
        reactivatedAt: new Date().toISOString()
      }
    );

    if (!updateResult.success) {
      console.error('Failed to update subscription status:', updateResult.error);
    }

    res.json({
      success: true,
      message: 'Subscription reactivated successfully',
      data: enableResult.data
    });

  } catch (error) {
    console.error('Error reactivating subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get subscription transactions
 * GET /api/subscriptions/:subscriptionCode/transactions
 */
router.get('/:subscriptionCode/transactions', async (req, res) => {
  try {
    const { subscriptionCode } = req.params;
    const { limit = 50 } = req.query;

    if (!subscriptionCode) {
      return res.status(400).json({
        success: false,
        error: 'Subscription code is required'
      });
    }

    const result = await dbService.getSubscriptionTransactions(subscriptionCode, parseInt(limit));
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Error fetching subscription transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get all subscription plans
 * GET /api/subscriptions/plans/all
 */
router.get('/plans/all', async (req, res) => {
  try {
    const result = await dbService.getActivePlans();
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Create a new subscription plan
 * POST /api/subscriptions/plans
 */
router.post('/plans', async (req, res) => {
  try {
    const { name, amount, interval, description, features = [] } = req.body;

    // Validate required fields
    if (!name || !amount || !interval || !description) {
      return res.status(400).json({
        success: false,
        error: 'Name, amount, interval, and description are required'
      });
    }

    // Create plan with Paystack
    const paystackResult = await subscriptionService.createPlan({
      name,
      amount,
      interval,
      description
    });

    if (!paystackResult.success) {
      return res.status(400).json(paystackResult);
    }

    // Save plan to database
    const dbResult = await dbService.createOrUpdatePlan({
      planCode: paystackResult.data.plan_code,
      name,
      description,
      amount,
      currency: 'NGN',
      interval,
      features,
      isActive: true
    });

    if (!dbResult.success) {
      console.error('Failed to save plan to database:', dbResult.error);
    }

    res.json({
      success: true,
      data: {
        planCode: paystackResult.data.plan_code,
        name,
        description,
        amount,
        interval,
        features,
        paystackData: paystackResult.data
      }
    });

  } catch (error) {
    console.error('Error creating subscription plan:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get subscription analytics
 * GET /api/subscriptions/analytics/overview
 */
router.get('/analytics/overview', async (req, res) => {
  try {
    const { startDate, endDate, planCode } = req.query;

    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (planCode) filters.planCode = planCode;

    const result = await dbService.getSubscriptionAnalytics(filters);
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Error fetching subscription analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get subscriptions expiring soon
 * GET /api/subscriptions/analytics/expiring
 */
router.get('/analytics/expiring', async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const result = await dbService.getExpiringSubscriptions(parseInt(days));
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Error fetching expiring subscriptions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
