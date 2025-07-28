import { NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import Order from "@/models/Order";
import { sendOrderConfirmationEmail } from "@/lib/emailService";
import crypto from "crypto";

export async function POST(req: Request) {
  await mongooseConnect();

  try {
    /* ────────────────────────────────────────────────────────────── */
    /* 0. Early‑exit if this Cashfree txn already processed           */
    /* ────────────────────────────────────────────────────────────── */
    try {
      const preview = await req.clone().json();
      const cfTxnId =
        preview?.data?.payment?.cf_payment_id ??
        preview?.data?.payment?.payment_id ??
        null;
      if (cfTxnId && (await Order.exists({ "paymentDetails.transactionId": cfTxnId }))) {
        return NextResponse.json({ success: true, duplicate: true });
      }
    } catch {
      /* ignore – signature step will surface malformed JSON */
    }

    /* ────────────────────────────────────────────────────────────── */
    /* 1. Signature verification                                      */
    /* ────────────────────────────────────────────────────────────── */
    const rawBody     = await req.text();
    const signature   = req.headers.get("x-webhook-signature");
    const timestamp   = req.headers.get("x-webhook-timestamp");
    const idempoKey   = req.headers.get("x-idempotency-key");

    if (!signature || !timestamp) {
      return NextResponse.json({ error: "Missing required headers" }, { status: 400 });
    }

    const signed = `${timestamp}${rawBody}`;
    const calc   = crypto
      .createHmac("sha256", process.env.CASHFREE_SECRET_KEY!)
      .update(signed)
      .digest("base64");

    if (calc !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    /* ────────────────────────────────────────────────────────────── */
    /* 2. Parse + basic extraction                                    */
    /* ────────────────────────────────────────────────────────────── */
    const payload  = JSON.parse(rawBody);
    const { searchParams } = new URL(req.url);
    const orderId  =
      searchParams.get("order_id") ||
      payload.data?.order?.order_id ||
      payload.order_id;

    if (!orderId) {
      return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
    }

    /* optional duplicate via idempotency‑key */
    if (idempoKey && await Order.exists({ webhookIdempotencyKey: idempoKey })) {
      return NextResponse.json({ success: true, duplicate: true });
    }

    const data        = payload.data || payload;
    const paymentData = data.payment;
    const orderData   = data.order;
    const customer    = data.customer_details;

    if (!orderData || !paymentData) {
      return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
    }

    const {
      payment_status: status,
      payment_mode:   mode,
      payment_time,
      payment_amount: amount,
      cf_payment_id:  cfId,
    } = paymentData;

    /* ────────────────────────────────────────────────────────────── */
    /* 3. Locate order & update fields                                */
    /* ────────────────────────────────────────────────────────────── */
    const order = await Order.findOne({ sessionId: orderId });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const success = status === "SUCCESS";
    order.paymentStatus = success ? "paid" : "failed";
    order.orderStatus   = success ? "confirmed" : "cancelled";

    order.paymentDetails = {
      mode,
      time: payment_time ? new Date(payment_time) : new Date(),
      amount,
      transactionId: cfId,
      processedAt: new Date(),
    };
    if (idempoKey) order.webhookIdempotencyKey = idempoKey;

    /* extra product logic */
    if (success && order.type === "product" && order.orderStatus === "delivered") {
      const delivered = new Date();
      const deadline  = new Date();
      deadline.setDate(delivered.getDate() + 7);
      order.deliveredAt    = delivered;
      order.returnDeadline = deadline;
      order.canReturn      = true;
    }

    await order.save();

    /* ────────────────────────────────────────────────────────────── */
    /* 4. Send mail once (only on SUCCESS)                            */
    /* ────────────────────────────────────────────────────────────── */
    if (success) {
      await sendOrderConfirmationEmail({
        order: { ...order.toObject(), type: order.type || "product" },
        customerEmail: customer?.customer_email || order.shippingAddress.email,
      });
    }

    return NextResponse.json({
      success: true,
      order_id: order._id,
      payment_status: order.paymentStatus,
      order_status:   order.orderStatus,
      ...(order.type === "product" ? {
        can_return: order.canReturn,
        return_deadline: order.returnDeadline,
      } : {}),
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
