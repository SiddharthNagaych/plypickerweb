import { NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import ServiceOrder from "@/models/OrderService";
import { sendOrderConfirmationEmail } from "@/lib/emailService";
import crypto from "crypto";

export async function POST(req: Request) {
  await mongooseConnect();

  try {
    /* ───────────────────────── early duplicate check ───────────── */
    try {
      const preview = await req.clone().json();
      const cfTxnId =
        preview?.data?.payment?.cf_payment_id ??
        preview?.data?.payment?.payment_id ??
        null;
      if (cfTxnId && await ServiceOrder.exists({ "paymentHistory.transactionId": cfTxnId })) {
        return NextResponse.json({ success: true, duplicate: true });
      }
    } catch {/* ignore */}

    /* ───────────────────────── signature verify ────────────────── */
    const rawBody   = await req.text();
    const signature = req.headers.get("x-webhook-signature");
    const ts        = req.headers.get("x-webhook-timestamp");

    if (!signature || !ts) {
      return NextResponse.json({ error: "Missing headers" }, { status: 400 });
    }

    const calc = crypto
      .createHmac("sha256", process.env.CASHFREE_SECRET_KEY!)
      .update(`${ts}${rawBody}`)
      .digest("base64");

    if (calc !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    /* ───────────────────────── parse & extract ─────────────────── */
    const payload  = JSON.parse(rawBody);
    const oData    = payload?.data?.order   || {};
    const pData    = payload?.data?.payment || {};
    const tags     = oData.order_tags       || {};

    const orderIdCF = oData.order_id as string;
    let originalId  = tags.original_order_id;
    if (!originalId && orderIdCF?.startsWith("service_"))
      originalId = orderIdCF.split("_")[1];

    if (!originalId)
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });

    const order = await ServiceOrder.findById(originalId);
    if (!order)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const cfId     = pData.cf_payment_id || pData.payment_id;
    const paidAmt  = parseFloat(pData.payment_amount || "0");
    const success  = pData.payment_status === "SUCCESS";
    const now      = new Date();

    /* duplicate guard (if race with another retry) */
    if (order.paymentHistory?.some((p: any) => p.transactionId === cfId))
      return NextResponse.json({ success: true, duplicate: true });

    /* ───────────────────────── update history ──────────────────── */
    const entry = {
      transactionId: cfId,
      amount: paidAmt,
      type: tags.payment_type || "advance",
      status: success ? "completed" : "failed",
      method: pData.payment_method || "online",
      date: now,
      ...(success ? { paidAt: now } : { failedAt: now }),
    };

    order.paymentHistory.push(entry);
    order.markModified("paymentHistory");

    /* -------- success branch updates -------- */
    if (success) {
      /* decide which bucket this txn belongs to */
      const advAmt = order.advancePayment?.amount || 0;
      const remAmt = order.finalPayment?.amount   || order.total - advAmt;
      const type   =
        Math.abs(paidAmt - advAmt) < 1 ? "advance" :
        Math.abs(paidAmt - remAmt) < 1 ? "remaining" : "full";

      if (type === "advance") {
        order.advancePayment = {
          ...order.advancePayment,
          transactionId: cfId, amount: paidAmt, status: "completed",
          paidAt: now, method: entry.method,
          percentage: order.advancePayment?.percentage || 10,
        };
      } else {
        order.finalPayment  = {
          ...order.finalPayment,
          transactionId: cfId, amount: paidAmt, status: "completed",
          paidAt: now, method: entry.method,
        };
      }

      order.paidAmount      = (order.paidAmount || 0) + paidAmt;
      order.remainingAmount = Math.max(0, order.total - order.paidAmount);
      order.paymentStatus   = order.remainingAmount > 0 ? "partial" : "paid";
      order.orderStatus     = "confirmed";

      /* proportional allocation */
      order.services.forEach((s: any) => {
        s.paymentStatus = order.paymentStatus;
        s.amountPaid = parseFloat(((s.price / order.total) * order.paidAmount).toFixed(2));
      });

      await order.save({ validateModifiedOnly: false });

      /* email */
      try {
        await sendOrderConfirmationEmail({
          order: order.toObject(),
          paymentType: type === "remaining" ? "full" : (type as "advance" | "full"),
          amountPaid: paidAmt,
          customerEmail:
            order.shippingAddress?.email || order.billingAddress?.email,
        });
      } catch (err) {
        console.error("Email failure:", err);
      }

      return NextResponse.json({
        success: true,
        paymentType: type,
        paymentStatus: order.paymentStatus,
        totalPaid: order.paidAmount,
        remainingAmount: order.remainingAmount,
      });
    }

    /* -------- failed branch -------- */
    await order.save({ validateModifiedOnly: false });
    return NextResponse.json({ success: false, message: "Payment failed" });
  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
