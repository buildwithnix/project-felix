import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { supabase } from '@/lib/supabaseClient';

// Webhook secret from environment variables
const WEBHOOK_SECRET = process.env.PRIMER_WEBHOOK_SECRET;

// Type definitions for Primer webhook payloads
interface PrimerPayment {
  id: string;
  orderId?: string;
  order_id?: string;
  paymentMethodToken?: string;
  payment_method_token?: string;
  customer?: {
    email?: string;
  };
  customerEmail?: string;
  billing_address?: {
    email?: string;
  };
  metadata?: {
    product_id?: string;
    productId?: string;
    [key: string]: unknown;
  };
}

interface PrimerWebhookEvent {
  type?: string;
  eventType?: string;
  id?: string;
  data?: {
    payment?: PrimerPayment;
  };
  payment?: PrimerPayment;
}

/**
 * Verifies the webhook signature using HMAC-SHA256
 * @param payload - Raw request body
 * @param signature - Signature from Primer webhook headers
 * @returns boolean indicating if signature is valid
 */
function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) {
    console.error('PRIMER_WEBHOOK_SECRET is not configured');
    return false;
  }

  // Remove 'sha256=' prefix if present
  const cleanSignature = signature.replace('sha256=', '');
  
  // Create HMAC hash of the payload
  const expectedSignature = createHmac('sha256', WEBHOOK_SECRET)
    .update(payload, 'utf8')
    .digest('hex');

  // Use timing-safe comparison to prevent timing attacks
  try {
    return timingSafeEqual(
      Buffer.from(cleanSignature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Error comparing signatures:', error);
    return false;
  }
}

/**
 * Calculates the next billing date (30 days from now for MVP)
 * @returns Date object for next billing
 */
function calculateNextBillingDate(): Date {
  const nextBilling = new Date();
  nextBilling.setDate(nextBilling.getDate() + 30); // 30-day billing cycle for MVP
  return nextBilling;
}

/**
 * Creates a subscription record in Supabase
 * @param webhookData - Processed webhook data
 */
async function createSubscription(webhookData: {
  customerEmail: string;
  productIdentifier: string;
  paymentMethodToken: string;
  paymentId: string;
}) {
  const { customerEmail, productIdentifier, paymentMethodToken, paymentId } = webhookData;
  
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        customer_email: customerEmail,
        product_identifier: productIdentifier,
        status: 'active',
        next_billing_date: calculateNextBillingDate().toISOString().split('T')[0], // Format as YYYY-MM-DD
        primer_payment_method_token: paymentMethodToken,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }

    console.log('Subscription created successfully:', {
      subscriptionId: data.subscription_id,
      customerEmail,
      paymentId,
    });

    return data;
  } catch (error) {
    console.error('Failed to create subscription:', error);
    throw error;
  }
}

/**
 * Processes PAYMENT.SUCCESS webhook events
 * @param eventData - Webhook event data
 */
async function processPaymentSuccess(eventData: PrimerWebhookEvent) {
  console.log('Processing PAYMENT.SUCCESS event:', eventData);

  // Extract payment information from the webhook payload
  const payment = eventData.data?.payment || eventData.payment;
  
  if (!payment) {
    throw new Error('Payment data not found in webhook payload');
  }

  // Extract required fields
  const paymentId = payment.id;
  const orderId = payment.orderId || payment.order_id;
  const paymentMethodToken = payment.paymentMethodToken || payment.payment_method_token;
  
  // Extract customer email (may be in different locations depending on Primer setup)
  const customerEmail = payment.customer?.email || 
                       payment.customerEmail || 
                       payment.billing_address?.email ||
                       'unknown@example.com'; // Fallback for MVP

  // Extract product identifier from metadata or order
  const productIdentifier = payment.metadata?.product_id || 
                           payment.metadata?.productId ||
                           orderId ||
                           'default-product'; // Fallback for MVP

  // Validate required fields
  if (!paymentMethodToken) {
    throw new Error('Payment method token not found in webhook payload');
  }

  console.log('Extracted webhook data:', {
    paymentId,
    orderId,
    customerEmail,
    productIdentifier,
    paymentMethodToken: paymentMethodToken.substring(0, 10) + '...', // Log partial token for security
  });

  // Create subscription record
  await createSubscription({
    customerEmail,
    productIdentifier,
    paymentMethodToken,
    paymentId,
  });
}

/**
 * POST handler for Primer webhook events
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    
    // Get signature from headers
    const signature = request.headers.get('x-primer-signature') || 
                     request.headers.get('primer-signature') ||
                     request.headers.get('signature');

    if (!signature) {
      console.error('No signature found in webhook headers');
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 401 }
      );
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Parse the webhook payload
    let webhookData;
    try {
      webhookData = JSON.parse(body);
    } catch (error) {
      console.error('Invalid JSON in webhook payload:', error);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    console.log('Received webhook event:', {
      type: webhookData.type || webhookData.eventType,
      id: webhookData.id,
      timestamp: new Date().toISOString(),
    });

    // Process only PAYMENT.SUCCESS events for MVP
    const eventType = webhookData.type || webhookData.eventType;
    
    if (eventType === 'PAYMENT.SUCCESS') {
      await processPaymentSuccess(webhookData);
      
      console.log('Webhook processed successfully');
      return NextResponse.json({ 
        success: true, 
        message: 'Webhook processed successfully' 
      });
    } else {
      // Log other event types but don't process them
      console.log(`Ignoring webhook event type: ${eventType}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Event type not processed' 
      });
    }

  } catch (error) {
    console.error('Error processing webhook:', error);
    
    // Return 500 for processing errors so Primer will retry
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler - returns method not allowed
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}