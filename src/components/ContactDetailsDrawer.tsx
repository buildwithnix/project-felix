'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useCheckout } from '@/contexts/CheckoutContext';
import FormField from '@/components/ui/FormField';

interface ContactDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  initialAmount?: number;
  productName?: string;
}

export default function ContactDetailsDrawer({
  isOpen,
  onClose,
  onNext,
  initialAmount = 499,
  productName = 'Shipping Fee',
}: ContactDetailsDrawerProps) {
  const { state, updateContactDetails, setError, canProceedToPayment } = useCheckout();
  const [isMounted, setIsMounted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Handle mounting (for client-side only)
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Focus on name field when drawer opens
  useEffect(() => {
    if (isOpen && nameInputRef.current) {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Clear errors when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setFieldErrors({});
      setError(null);
    }
  }, [isOpen, setError]);

  // Validation function
  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        return '';
      case 'streetAddress':
        if (!value.trim()) return 'Street address is required';
        return '';
      case 'city':
        if (!value.trim()) return 'City is required';
        return '';
      case 'state':
        if (!value.trim()) return 'State/Province is required';
        return '';
      case 'zipCode':
        if (!value.trim()) return 'ZIP/Postal code is required';
        return '';
      case 'country':
        if (!value.trim()) return 'Country is required';
        return '';
      default:
        return '';
    }
  };

  // Handle field change with validation
  const handleFieldChange = (field: string, value: string) => {
    updateContactDetails({ [field]: value });

    // Clear error for this field if it becomes valid
    const error = validateField(field, value);
    setFieldErrors(prev => ({
      ...prev,
      [field]: error,
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const errors: Record<string, string> = {};
    Object.entries(state.contactDetails).forEach(([field, value]) => {
      const error = validateField(field, value);
      if (error) errors[field] = error;
    });

    setFieldErrors(errors);

    // If no errors, proceed to next step
    if (Object.keys(errors).length === 0 && canProceedToPayment()) {
      onNext();
    }
  };

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
          <div>
            <h2 className="text-lg font-semibold">Contact Details</h2>
            <p className="text-sm text-gray-600">Step 1 of 2</p>
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

          {/* Error message */}
          {state.error && (
            <div className="p-4 mb-4 bg-red-50 text-red-600 rounded-lg">{state.error}</div>
          )}

          {/* Contact form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              ref={nameInputRef}
              label="Full Name"
              value={state.contactDetails.name}
              onChange={value => handleFieldChange('name', value)}
              error={fieldErrors.name}
              placeholder="Enter your full name"
              required
              autoComplete="name"
            />

            <FormField
              label="Email Address"
              type="email"
              value={state.contactDetails.email}
              onChange={value => handleFieldChange('email', value)}
              error={fieldErrors.email}
              placeholder="Enter your email address"
              required
              autoComplete="email"
            />

            <FormField
              label="Street Address"
              value={state.contactDetails.streetAddress}
              onChange={value => handleFieldChange('streetAddress', value)}
              error={fieldErrors.streetAddress}
              placeholder="Enter your street address"
              required
              autoComplete="street-address"
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="City"
                value={state.contactDetails.city}
                onChange={value => handleFieldChange('city', value)}
                error={fieldErrors.city}
                placeholder="City"
                required
                autoComplete="address-level2"
              />

              <FormField
                label="State/Province"
                value={state.contactDetails.state}
                onChange={value => handleFieldChange('state', value)}
                error={fieldErrors.state}
                placeholder="State"
                required
                autoComplete="address-level1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="ZIP/Postal Code"
                value={state.contactDetails.zipCode}
                onChange={value => handleFieldChange('zipCode', value)}
                error={fieldErrors.zipCode}
                placeholder="ZIP Code"
                required
                autoComplete="postal-code"
              />

              <FormField
                label="Country"
                value={state.contactDetails.country}
                onChange={value => handleFieldChange('country', value)}
                error={fieldErrors.country}
                placeholder="Country"
                required
                autoComplete="country"
              />
            </div>

            {/* Continue button */}
            <button
              type="submit"
              disabled={state.isLoading || !canProceedToPayment()}
              className={`
                w-full py-3 px-4 rounded-md font-medium transition-colors
                ${
                  canProceedToPayment() && !state.isLoading
                    ? 'bg-black text-white hover:bg-gray-800'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {state.isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                'Continue to Payment'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
