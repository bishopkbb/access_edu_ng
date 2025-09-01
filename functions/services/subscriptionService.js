const crypto = require('crypto');
const axios = require('axios');

/**
 * Subscription Service for Paystack Integration
 * Handles subscription creation, verification, and management
 */
class SubscriptionService {
  constructor() {
    this.paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    this.paystackPublicKey = process.env.PAYSTACK_PUBLIC_KEY;
    this.webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;
    this.baseURL = 'https://api.paystack.co';
    
    if (!this.paystackSecretKey) {
      console.warn('PAYSTACK_SECRET_KEY not found in environment variables');
    }
  }

  /**
   * Initialize a subscription transaction with Paystack
   * @param {Object} subscriptionData - Subscription details
   * @returns {Promise<Object>} Paystack initialization response
   */
  async initializeSubscription(subscriptionData) {
    try {
      const { email, planCode, amount, metadata = {} } = subscriptionData;
      
      const payload = {
        email,
        plan: planCode,
        amount: amount * 100, // Convert to kobo
        currency: 'NGN',
        metadata: {
          ...metadata,
          subscription_type: 'recurring',
          created_at: new Date().toISOString()
        },
        callback_url: process.env.FRONTEND_URL + '/subscription/callback',
        channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer']
      };

      const response = await axios.post(
        `${this.baseURL}/transaction/initialize`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data.data,
        reference: response.data.data.reference
      };
    } catch (error) {
      console.error('Error initializing subscription:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to initialize subscription'
      };
    }
  }

  /**
   * Verify a transaction with Paystack
   * @param {string} reference - Transaction reference
   * @returns {Promise<Object>} Verification result
   */
  async verifyTransaction(reference) {
    try {
      const response = await axios.get(
        `${this.baseURL}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`
          }
        }
      );

      const transaction = response.data.data;
      
      return {
        success: true,
        data: {
          status: transaction.status,
          reference: transaction.reference,
          amount: transaction.amount / 100, // Convert from kobo
          currency: transaction.currency,
          customer: transaction.customer,
          plan: transaction.plan,
          subscription: transaction.subscription,
          paid_at: transaction.paid_at,
          metadata: transaction.metadata
        }
      };
    } catch (error) {
      console.error('Error verifying transaction:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to verify transaction'
      };
    }
  }

  /**
   * Create a subscription plan on Paystack
   * @param {Object} planData - Plan details
   * @returns {Promise<Object>} Plan creation result
   */
  async createPlan(planData) {
    try {
      const { name, amount, interval, description, currency = 'NGN' } = planData;
      
      const payload = {
        name,
        amount: amount * 100, // Convert to kobo
        interval,
        description,
        currency,
        send_invoices: true,
        send_sms: true,
        hosted_page: false
      };

      const response = await axios.post(
        `${this.baseURL}/plan`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error creating plan:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create plan'
      };
    }
  }

  /**
   * Get all subscription plans
   * @returns {Promise<Object>} Plans list
   */
  async getPlans() {
    try {
      const response = await axios.get(
        `${this.baseURL}/plan`,
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`
          }
        }
      );

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching plans:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch plans'
      };
    }
  }

  /**
   * Get subscription details
   * @param {string} subscriptionCode - Subscription code
   * @returns {Promise<Object>} Subscription details
   */
  async getSubscription(subscriptionCode) {
    try {
      const response = await axios.get(
        `${this.baseURL}/subscription/${subscriptionCode}`,
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`
          }
        }
      );

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching subscription:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch subscription'
      };
    }
  }

  /**
   * Cancel a subscription
   * @param {string} subscriptionCode - Subscription code
   * @param {string} token - Email token for cancellation
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelSubscription(subscriptionCode, token) {
    try {
      const response = await axios.post(
        `${this.baseURL}/subscription/disable`,
        {
          code: subscriptionCode,
          token
        },
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error cancelling subscription:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to cancel subscription'
      };
    }
  }

  /**
   * Enable a subscription
   * @param {string} subscriptionCode - Subscription code
   * @param {string} token - Email token for enabling
   * @returns {Promise<Object>} Enable result
   */
  async enableSubscription(subscriptionCode, token) {
    try {
      const response = await axios.post(
        `${this.baseURL}/subscription/enable`,
        {
          code: subscriptionCode,
          token
        },
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error enabling subscription:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to enable subscription'
      };
    }
  }

  /**
   * Verify webhook signature
   * @param {string} payload - Webhook payload
   * @param {string} signature - Paystack signature
   * @returns {boolean} Verification result
   */
  verifyWebhookSignature(payload, signature) {
    try {
      const hash = crypto
        .createHmac('sha512', this.webhookSecret)
        .update(payload, 'utf-8')
        .digest('hex');
      
      return hash === signature;
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Process webhook event
   * @param {Object} event - Webhook event data
   * @returns {Object} Processing result
   */
  processWebhookEvent(event) {
    try {
      const { event: eventType, data } = event;
      
      const result = {
        eventType,
        processed: true,
        timestamp: new Date().toISOString(),
        data: {}
      };

      switch (eventType) {
        case 'subscription.create':
          result.data = {
            subscriptionCode: data.subscription_code,
            customerCode: data.customer.customer_code,
            planCode: data.plan.plan_code,
            status: data.status,
            amount: data.amount / 100,
            nextPaymentDate: data.next_payment_date
          };
          break;

        case 'subscription.disable':
          result.data = {
            subscriptionCode: data.subscription_code,
            status: 'cancelled',
            cancelledAt: new Date().toISOString()
          };
          break;

        case 'subscription.enable':
          result.data = {
            subscriptionCode: data.subscription_code,
            status: 'active',
            enabledAt: new Date().toISOString()
          };
          break;

        case 'invoice.create':
        case 'invoice.update':
          result.data = {
            subscriptionCode: data.subscription.subscription_code,
            invoiceCode: data.invoice_code,
            amount: data.amount / 100,
            status: data.status,
            dueDate: data.due_date
          };
          break;

        case 'invoice.payment_failed':
          result.data = {
            subscriptionCode: data.subscription.subscription_code,
            invoiceCode: data.invoice_code,
            amount: data.amount / 100,
            failureReason: data.gateway_response,
            nextRetryDate: data.next_payment_date
          };
          break;

        case 'charge.success':
          if (data.plan) {
            result.data = {
              subscriptionCode: data.plan.subscription_code,
              amount: data.amount / 100,
              reference: data.reference,
              paidAt: data.paid_at,
              channel: data.channel
            };
          }
          break;

        default:
          result.processed = false;
          result.reason = `Unhandled event type: ${eventType}`;
      }

      return result;
    } catch (error) {
      console.error('Error processing webhook event:', error);
      return {
        processed: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get customer subscriptions
   * @param {string} customerCode - Customer code
   * @returns {Promise<Object>} Customer subscriptions
   */
  async getCustomerSubscriptions(customerCode) {
    try {
      const response = await axios.get(
        `${this.baseURL}/customer/${customerCode}/subscription`,
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`
          }
        }
      );

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching customer subscriptions:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch customer subscriptions'
      };
    }
  }
}

module.exports = SubscriptionService;
