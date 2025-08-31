import React, { useEffect, useState } from 'react';

/**
 * Paystack Script Loader Component
 * Dynamically loads the Paystack script for payment processing
 */
const PaystackScript = ({ onLoad }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if Paystack script is already loaded
    if (window.PaystackPop) {
      setIsLoaded(true);
      if (onLoad) onLoad();
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.defer = true;

    // Handle script load success
    script.onload = () => {
      setIsLoaded(true);
      if (onLoad) onLoad();
    };

    // Handle script load error
    script.onerror = () => {
      setError('Failed to load Paystack script');
      console.error('Failed to load Paystack script');
    };

    // Append script to document head
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [onLoad]);

  // Return null since this is just a script loader
  return null;
};

export default PaystackScript;
