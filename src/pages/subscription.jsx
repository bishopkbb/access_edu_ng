import React from 'react';
import SubscriptionCheckout from '../components/subscription/SubscriptionCheckout';
import { useNavigate } from 'react-router-dom';

/**
 * Subscription Page
 * Main page for subscription checkout and plan selection
 */
const SubscriptionPage = () => {
  const navigate = useNavigate();

  /**
   * Handle successful subscription
   */
  const handleSubscriptionSuccess = (subscription) => {
    console.log('Subscription successful:', subscription);
    // You can add additional logic here, such as showing a success message
    // or redirecting to a specific page
  };

  /**
   * Handle subscription cancellation
   */
  const handleSubscriptionCancel = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SubscriptionCheckout 
        onSuccess={handleSubscriptionSuccess}
        onCancel={handleSubscriptionCancel}
      />
    </div>
  );
};

export default SubscriptionPage;
