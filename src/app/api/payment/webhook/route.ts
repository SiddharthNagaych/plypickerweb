// Production-ready webhook route: /api/payment/webhook
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { mongooseConnect } from '@/lib/mongooseConnect';
import OrderModel from '@/models/Order'; // Mongoose model

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Validate webhook signature
  const rawBody = JSON.stringify(req.body);
  const signature = req.headers['x-webhook-signature'] as string;
  const secret = process.env.CASHFREE_WEBHOOK_SECRET!;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('base64');

  if (signature !== expectedSignature) {
    return res.status(401).json({ message: 'Invalid webhook signature' });
  }

  const {
    order_id,
    order_amount,
    reference_id,
    payment_mode,
    payment_time,
    order_status
  } = req.body;

  try {
    await mongooseConnect();

    // Update order by order_id
    const order = await OrderModel.findOneAndUpdate(
      { sessionId: order_id },
      {
        paymentStatus: order_status === 'PAID' ? 'paid' : 'failed',
        paymentDetails: {
          referenceId: reference_id,
          paymentMode: payment_mode,
          paymentTime: new Date(payment_time),
          amount: order_amount,
        },
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
