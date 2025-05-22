import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// Primer API endpoint for creating payments
const PRIMER_PAYMENTS_API_URL = 'https://api.primer.io/payments';

interface Subscription {
  subscription_id: string;
  customer_email: string;
  product_identifier: string;
  status: string;
  next_billing_date: string;
  primer_payment_method_token: string;
  created_at: string;
}

interface BillingResult {
  subscriptionId: string;
  success: boolean;
  error?: string;
  paymentId?: string;
}

interface ProcessingStats {
  totalProcessed: number;
  successfulCharges: number;
  failedCharges: number;
  errors: string[];
}

export async function GET() {
  console.log('🔄 Starting billing processor at:', new Date().toISOString());
  
  const stats: ProcessingStats = {
    totalProcessed: 0,
    successfulCharges: 0,
    failedCharges: 0,
    errors: []
  };

  try {
    // Get the API key from environment variables
    const apiKey = process.env.PRIMER_API_KEY;
    
    if (!apiKey) {
      const error = 'Primer API key is not configured in environment variables';
      console.error('❌', error);
      stats.errors.push(error);
      return NextResponse.json({
        success: false,
        error,
        stats
      }, { status: 500 });
    }

    console.log('✅ Primer API Key found:', `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);

    // Query due subscriptions from Supabase
    const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD format
    
    console.log('📅 Querying subscriptions due on or before:', today);
    
    const { data: subscriptions, error: queryError } = await supabase
      .from('subscriptions')
      .select('*')
      .lte('next_billing_date', today)
      .in('status', ['active', 'pending_initial'])
      .order('next_billing_date', { ascending: true });

    if (queryError) {
      const error = `Failed to query subscriptions: ${queryError.message}`;
      console.error('❌', error);
      stats.errors.push(error);
      return NextResponse.json({
        success: false,
        error,
        stats
      }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('ℹ️ No subscriptions due for billing');
      return NextResponse.json({
        success: true,
        message: 'No subscriptions due for billing',
        stats
      });
    }

    console.log(`📋 Found ${subscriptions.length} subscription(s) due for billing`);
    stats.totalProcessed = subscriptions.length;

    // Process each subscription
    const results: BillingResult[] = [];
    
    for (const subscription of subscriptions as Subscription[]) {
      console.log(`\n🔄 Processing subscription ${subscription.subscription_id} for ${subscription.customer_email}`);
      
      try {
        const result = await processSubscriptionBilling(subscription, apiKey);
        results.push(result);
        
        if (result.success) {
          stats.successfulCharges++;
          console.log(`✅ Successfully charged subscription ${subscription.subscription_id}`);
        } else {
          stats.failedCharges++;
          console.log(`❌ Failed to charge subscription ${subscription.subscription_id}: ${result.error}`);
          if (result.error) {
            stats.errors.push(`Subscription ${subscription.subscription_id}: ${result.error}`);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Error processing subscription ${subscription.subscription_id}:`, errorMessage);
        
        results.push({
          subscriptionId: subscription.subscription_id,
          success: false,
          error: errorMessage
        });
        
        stats.failedCharges++;
        stats.errors.push(`Subscription ${subscription.subscription_id}: ${errorMessage}`);
      }
    }

    console.log('\n📊 Billing processing completed:');
    console.log(`   Total processed: ${stats.totalProcessed}`);
    console.log(`   Successful charges: ${stats.successfulCharges}`);
    console.log(`   Failed charges: ${stats.failedCharges}`);
    console.log(`   Errors: ${stats.errors.length}`);

    return NextResponse.json({
      success: true,
      message: 'Billing processing completed',
      stats,
      results
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ Fatal error in billing processor:', errorMessage);
    
    stats.errors.push(`Fatal error: ${errorMessage}`);
    
    return NextResponse.json({
      success: false,
      error: 'Fatal error in billing processor',
      details: errorMessage,
      stats
    }, { status: 500 });
  }
}

async function processSubscriptionBilling(subscription: Subscription, apiKey: string): Promise<BillingResult> {
  const { subscription_id, customer_email, primer_payment_method_token } = subscription;
  
  try {
    // Generate a unique order ID for this billing attempt
    const orderId = uuidv4();
    
    console.log(`💳 Creating MIT payment for subscription ${subscription_id} with order ID ${orderId}`);
    
    // Create the payment payload for Primer MIT
    const paymentPayload = {
      orderId,
      amount: 499, // $4.99 in cents
      currencyCode: 'USD',
      paymentMethodToken: primer_payment_method_token,
      paymentType: 'MERCHANT_INITIATED',
      customer: {
        emailAddress: customer_email
      },
      metadata: {
        subscriptionId: subscription_id,
        billingType: 'recurring',
        workflow: 'production'
      }
    };

    console.log(`📤 Sending MIT payment request to Primer for subscription ${subscription_id}`);
    
    // Make the payment request to Primer
    const response = await fetch(PRIMER_PAYMENTS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
        'X-Api-Version': '2.4'
      },
      body: JSON.stringify(paymentPayload)
    });

    let responseData;
    try {
      responseData = await response.json();
    } catch {
      const textResponse = await response.text();
      throw new Error(`Failed to parse Primer API response: ${textResponse}`);
    }

    console.log(`📥 Primer API response for subscription ${subscription_id}:`, {
      status: response.status,
      success: response.ok
    });

    if (!response.ok) {
      console.error(`❌ Primer payment failed for subscription ${subscription_id}:`, responseData);
      
      // Update subscription status to failed
      await updateSubscriptionStatus(subscription_id, 'failed', null);
      
      return {
        subscriptionId: subscription_id,
        success: false,
        error: `Payment failed: ${responseData.message || 'Unknown error'}`
      };
    }

    // Payment successful - update subscription
    const nextBillingDate = new Date();
    nextBillingDate.setDate(nextBillingDate.getDate() + 30); // Add 30 days
    const nextBillingDateString = nextBillingDate.toISOString().split('T')[0];
    
    console.log(`✅ Payment successful for subscription ${subscription_id}, updating next billing date to ${nextBillingDateString}`);
    
    await updateSubscriptionStatus(subscription_id, 'active', nextBillingDateString);
    
    return {
      subscriptionId: subscription_id,
      success: true,
      paymentId: responseData.id || orderId
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Error processing payment for subscription ${subscription_id}:`, errorMessage);
    
    // Update subscription status to failed
    try {
      await updateSubscriptionStatus(subscription_id, 'failed', null);
    } catch (updateError) {
      console.error(`❌ Failed to update subscription status for ${subscription_id}:`, updateError);
    }
    
    return {
      subscriptionId: subscription_id,
      success: false,
      error: errorMessage
    };
  }
}

async function updateSubscriptionStatus(
  subscriptionId: string, 
  status: string, 
  nextBillingDate: string | null
): Promise<void> {
  const updateData: { status: string; next_billing_date?: string } = { status };
  
  if (nextBillingDate) {
    updateData.next_billing_date = nextBillingDate;
  }
  
  console.log(`📝 Updating subscription ${subscriptionId} status to '${status}'${nextBillingDate ? ` with next billing date ${nextBillingDate}` : ''}`);
  
  const { error } = await supabase
    .from('subscriptions')
    .update(updateData)
    .eq('subscription_id', subscriptionId);

  if (error) {
    throw new Error(`Failed to update subscription ${subscriptionId}: ${error.message}`);
  }
  
  console.log(`✅ Successfully updated subscription ${subscriptionId}`);
}