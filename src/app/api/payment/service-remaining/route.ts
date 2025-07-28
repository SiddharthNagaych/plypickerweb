// api/payment/service-remaining/route.ts
import { NextRequest, NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import ServiceOrder from "@/models/OrderService";
import { Types } from "mongoose";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    await mongooseConnect();
    
    const { orderId, userId } = await req.json();
    
    // Validate input
    if (!orderId || !userId) {
      return NextResponse.json(
        { error: "Order ID and User ID are required" },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(orderId) || !Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: "Invalid Order ID or User ID format" },
        { status: 400 }
      );
    }

    // Find the service order
    const order = await ServiceOrder.findOne({
      _id: new Types.ObjectId(orderId),
      userId: new Types.ObjectId(userId)
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Check if there's remaining payment
    const remainingAmount=order.remainingAmount??(order.finalPayment?.amount || 0);
    
    if (remainingAmount <= 0) {
      return NextResponse.json(
        { error: "No remaining payment required for this order" },
        { status: 400 }
      );
    }

    if (order.finalPayment?.status === "pending") {
  return NextResponse.json(
    { error: "A remaining‑payment session already exists" },
    { status: 400 }
  );
}


    // Check if order is eligible for remaining payment
    if (order.paymentStatus === 'paid') {
      return NextResponse.json(
        { error: "Order is already fully paid" },
        { status: 400 }
      );
    }

    if (order.orderStatus === 'cancelled') {
      return NextResponse.json(
        { error: "Cannot pay for cancelled order" },
        { status: 400 }
      );
    }

    // Generate a shorter unique order ID for Cashfree
    const generateShortId = (id: string) => {
      return crypto.createHash('sha1').update(id).digest('hex').substring(0, 8);
    };

    const cashfreeOrderId = `rem_${generateShortId(order._id.toString())}_${Date.now().toString().slice(-6)}`;

    // Prepare Cashfree payload for remaining payment
    const cashfreePayload = {
      order_id: cashfreeOrderId, // Using the shortened ID
      order_amount: remainingAmount,
      order_currency: "INR",
      customer_details: {
        customer_id: order.userId.toString(),
        customer_name: order.shippingAddress.name,
        customer_phone: order.shippingAddress.phone,
        customer_email: order.billingAddress?.email || ""
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/service-success?order_id=${order._id}&type=remaining`,
        notify_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/service-webhook`
      },
      order_tags: {
        order_type: "service",
        payment_type: "remaining",
        original_order_id: order._id.toString(), // Full ID still available in tags
        short_order_id: cashfreeOrderId // Also store the short ID for reference
      }
    };

    // Call Cashfree API to create payment session
    const cashfreeResponse = await fetch("https://sandbox.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": process.env.CASHFREE_APP_ID!,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY!,
        "x-api-version": "2023-08-01"
      },
      body: JSON.stringify(cashfreePayload)
    });

    const cashfreeData = await cashfreeResponse.json();

    if (!cashfreeResponse.ok) {
      console.error("Cashfree error:", cashfreeData);
      return NextResponse.json(
        { 
          error: cashfreeData.message || "Payment session creation failed",
          details: cashfreeData
        },
        { status: cashfreeResponse.status }
      );
    }

    // Update order with payment session details
    await ServiceOrder.updateOne(
      { _id: order._id },
      { 
        $set: { 
          "finalPayment.transactionId": cashfreeData.payment_session_id,
          "finalPayment.cashfreeOrderId": cashfreeOrderId
        },
        $push: {
          paymentHistory: {
            transactionId: cashfreeData.payment_session_id,
            amount: remainingAmount,
            type: "remaining",
            status: "pending",
            method: "online",
            cashfreeOrderId: cashfreeOrderId,
            initiatedAt: new Date()
          }
        }
      }
    );

    return NextResponse.json({
      success: true,
      payment_session_id: cashfreeData.payment_session_id,
      order_id: order._id,
      remaining_amount: remainingAmount,
      total_amount: order.total,
      advance_paid: order.advancePayment?.amount || 0
    });

  } catch (error) {
    console.error("Remaining payment error:", error);
    return NextResponse.json(
      { 
        error: "Failed to create remaining payment session",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}