import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import subscriptionService from '../../services/subscriptionService';
import { SUBSCRIPTION_PLANS, formatPrice } from '../../config/subscriptionPlans';
import { Check, Star, CreditCard, Shield, Zap } from 'lucide-react';
import PaystackScript from './PaystackScript';
import { initializePaystackPayment, validatePaystackConfig } from '../../config/paystack';

/**
 * Subscription Checkout Component
 * Handles plan selection and payment processing with Paystack
 */
const SubscriptionCheckout = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [paystackLoaded, setPaystackLoaded] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: user?.email || '',
    firstName: '',
    lastName: '',
    phone: ''
  });

  /**
   * Handle form input changes
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Validate form data
   */
  const validateForm = () => {
    if (!formData.email) {
      setError('Email is required');
      return false;
    }
    if (!formData.firstName) {
      setError('First name is required');
      return false;
    }
    if (!formData.lastName) {
      setError('Last name is required');
      return false;
    }
    if (!formData.phone) {
      setError('Phone number is required');
      return false;
    }
    return true;
  };

  /**
   * Initialize subscription with Paystack
   */
  const handleSubscribe = async () => {
    try {
      setError(null);
      setIsLoading(true);

      if (!validateForm()) {
        setIsLoading(false);
        return;
      }

      const plan = SUBSCRIPTION_PLANS[selectedPlan];
      
      // Initialize subscription
      const result = await subscriptionService.initializeSubscription({
        planType: selectedPlan,
        email: formData.email,
        metadata: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone
        }
      });

      if (result.success) {
        setPaymentData(result.subscription);
        
        // Validate Paystack configuration
        if (!validatePaystackConfig()) {
          setError('Payment system not properly configured. Please contact support.');
          return;
        }
        
        // Open Paystack payment modal
        const handler = initializePaystackPayment({
          email: formData.email,
          amount: plan.priceInKobo,
          reference: result.subscription.subscriptionCode,
          callback: function(response) {
            handlePaymentSuccess(response);
          },
          onClose: function() {
            handlePaymentClose();
          },
          metadata: {
            subscription_code: result.subscription.subscriptionCode,
            plan_type: selectedPlan,
            user_id: user?.uid
          }
        });
        handler.openIframe();
      }

    } catch (error) {
      console.error('Subscription initialization error:', error);
      setError(error.message || 'Failed to initialize subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle successful payment
   */
  const handlePaymentSuccess = async (response) => {
    try {
      setIsLoading(true);
      setError(null);

      // Verify transaction
      const verificationResult = await subscriptionService.verifyTransaction(response.reference);
      
      if (verificationResult.success) {
        setSuccess(true);
        if (onSuccess) {
          onSuccess(verificationResult.subscription);
        }
      } else {
        setError('Payment verification failed. Please contact support.');
      }

    } catch (error) {
      console.error('Payment verification error:', error);
      setError('Payment verification failed. Please contact support.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle payment modal close
   */
  const handlePaymentClose = () => {
    if (!success) {
      setError('Payment was cancelled. Please try again.');
    }
  };

  /**
   * Handle plan selection
   */
  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
    setError(null);
  };

  if (success) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            Subscription Successful!
          </h2>
          <p className="text-green-700 mb-6">
            Thank you for subscribing to {SUBSCRIPTION_PLANS[selectedPlan].name}. 
            You now have access to all premium features.
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <PaystackScript onLoad={() => setPaystackLoaded(true)} />
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Choose Your Subscription Plan
        </h1>
        <p className="text-gray-600">
          Unlock premium features and accelerate your learning journey
        </p>
      </div>

      {/* Plan Selection */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {Object.entries(SUBSCRIPTION_PLANS).map(([planId, plan]) => (
          <div
            key={planId}
            className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all ${
              selectedPlan === planId
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handlePlanSelect(planId)}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                  <Star className="w-4 h-4 mr-1" />
                  Most Popular
                </span>
              </div>
            )}

            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(plan.priceInKobo)}
                </span>
                <span className="text-gray-600">/{plan.interval}</span>
              </div>
              {plan.savings && (
                <div className="text-green-600 text-sm font-semibold mb-4">
                  Save {plan.savings}
                </div>
              )}
              <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
            </div>

            <ul className="space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Payment Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Information</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+234 801 234 5678"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="John"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Doe"
              required
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">
              {SUBSCRIPTION_PLANS[selectedPlan].name}
            </span>
            <span className="font-semibold text-gray-900">
              {formatPrice(SUBSCRIPTION_PLANS[selectedPlan].priceInKobo)}
            </span>
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-center justify-center mb-6 text-sm text-gray-600">
          <Shield className="w-4 h-4 mr-2" />
          Your payment is secured by Paystack's SSL encryption
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleSubscribe}
            disabled={isLoading || !paystackLoaded}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : !paystackLoaded ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Loading Payment...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Subscribe Now - {formatPrice(SUBSCRIPTION_PLANS[selectedPlan].priceInKobo)}
              </>
            )}
          </button>
          
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCheckout;
