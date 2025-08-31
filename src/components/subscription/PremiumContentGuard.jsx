import React from 'react';
import { useSubscription } from '../../context/SubscriptionContext';
import { Crown, Lock, Star } from 'lucide-react';

/**
 * Premium Content Guard Component
 * Wraps premium content and shows subscription prompt for non-subscribers
 */
const PremiumContentGuard = ({ 
  children, 
  fallback = null,
  showUpgradePrompt = true,
  className = ""
}) => {
  const { hasPremiumAccess, isLoading } = useSubscription();

  // Show loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  // If user has premium access, show the content
  if (hasPremiumAccess()) {
    return <div className={className}>{children}</div>;
  }

  // If custom fallback is provided, show it
  if (fallback) {
    return <div className={className}>{fallback}</div>;
  }

  // Show upgrade prompt
  if (showUpgradePrompt) {
    return (
      <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Premium Content
          </h3>
          <p className="text-gray-600 mb-4">
            This content is available exclusively to premium subscribers. 
            Upgrade your account to unlock this feature and many more.
          </p>
          <div className="flex items-center justify-center mb-4 text-sm text-gray-500">
            <Lock className="w-4 h-4 mr-1" />
            Premium Feature
          </div>
          <button
            onClick={() => window.location.href = '/subscription'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center mx-auto"
          >
            <Star className="w-4 h-4 mr-2" />
            Upgrade to Premium
          </button>
        </div>
      </div>
    );
  }

  // Return null if no fallback and no upgrade prompt
  return null;
};

export default PremiumContentGuard;
