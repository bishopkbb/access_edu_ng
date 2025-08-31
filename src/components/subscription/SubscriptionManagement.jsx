import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import subscriptionService from '../../services/subscriptionService';
import { SUBSCRIPTION_PLANS, formatPrice } from '../../config/subscriptionPlans';
import { 
  CheckCircle, 
  XCircle, 
  Calendar, 
  CreditCard, 
  Settings, 
  AlertTriangle,
  RefreshCw,
  Crown
} from 'lucide-react';

/**
 * Subscription Management Component
 * Displays user's subscription status and management options
 */
const SubscriptionManagement = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  /**
   * Load user's subscription data
   */
  const loadSubscription = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await subscriptionService.getUserSubscription();
      setSubscription(result);
    } catch (error) {
      console.error('Error loading subscription:', error);
      setError('Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cancel subscription
   */
  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period.')) {
      return;
    }

    try {
      setIsCancelling(true);
      setError(null);

      const result = await subscriptionService.cancelSubscription();
      
      if (result.success) {
        // Reload subscription data
        await loadSubscription();
        alert('Subscription cancelled successfully');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      setError('Failed to cancel subscription. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  /**
   * Get subscription status color and icon
   */
  const getStatusDisplay = (status, isExpired) => {
    if (isExpired) {
      return {
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        icon: <XCircle className="w-5 h-5" />,
        text: 'Expired'
      };
    }

    switch (status) {
      case 'active':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          icon: <CheckCircle className="w-5 h-5" />,
          text: 'Active'
        };
      case 'cancelled':
        return {
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          icon: <AlertTriangle className="w-5 h-5" />,
          text: 'Cancelled'
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          icon: <Settings className="w-5 h-5" />,
          text: status || 'Unknown'
        };
    }
  };

  useEffect(() => {
    loadSubscription();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading subscription information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <h2 className="text-lg font-semibold text-red-800">Error</h2>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={loadSubscription}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!subscription?.hasSubscription) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-gray-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No Active Subscription
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have an active subscription. Subscribe to unlock premium features and enhance your learning experience.
          </p>
          <button
            onClick={() => window.location.href = '/subscription'}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            View Subscription Plans
          </button>
        </div>
      </div>
    );
  }

  const currentPlan = SUBSCRIPTION_PLANS[subscription.subscription.plan];
  const statusDisplay = getStatusDisplay(
    subscription.subscription.status, 
    subscription.subscription.isExpired
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Crown className="w-6 h-6 text-white mr-3" />
              <h1 className="text-xl font-bold text-white">Subscription Management</h1>
            </div>
            <div className={`flex items-center px-3 py-1 rounded-full ${statusDisplay.bgColor}`}>
              {statusDisplay.icon}
              <span className={`ml-2 font-semibold ${statusDisplay.color}`}>
                {statusDisplay.text}
              </span>
            </div>
          </div>
        </div>

        {/* Subscription Details */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Current Plan */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <CreditCard className="w-4 h-4 mr-2" />
                Current Plan
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-semibold text-gray-900">{currentPlan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-semibold text-gray-900">
                    {formatPrice(currentPlan.priceInKobo)}/{currentPlan.interval}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Billing Cycle:</span>
                  <span className="font-semibold text-gray-900 capitalize">
                    {currentPlan.interval}
                  </span>
                </div>
              </div>
            </div>

            {/* Subscription Dates */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Important Dates
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Start Date:</span>
                  <span className="font-semibold text-gray-900">
                    {formatDate(subscription.subscription.startDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">End Date:</span>
                  <span className="font-semibold text-gray-900">
                    {formatDate(subscription.subscription.endDate)}
                  </span>
                </div>
                {subscription.subscription.isExpired && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-700 text-sm">
                      Your subscription has expired. Renew to continue accessing premium features.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Plan Features */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Your Plan Features</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {currentPlan.features.map((feature, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {subscription.subscription.isExpired ? (
                <button
                  onClick={() => window.location.href = '/subscription'}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Renew Subscription
                </button>
              ) : (
                <button
                  onClick={handleCancelSubscription}
                  disabled={isCancelling}
                  className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCancelling ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin mr-2 inline" />
                      Cancelling...
                    </>
                  ) : (
                    'Cancel Subscription'
                  )}
                </button>
              )}
              
              <button
                onClick={() => window.location.href = '/subscription'}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Change Plan
              </button>
            </div>
          </div>

          {/* Important Notes */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">Important Information</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Cancelled subscriptions remain active until the end of the current billing period</li>
              <li>• You can change your plan at any time</li>
              <li>• All payments are processed securely through Paystack</li>
              <li>• For billing support, contact our customer service team</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManagement;
