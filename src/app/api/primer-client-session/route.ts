import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Primer API endpoint for creating client sessions
const PRIMER_API_URL = 'https://api.primer.io/client-session';

export async function POST(request: NextRequest) {
  try {
    // Get the API key from environment variables
    const apiKey = process.env.PRIMER_API_KEY;

    // Log the API key (partially masked)
    console.log(
      'Using Primer API Key:',
      apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'Not found'
    );

    if (!apiKey) {
      console.error('Primer API key is not configured in environment variables.');
      return NextResponse.json({ error: 'Primer API key is not configured' }, { status: 500 });
    }

    // Generate a unique order ID
    const orderId = uuidv4();

    // Create the request payload for Primer
    const payload = {
      orderId,
      currencyCode: 'USD',
      amount: 499, // Top-level total amount
      order: {
        countryCode: 'US',
        lineItems: [
          {
            itemId: 'shipping-fee',
            name: 'Shipping Fee',
            description: 'Initial shipping fee',
            amount: 499, // $4.99 in cents
            quantity: 1,
          },
        ],
      },
      customer: {
        emailAddress: request.headers.get('x-customer-email') || 'customer@example.com',
      },
      metadata: {
        workflow: 'production',
      },
    };

    // Make the request to Primer API
    console.log('Sending payload to Primer:', JSON.stringify(payload, null, 2));
    const response = await fetch(PRIMER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
        'X-Api-Version': '2.4', // Added required API version
      },
      body: JSON.stringify(payload),
    });

    // Log the request details (payload logged above)
    console.log('Primer API request sent:', {
      url: PRIMER_API_URL,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey
          ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
          : 'Not found',
        'X-Api-Version': '2.4',
      },
    });

    let data;
    try {
      data = await response.json();
      console.log('Primer API response status:', response.status);
      console.log('Primer API response body:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      // If response.json() fails, try to get text for more context
      const textResponse = await response.text();
      console.error(
        'Failed to parse Primer API response as JSON. Status:',
        response.status,
        'Body:',
        textResponse,
        'Parse Error:',
        parseError
      );
      return NextResponse.json(
        { error: 'Failed to parse Primer API response', details: textResponse, parseError },
        { status: response.status || 500 }
      );
    }

    // Check if the request was successful
    if (!response.ok) {
      // Error already logged above with full body
      return NextResponse.json(
        { error: 'Failed to create client session with Primer', details: data },
        { status: response.status }
      );
    }

    if (!data.clientToken) {
      console.error('Primer API response OK, but clientToken is missing:', data);
      return NextResponse.json(
        { error: 'Client token missing in Primer API response', details: data },
        { status: 500 } // Internal server error, as Primer's response is unexpected
      );
    }

    // Return the client token
    console.log('Successfully created client session. Returning clientToken.');
    return NextResponse.json({ clientToken: data.clientToken });
  } catch (error) {
    console.error('Error creating client session:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
