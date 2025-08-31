import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import subscriptionService from '../services/subscriptionService';

const SubscriptionContext = createContext();

/**
 * Subscription Provider Component
 * Manages subscription state and provides subscription-related functions
 */
export const SubscriptionProvider = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load user's subscription data
   */
  const loadSubscription = async () => {
    if (!user) {
      setSubscription(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await subscriptionService.getUserSubscription();
      setSubscription(result);
    } catch (error) {
      console.error('Error loading subscription:', error);
      setError('Failed to load subscription data');
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh subscription data
   */
  const refreshSubscription = () => {
    loadSubscription();
  };

  /**
   * Check if user has active subscription
   */
  const hasActiveSubscription = () => {
    return subscription?.hasSubscription && 
           subscription?.subscription?.status === 'active' && 
           !subscription?.subscription?.isExpired;
  };

  /**
   * Check if user has premium access
   */
  const hasPremiumAccess = () => {
    return hasActiveSubscription();
  };

  /**
   * Get subscription plan
   */
  const getSubscriptionPlan = () => {
    return subscription?.subscription?.plan || null;
  };

  /**
   * Get subscription status
   */
  const getSubscriptionStatus = () => {
    return subscription?.subscription?.status || null;
  };

  /**
   * Get subscription end date
   */
  const getSubscriptionEndDate = () => {
    return subscription?.subscription?.endDate || null;
  };

  /**
   * Check if subscription is expired
   */
  const isSubscriptionExpired = () => {
    return subscription?.subscription?.isExpired || false;
  };

  // Load subscription when user changes
  useEffect(() => {
    loadSubscription();
  }, [user]);

  const value = {
    subscription,
    isLoading,
    error,
    loadSubscription,
    refreshSubscription,
    hasActiveSubscription,
    hasPremiumAccess,
    getSubscriptionPlan,
    getSubscriptionStatus,
    getSubscriptionEndDate,
    isSubscriptionExpired
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

/**
 * Hook to use subscription context
 */
export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
