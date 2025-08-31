import React from 'react';
import { useSubscription } from '../../context/SubscriptionContext';
import { Crown, Settings, Star } from 'lucide-react';

/**
 * Subscription Navigation Component
 * Provides navigation links for subscription-related features
 */
const SubscriptionNav = () => {
  const { hasPremiumAccess, getSubscriptionPlan, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-gray-600">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      {hasPremiumAccess() ? (
        <>
          <div className="flex items-center space-x-2 text-green-600">
            <Crown className="w-4 h-4" />
            <span className="text-sm font-medium">Premium</span>
          </div>
          <a
            href="/subscription/management"
            className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">Manage Subscription</span>
          </a>
        </>
      ) : (
        <a
          href="/subscription"
          className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Star className="w-4 h-4" />
          <span className="text-sm font-medium">Upgrade to Premium</span>
        </a>
      )}
    </div>
  );
};

export default SubscriptionNav;
