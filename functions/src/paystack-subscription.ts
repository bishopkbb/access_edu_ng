import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import * as crypto from 'crypto';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Paystack configuration
const PAYSTACK_SECRET_KEY = functions.config().paystack?.secret_key || process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = functions.config().paystack?.public_key || process.env.PAYSTACK_PUBLIC_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Subscription plans configuration
const SUBSCRIPTION_PLANS = {
  monthly: {
    name: 'Monthly Plan',
    amount: 5000, // Amount in kobo (₦50.00)
    interval: 'monthly',
    duration: 30, // days
  },
  yearly: {
    name: 'Yearly Plan',
    amount: 50000, // Amount in kobo (₦500.00)
    interval: 'yearly',
    duration: 365, // days
  },
  premium: {
    name: 'Premium Plan',
    amount: 10000, // Amount in kobo (₦100.00)
    interval: 'monthly',
    duration: 30, // days
  }
};

/**
 * Initialize a subscription with Paystack
 * Creates a subscription plan and initializes payment
 */
export const initializeSubscription = functions.https.onCall(async (data, context) => {
  try {
    // Verify user authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { planType, email, metadata = {} } = data;
    const userId = context.auth.uid;

    // Validate plan type
    if (!SUBSCRIPTION_PLANS[planType]) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid plan type');
    }

    const plan = SUBSCRIPTION_PLANS[planType];

    // Create or get customer
    let customer;
    try {
      const customerResponse = await axios.post(
        `${PAYSTACK_BASE_URL}/customer`,
        {
          email,
          first_name: metadata.firstName || '',
          last_name: metadata.lastName || '',
          metadata: {
            userId,
            ...metadata
          }
        },
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      customer = customerResponse.data.data;
    } catch (error) {
      // If customer already exists, fetch existing customer
      if (error.response?.status === 422) {
        const customersResponse = await axios.get(
          `${PAYSTACK_BASE_URL}/customer?email=${encodeURIComponent(email)}`,
          {
            headers: {
              Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
            }
          }
        );
        customer = customersResponse.data.data[0];
      } else {
        throw error;
      }
    }

    // Create subscription plan
    const planResponse = await axios.post(
      `${PAYSTACK_BASE_URL}/plan`,
      {
        name: plan.name,
        amount: plan.amount,
        interval: plan.interval,
        duration: plan.duration,
        currency: 'NGN',
        invoice_limit: 1
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const paystackPlan = planResponse.data.data;

    // Initialize subscription
    const subscriptionResponse = await axios.post(
      `${PAYSTACK_BASE_URL}/subscription`,
      {
        customer: customer.customer_code,
        plan: paystackPlan.plan_code,
        start_date: new Date().toISOString(),
        metadata: {
          userId,
          planType,
          ...metadata
        }
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const subscription = subscriptionResponse.data.data;

    // Store subscription data in Firestore
    await db.collection('subscriptions').doc(subscription.subscription_code).set({
      userId,
      planType,
      paystackSubscriptionCode: subscription.subscription_code,
      paystackCustomerCode: customer.customer_code,
      paystackPlanCode: paystackPlan.plan_code,
      status: subscription.status,
      amount: plan.amount,
      currency: 'NGN',
      interval: plan.interval,
      startDate: admin.firestore.FieldValue.serverTimestamp(),
      endDate: null, // Will be set when subscription is active
      metadata,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Log the subscription initialization
    await db.collection('payment_logs').add({
      userId,
      action: 'subscription_initialized',
      subscriptionCode: subscription.subscription_code,
      planType,
      amount: plan.amount,
      status: subscription.status,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      subscription: {
        subscriptionCode: subscription.subscription_code,
        authorizationUrl: subscription.authorization_url,
        status: subscription.status,
        plan: plan.name,
        amount: plan.amount
      }
    };

  } catch (error) {
    console.error('Error initializing subscription:', error);
    
    // Log error
    if (context.auth) {
      await db.collection('payment_logs').add({
        userId: context.auth.uid,
        action: 'subscription_initialization_failed',
        error: error.message,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    throw new functions.https.HttpsError('internal', 'Failed to initialize subscription');
  }
});

/**
 * Verify transaction and update subscription status
 */
export const verifyTransaction = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { reference } = data;
    const userId = context.auth.uid;

    // Verify transaction with Paystack
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const transaction = response.data.data;

    if (transaction.status === 'success') {
      // Update subscription status
      const subscriptionRef = db.collection('subscriptions').doc(transaction.metadata.subscription_code);
      const subscriptionDoc = await subscriptionRef.get();

      if (subscriptionDoc.exists) {
        const subscriptionData = subscriptionDoc.data();
        const plan = SUBSCRIPTION_PLANS[subscriptionData.planType];

        // Calculate end date
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.duration);

        await subscriptionRef.update({
          status: 'active',
          startDate: admin.firestore.FieldValue.serverTimestamp(),
          endDate: admin.firestore.Timestamp.fromDate(endDate),
          lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update user subscription status
        await db.collection('users').doc(userId).update({
          subscriptionStatus: 'active',
          subscriptionPlan: subscriptionData.planType,
          subscriptionEndDate: admin.firestore.Timestamp.fromDate(endDate),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Log successful payment
        await db.collection('payment_logs').add({
          userId,
          action: 'payment_successful',
          transactionReference: reference,
          subscriptionCode: transaction.metadata.subscription_code,
          amount: transaction.amount,
          status: 'success',
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        return {
          success: true,
          message: 'Payment verified successfully',
          subscription: {
            status: 'active',
            plan: plan.name,
            endDate: endDate.toISOString()
          }
        };
      }
    }

    throw new functions.https.HttpsError('failed-precondition', 'Transaction verification failed');

  } catch (error) {
    console.error('Error verifying transaction:', error);
    
    if (context.auth) {
      await db.collection('payment_logs').add({
        userId: context.auth.uid,
        action: 'transaction_verification_failed',
        error: error.message,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    throw new functions.https.HttpsError('internal', 'Failed to verify transaction');
  }
});

/**
 * Handle Paystack webhook events
 */
export const paystackWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    const body = req.body;

    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(body))
      .digest('hex');

    if (hash !== signature) {
      console.error('Invalid webhook signature');
      return res.status(400).send('Invalid signature');
    }

    const event = body.event;
    const data = body.data;

    console.log('Received webhook event:', event);

    switch (event) {
      case 'subscription.create':
        await handleSubscriptionCreate(data);
        break;
      
      case 'subscription.enable':
        await handleSubscriptionEnable(data);
        break;
      
      case 'subscription.disable':
        await handleSubscriptionDisable(data);
        break;
      
      case 'charge.success':
        await handleChargeSuccess(data);
        break;
      
      case 'charge.failed':
        await handleChargeFailed(data);
        break;
      
      default:
        console.log('Unhandled webhook event:', event);
    }

    res.status(200).send('Webhook processed successfully');

  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Webhook processing failed');
  }
});

/**
 * Handle subscription creation webhook
 */
async function handleSubscriptionCreate(data: any) {
  const subscriptionCode = data.subscription_code;
  const subscriptionRef = db.collection('subscriptions').doc(subscriptionCode);
  
  await subscriptionRef.update({
    status: data.status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log(`Subscription ${subscriptionCode} created with status: ${data.status}`);
}

/**
 * Handle subscription enable webhook
 */
async function handleSubscriptionEnable(data: any) {
  const subscriptionCode = data.subscription_code;
  const subscriptionRef = db.collection('subscriptions').doc(subscriptionCode);
  const subscriptionDoc = await subscriptionRef.get();

  if (subscriptionDoc.exists) {
    const subscriptionData = subscriptionDoc.data();
    const plan = SUBSCRIPTION_PLANS[subscriptionData.planType];

    // Calculate end date
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration);

    await subscriptionRef.update({
      status: 'active',
      endDate: admin.firestore.Timestamp.fromDate(endDate),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update user subscription status
    await db.collection('users').doc(subscriptionData.userId).update({
      subscriptionStatus: 'active',
      subscriptionPlan: subscriptionData.planType,
      subscriptionEndDate: admin.firestore.Timestamp.fromDate(endDate),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Subscription ${subscriptionCode} enabled`);
  }
}

/**
 * Handle subscription disable webhook
 */
async function handleSubscriptionDisable(data: any) {
  const subscriptionCode = data.subscription_code;
  const subscriptionRef = db.collection('subscriptions').doc(subscriptionCode);
  const subscriptionDoc = await subscriptionRef.get();

  if (subscriptionDoc.exists) {
    const subscriptionData = subscriptionDoc.data();

    await subscriptionRef.update({
      status: 'inactive',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update user subscription status
    await db.collection('users').doc(subscriptionData.userId).update({
      subscriptionStatus: 'inactive',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Subscription ${subscriptionCode} disabled`);
  }
}

/**
 * Handle successful charge webhook
 */
async function handleChargeSuccess(data: any) {
  const subscriptionCode = data.subscription?.subscription_code;
  
  if (subscriptionCode) {
    const subscriptionRef = db.collection('subscriptions').doc(subscriptionCode);
    const subscriptionDoc = await subscriptionRef.get();

    if (subscriptionDoc.exists) {
      const subscriptionData = subscriptionDoc.data();
      const plan = SUBSCRIPTION_PLANS[subscriptionData.planType];

      // Extend subscription end date
      const currentEndDate = subscriptionData.endDate?.toDate() || new Date();
      const newEndDate = new Date(currentEndDate);
      newEndDate.setDate(newEndDate.getDate() + plan.duration);

      await subscriptionRef.update({
        status: 'active',
        endDate: admin.firestore.Timestamp.fromDate(newEndDate),
        lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update user subscription
      await db.collection('users').doc(subscriptionData.userId).update({
        subscriptionStatus: 'active',
        subscriptionEndDate: admin.firestore.Timestamp.fromDate(newEndDate),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Log successful renewal
      await db.collection('payment_logs').add({
        userId: subscriptionData.userId,
        action: 'subscription_renewed',
        subscriptionCode,
        amount: data.amount,
        status: 'success',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`Subscription ${subscriptionCode} renewed successfully`);
    }
  }
}

/**
 * Handle failed charge webhook
 */
async function handleChargeFailed(data: any) {
  const subscriptionCode = data.subscription?.subscription_code;
  
  if (subscriptionCode) {
    // Log failed payment
    const subscriptionRef = db.collection('subscriptions').doc(subscriptionCode);
    const subscriptionDoc = await subscriptionRef.get();

    if (subscriptionDoc.exists) {
      const subscriptionData = subscriptionDoc.data();

      await db.collection('payment_logs').add({
        userId: subscriptionData.userId,
        action: 'payment_failed',
        subscriptionCode,
        amount: data.amount,
        status: 'failed',
        reason: data.gateway_response,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`Payment failed for subscription ${subscriptionCode}`);
    }
  }
}

/**
 * Get user subscription status
 */
export const getUserSubscription = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return {
        hasSubscription: false,
        subscription: null
      };
    }

    const userData = userDoc.data();
    const hasSubscription = userData.subscriptionStatus === 'active';
    const subscriptionEndDate = userData.subscriptionEndDate?.toDate();

    return {
      hasSubscription,
      subscription: hasSubscription ? {
        plan: userData.subscriptionPlan,
        status: userData.subscriptionStatus,
        endDate: subscriptionEndDate?.toISOString(),
        isExpired: subscriptionEndDate ? new Date() > subscriptionEndDate : false
      } : null
    };

  } catch (error) {
    console.error('Error getting user subscription:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get subscription status');
  }
});

/**
 * Cancel user subscription
 */
export const cancelSubscription = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;
    
    // Find user's active subscription
    const subscriptionQuery = await db.collection('subscriptions')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (subscriptionQuery.empty) {
      throw new functions.https.HttpsError('not-found', 'No active subscription found');
    }

    const subscriptionDoc = subscriptionQuery.docs[0];
    const subscriptionData = subscriptionDoc.data();

    // Disable subscription in Paystack
    await axios.post(
      `${PAYSTACK_BASE_URL}/subscription/disable`,
      {
        code: subscriptionData.paystackSubscriptionCode,
        token: subscriptionData.paystackSubscriptionCode
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Update subscription status in Firestore
    await subscriptionDoc.ref.update({
      status: 'cancelled',
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update user subscription status
    await db.collection('users').doc(userId).update({
      subscriptionStatus: 'cancelled',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Log cancellation
    await db.collection('payment_logs').add({
      userId,
      action: 'subscription_cancelled',
      subscriptionCode: subscriptionData.paystackSubscriptionCode,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      message: 'Subscription cancelled successfully'
    };

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw new functions.https.HttpsError('internal', 'Failed to cancel subscription');
  }
});
