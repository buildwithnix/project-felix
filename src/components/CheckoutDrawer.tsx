'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Primer,
  type UniversalCheckoutOptions,
  type Payment,
  type PrimerClientError,
  type OnCheckoutFailHandler,
} from '@primer-io/checkout-web';

// Remove custom PrimerStyleOptions as we'll use CheckoutStyle from the SDK
// interface PrimerStyleOptions { ... }

// We will use UniversalCheckoutOptions directly from the SDK
// interface PrimerCheckoutOptions { ... } // This custom interface is no longer needed

// declare global { // This is no longer needed as Primer is imported
//   interface Window {
//   }
// }

interface CheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  onComplete?: () => void;
  initialAmount?: number; // Amount in cents
  productName?: string;
  contactDetails?: {
    name: string;
    email: string;
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export default function CheckoutDrawer({
  isOpen,
  onClose,
  onBack,
  onComplete,
  initialAmount = 499, // Default to $4.99
  productName = 'Shipping Fee',
  contactDetails,
}: CheckoutDrawerProps) {
  const [clientToken, setClientToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethodToken, setPaymentMethodToken] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false); // Track if SDK is initialized

  // Handle mounting (for client-side only)
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Load Primer SDK script - REMOVED as we will use npm package
  // useEffect(() => {
  //   if (!isMounted) return;
  //
  //   const script = document.createElement('script');
  //   script.src = 'https://sdk.primer.io/web/v2/universal-checkout.js';
  //   script.async = true;
  //   script.onload = () => {
  //     console.log('Primer SDK script loaded successfully.');
  //     setIsPrimerScriptLoaded(true);
  //   };
  //   script.onerror = () => {
  //     console.error('Failed to load Primer SDK script.');
  //     setError('Failed to load payment SDK. Please try refreshing the page.');
  //     setIsPrimerScriptLoaded(false);
  //   };
  //   document.body.appendChild(script);
  //
  //   return () => {
  //     if (script.parentNode === document.body) {
  //         document.body.removeChild(script);
  //     }
  //     setIsPrimerScriptLoaded(false);
  //   };
  // }, [isMounted]);

  // Fetch client token when drawer opens and reset when drawer closes
  useEffect(() => {
    if (isOpen && isMounted) {
      fetchClientToken();
    } else if (!isOpen) {
      // Reset state when drawer closes
      setClientToken(null);
      setPaymentMethodToken(null);
      setError(null);
      setIsInitialized(false);
    }
  }, [isOpen, isMounted]);

  // Fetch client token from our API
  const fetchClientToken = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching client token...');

      const response = await fetch('/api/primer-client-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Client session error response:', data);
        throw new Error(data.error || data.details?.error?.message || 'Failed to get client token');
      }

      if (!data.clientToken) {
        console.error('Missing client token in response:', data);
        throw new Error('Invalid response: Missing client token');
      }

      console.log('Client token received successfully');
      setClientToken(data.clientToken);
    } catch (err) {
      console.error('Error fetching client token:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup function to tear down Primer SDK
  const cleanupPrimerSDK = useCallback(() => {
    try {
      // Check if there's an existing Primer instance to clean up
      const checkoutContainer = document.getElementById('checkout-container');
      if (checkoutContainer) {
        // Clear the container's contents
        checkoutContainer.innerHTML = '';
      }
      setIsInitialized(false);
      console.log('Primer SDK cleaned up');
    } catch (err) {
      console.error('Error cleaning up Primer SDK:', err);
    }
  }, []);

  // Initialize Primer SDK
  const initializePrimerSDK = useCallback(async () => {
    console.log('🔧 initializePrimerSDK called with conditions:', {
      hasClientToken: !!clientToken,
      hasPrimer: !!Primer,
      isAlreadyInitialized: isInitialized,
      containerExists: !!containerRef.current,
      containerElement: containerRef.current,
    });

    // Primer is now imported directly
    if (!clientToken || !Primer || isInitialized) {
      console.log('❌ Skipping Primer initialization:', {
        hasClientToken: !!clientToken,
        hasPrimer: !!Primer,
        isAlreadyInitialized: isInitialized,
      });
      return;
    }

    try {
      // Clean up any existing SDK instance first
      cleanupPrimerSDK();

      // Wait a bit for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!containerRef.current) {
        console.error('❌ Primer container element not found after waiting!');
        setError('Checkout container not found. Cannot initialize payment form.');
        return;
      }

      console.log('✅ Container found, proceeding with Primer initialization');
      console.log('📦 Container element:', containerRef.current);
      console.log('🔑 Client token (first 20 chars):', clientToken.substring(0, 20) + '...');

      // Enhanced options with better error handling
      const options: UniversalCheckoutOptions = {
        container: '#checkout-container',
        onCheckoutComplete: (data: { payment: Payment | null }) => {
          console.log('✅ Checkout Complete!', data.payment);
          if (data.payment?.id) {
            setPaymentMethodToken(data.payment.id);
            console.log('💳 Payment ID (used as token):', data.payment.id);
          }

          // Call onComplete if provided (for multi-step flow)
          if (onComplete) {
            onComplete();
          } else {
            // Fallback to original behavior
            setTimeout(() => {
              onClose();
            }, 1500);
          }
        },
        onCheckoutFail: (
          error: PrimerClientError,
          data: { payment?: Payment },
          handler: OnCheckoutFailHandler | undefined
        ) => {
          console.error('❌ Checkout Fail!', error, data.payment);
          setError(`Payment failed: ${error.message}. Please try again.`);
          if (handler) {
            handler.showErrorMessage();
          }
        },
      };

      console.log('🚀 Calling Primer.showUniversalCheckout with options:', options);
      console.log('🔑 Using client token:', clientToken.substring(0, 50) + '...');

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error('Primer SDK initialization timeout after 30 seconds')),
          30000
        );
      });

      try {
        await Promise.race([Primer.showUniversalCheckout(clientToken, options), timeoutPromise]);
        console.log('✅ Primer SDK initialized successfully');
        setIsInitialized(true); // Mark as initialized
      } catch (networkError) {
        // Handle specific network connectivity issues
        console.error('🌐 Network error during Primer initialization:', networkError);
        if (networkError instanceof Error) {
          if (
            networkError.message.includes('NetworkError') ||
            networkError.message.includes('Failed to fetch')
          ) {
            setError(
              'Unable to connect to payment services. Please check your internet connection and try again.'
            );
          } else if (networkError.message.includes('timeout')) {
            setError('Payment service is taking too long to respond. Please try again.');
          } else if (
            networkError.message.includes('Failed after') &&
            networkError.message.includes('retries')
          ) {
            setError(
              'Payment service is currently unavailable. Please try again in a few moments.'
            );
          } else {
            throw networkError; // Re-throw if it's not a network issue
          }
        } else {
          throw networkError;
        }
      }
    } catch (err) {
      console.error('❌ Error initializing Primer SDK:', err);
      console.error('❌ Error details:', {
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      setError(err instanceof Error ? err.message : 'Failed to initialize payment form');
    }
  }, [clientToken, onClose, onComplete, isInitialized, cleanupPrimerSDK]); // Added dependencies

  // Initialize Primer SDK when client token is available
  useEffect(() => {
    console.log('🔍 Checking conditions to initialize Primer SDK:', {
      isOpen,
      hasClientToken: !!clientToken,
      containerExists: !!containerRef.current,
      PrimerAvailable: !!Primer,
      isInitialized,
      containerElement: containerRef.current,
    });

    if (
      isOpen &&
      clientToken &&
      Primer && // Check if Primer module is available
      containerRef.current // Ensure container is rendered
    ) {
      console.log('✅ All conditions met (using imported SDK). Calling initializePrimerSDK.');
      initializePrimerSDK();
    } else {
      if (isOpen && clientToken && !Primer) {
        console.warn(
          '⚠️ Primer SDK module not available. This should not happen if import is correct.'
        );
      }
      if (isOpen && clientToken && Primer && !containerRef.current) {
        console.warn('⚠️ Primer containerRef.current is not yet available. Waiting...');
      }
      if (isOpen && !clientToken) {
        console.log('⏳ Waiting for client token...');
      }
      if (!isOpen) {
        console.log('🚪 Drawer is closed, skipping initialization');
      }
    }
  }, [isOpen, clientToken, initializePrimerSDK, isInitialized]); // Added isInitialized dependency

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupPrimerSDK();
    };
  }, [cleanupPrimerSDK]);

  // Don't render anything on the server
  if (!isMounted) return null;

  // Use createPortal to render the drawer at the document body level
  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center ${
        isOpen ? 'visible' : 'invisible'
      }`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isOpen ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`relative w-full max-w-md bg-white rounded-t-xl shadow-xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-white rounded-t-xl">
          <div className="flex items-center">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-full hover:bg-gray-100 mr-2"
                aria-label="Go back"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
            )}
            <div>
              <h2 className="text-lg font-semibold">Payment</h2>
              {onBack && <p className="text-sm text-gray-600">Step 2 of 2</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Contact Details Summary (if in multi-step flow) */}
          {contactDetails && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-md font-medium mb-2">Shipping Information</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p>
                  <strong>{contactDetails.name}</strong>
                </p>
                <p>{contactDetails.email}</p>
                <p>{contactDetails.streetAddress}</p>
                <p>
                  {contactDetails.city}, {contactDetails.state} {contactDetails.zipCode}
                </p>
                <p>{contactDetails.country}</p>
              </div>
            </div>
          )}

          {/* Order summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-md font-medium mb-2">Order Summary</h3>
            <div className="flex justify-between mb-2">
              <span>{productName}</span>
              <span>${(initialAmount / 100).toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span>${(initialAmount / 100).toFixed(2)}</span>
            </div>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}

          {/* Error message */}
          {error && <div className="p-4 mb-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}

          {/* Payment method token (for debugging) */}
          {paymentMethodToken && (
            <div className="p-4 mb-4 bg-green-50 text-green-600 rounded-lg">
              Payment successful! Token: {paymentMethodToken.substring(0, 10)}...
            </div>
          )}

          {/* Primer SDK container */}
          <div
            id="checkout-container" // Add ID for the string selector
            ref={containerRef} // Keep ref for potential other uses or direct DOM access if needed
            className="min-h-[300px]"
            // style={{ border: '2px solid red', padding: '10px' }}
          >
            {/* Content inside this div will be replaced by Primer */}
            {/* <p style={{color: 'red', fontSize: '12px'}}>Primer Checkout Container (debug border)</p> */}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
