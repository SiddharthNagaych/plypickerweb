// api/payment/eligibleMethods/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { amount, order_id } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ message: 'Invalid amount' }, { status: 400 });
    }

    if (!order_id) {
      return NextResponse.json({ message: 'Order ID is required' }, { status: 400 });
    }

    const response = await fetch('https://sandbox.cashfree.com/pg/eligibility/payment_methods', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': process.env.CASHFREE_APP_ID!,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY!,
        'x-api-version': '2025-01-01',
      },
      body: JSON.stringify({
        queries: {
          amount: amount,
          order_id: order_id
        }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Cashfree API Error:', data);
      return NextResponse.json(
        {
          message: 'Failed to fetch eligible payment methods',
          error: data.message || 'Unknown error from Cashfree',
          details: data,
        },
        { status: response.status }
      );
    }

    // Process the eligible methods to return a cleaner format
    const processedMethods = data.map((method: any) => ({
      method_type: method.entity_value,
      eligible: method.eligibility,
      details: method.entity_details || null
    }));

    return NextResponse.json({
      eligible_methods: processedMethods,
      raw_response: data // Include raw response for debugging
    });

  } catch (error) {
    console.error('Error fetching eligible payment methods:', error);
    return NextResponse.json(
      {
        message: 'Error fetching eligible payment methods',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}