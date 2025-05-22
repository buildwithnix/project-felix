'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types for checkout data
export interface ContactDetails {
  name: string;
  email: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface CheckoutState {
  currentStep: 'contact' | 'payment';
  contactDetails: ContactDetails;
  isLoading: boolean;
  error: string | null;
  paymentMethodToken: string | null;
  isComplete: boolean;
}

// Action types
type CheckoutAction =
  | { type: 'SET_STEP'; payload: 'contact' | 'payment' }
  | { type: 'UPDATE_CONTACT_DETAILS'; payload: Partial<ContactDetails> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PAYMENT_TOKEN'; payload: string }
  | { type: 'COMPLETE_CHECKOUT' }
  | { type: 'RESET_CHECKOUT' };

// Initial state
const initialState: CheckoutState = {
  currentStep: 'contact',
  contactDetails: {
    name: '',
    email: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
  },
  isLoading: false,
  error: null,
  paymentMethodToken: null,
  isComplete: false,
};

// Reducer
function checkoutReducer(state: CheckoutState, action: CheckoutAction): CheckoutState {
  switch (action.type) {
    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.payload,
        error: null,
      };
    case 'UPDATE_CONTACT_DETAILS':
      return {
        ...state,
        contactDetails: {
          ...state.contactDetails,
          ...action.payload,
        },
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case 'SET_PAYMENT_TOKEN':
      return {
        ...state,
        paymentMethodToken: action.payload,
        error: null,
      };
    case 'COMPLETE_CHECKOUT':
      return {
        ...state,
        isComplete: true,
        isLoading: false,
        error: null,
      };
    case 'RESET_CHECKOUT':
      return initialState;
    default:
      return state;
  }
}

// Context
interface CheckoutContextType {
  state: CheckoutState;
  dispatch: React.Dispatch<CheckoutAction>;
  // Helper functions
  setStep: (step: 'contact' | 'payment') => void;
  updateContactDetails: (details: Partial<ContactDetails>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPaymentToken: (token: string) => void;
  completeCheckout: () => void;
  resetCheckout: () => void;
  // Validation helpers
  isContactDetailsValid: () => boolean;
  canProceedToPayment: () => boolean;
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

// Provider component
interface CheckoutProviderProps {
  children: ReactNode;
}

export function CheckoutProvider({ children }: CheckoutProviderProps) {
  const [state, dispatch] = useReducer(checkoutReducer, initialState);

  // Helper functions
  const setStep = (step: 'contact' | 'payment') => {
    dispatch({ type: 'SET_STEP', payload: step });
  };

  const updateContactDetails = (details: Partial<ContactDetails>) => {
    dispatch({ type: 'UPDATE_CONTACT_DETAILS', payload: details });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const setPaymentToken = (token: string) => {
    dispatch({ type: 'SET_PAYMENT_TOKEN', payload: token });
  };

  const completeCheckout = () => {
    dispatch({ type: 'COMPLETE_CHECKOUT' });
  };

  const resetCheckout = () => {
    dispatch({ type: 'RESET_CHECKOUT' });
  };

  // Validation helpers
  const isContactDetailsValid = (): boolean => {
    const {
      name,
      email,
      streetAddress,
      city,
      state: stateValue,
      zipCode,
      country,
    } = state.contactDetails;
    return !!(
      name.trim() &&
      email.trim() &&
      email.includes('@') &&
      streetAddress.trim() &&
      city.trim() &&
      stateValue.trim() &&
      zipCode.trim() &&
      country.trim()
    );
  };

  const canProceedToPayment = (): boolean => {
    return isContactDetailsValid() && !state.isLoading;
  };

  const value: CheckoutContextType = {
    state,
    dispatch,
    setStep,
    updateContactDetails,
    setLoading,
    setError,
    setPaymentToken,
    completeCheckout,
    resetCheckout,
    isContactDetailsValid,
    canProceedToPayment,
  };

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
}

// Hook to use the checkout context
export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (context === undefined) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
}
