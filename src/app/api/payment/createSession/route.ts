import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { amount, customer, order_meta, payment_methods = 'cc,dc,upi' } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const orderId = `order_${Date.now()}`;

    const res = await fetch('https://sandbox.cashfree.com/pg/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': process.env.CASHFREE_APP_ID!,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY!,
        'x-api-version': '2025-01-01',
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: amount,
        order_currency: 'INR',
        customer_details: {
          customer_id: customer.customer_id,
          customer_name: customer.customer_name,
          customer_email: customer.customer_email,
          customer_phone: customer.customer_phone,
        },
        order_meta: {
          return_url:
            order_meta?.return_url ||
            `${process.env.NEXTAUTH_URL}/payment/success?order_id={order_id}`,
          notify_url:
            order_meta?.notify_url ||
            `${process.env.NEXTAUTH_URL}/api/payment/webhook`,
        },
        payment_methods, 
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Cashfree create order failed:', data);
      return NextResponse.json({ error: data.message || 'Failed to create order' }, { status: 400 });
    }

    return NextResponse.json({
      payment_session_id: data.payment_session_id,
      order_id: orderId,
    });
  } catch (error) {
    console.error('Cashfree order error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}