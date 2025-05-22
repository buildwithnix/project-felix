'use client';

import { useEffect } from 'react';
import { useCheckout } from '@/contexts/CheckoutContext';
import ContactDetailsDrawer from '@/components/ContactDetailsDrawer';
import CheckoutDrawer from '@/components/CheckoutDrawer';

interface CheckoutFlowManagerProps {
  isOpen: boolean;
  onClose: () => void;
  initialAmount?: number;
  productName?: string;
}

export default function CheckoutFlowManager({
  isOpen,
  onClose,
  initialAmount = 499,
  productName = 'Shipping Fee',
}: CheckoutFlowManagerProps) {
  const { state, setStep, resetCheckout, completeCheckout } = useCheckout();

  // Reset checkout state when flow closes
  useEffect(() => {
    if (!isOpen) {
      resetCheckout();
    }
  }, [isOpen, resetCheckout]);

  // Handle closing the flow
  const handleClose = () => {
    resetCheckout();
    onClose();
  };

  // Handle moving to payment step
  const handleProceedToPayment = () => {
    setStep('payment');
  };

  // Handle going back to contact details
  const handleBackToContact = () => {
    setStep('contact');
  };

  // Handle successful payment completion
  const handlePaymentComplete = () => {
    completeCheckout();
    // Close the flow after a brief delay to show success state
    setTimeout(() => {
      handleClose();
    }, 2000);
  };

  return (
    <>
      {/* Contact Details Step */}
      <ContactDetailsDrawer
        isOpen={isOpen && state.currentStep === 'contact'}
        onClose={handleClose}
        onNext={handleProceedToPayment}
        initialAmount={initialAmount}
        productName={productName}
      />

      {/* Payment Step */}
      <CheckoutDrawer
        isOpen={isOpen && state.currentStep === 'payment'}
        onClose={handleClose}
        onBack={handleBackToContact}
        onComplete={handlePaymentComplete}
        initialAmount={initialAmount}
        productName={productName}
        contactDetails={state.contactDetails}
      />
    </>
  );
}
