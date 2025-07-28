import { NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import ServiceOrder from "@/models/OrderService";
import mongoose, { Types } from "mongoose";
import { sendOrderConfirmationEmail } from "@/lib/emailService";

interface IServiceInput {
  serviceId: string;
  name: string;
  description: string;
  price: number;
  duration?: string;
  quantity?: number;
  technicianRequired?: boolean;
  serviceType?: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Incoming request body:", JSON.stringify(body, null, 2));

    const requiredFields = [
      'userId', 'services', 'shippingAddress', 
      'subtotal', 'gst', 'total',
      'scheduledDate', 'scheduledTime'
    ];
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    if (!Array.isArray(body.services) || body.services.length === 0) {
      return NextResponse.json(
        { error: "At least one valid service is required" },
        { status: 400 }
      );
    }

    await mongooseConnect();

    const userId = new Types.ObjectId(body.userId);
    if (!mongoose.isValidObjectId(userId)) {
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
    }

    const services = body.services.map((service: IServiceInput) => {
      if (!service.serviceId) {
        throw new Error(`Service missing ID: ${service.name}`);
      }
      
      return {
        frontendId: service.serviceId,
        databaseId: mongoose.isValidObjectId(service.serviceId) 
          ? new Types.ObjectId(service.serviceId)
          : new Types.ObjectId(),
        name: service.name,
        description: service.description,
        price: service.price,
        duration: service.duration,
        quantity: service.quantity || 1,
        technicianRequired: service.technicianRequired || false,
        serviceType: service.serviceType,
        paymentStatus: "pending",
        amountPaid: 0
      };
    });

    const advancePercentage = body.advancePayment?.percentage || 10;
    const advanceAmount = body.advancePayment?.amount || Math.round(body.total * (advancePercentage / 100));
    const dueAmount = body.total - advanceAmount;

    const orderData = {
      userId,
      services,
      shippingAddress: {
        name: body.shippingAddress.name,
        phone: body.shippingAddress.phone,
        addressLine1: body.shippingAddress.addressLine1,
        city: body.shippingAddress.city,
        state: body.shippingAddress.state,
        pincode: body.shippingAddress.pincode,
        country: body.shippingAddress.country || "India",
        type: body.shippingAddress.type || "HOME"
      },
      billingAddress: body.billingAddress || {
        ...body.shippingAddress,
        type: "BILLING"
      },
      subtotal: body.subtotal,
      gst: body.gst,
      discount: body.discount || 0,
      total: body.total,
      paidAmount: 0,
      remainingAmount: body.total, 
      paymentStatus: "pending",
      orderStatus: "scheduled",
      scheduledDate: new Date(body.scheduledDate),
      scheduledTime: body.scheduledTime,
      advancePayment: {
        percentage: advancePercentage,
        amount: advanceAmount,
        method: "online" // ✅ FIXED
      },
      finalPayment: {
        amount: dueAmount,
        method: "online" // ✅ FIXED
      },
      gstDetails: body.gstDetails || null,
      paymentHistory: []
    };

    console.log("Creating order with:", orderData);
    const newOrder = await ServiceOrder.create(orderData);

    const cashfreePayload = {
      order_id: `service_${newOrder._id.toString()}_${Date.now()}`,
      order_amount: advanceAmount,
      order_currency: "INR",
      customer_details: {
        customer_id: body.userId,
        customer_name: body.shippingAddress.name,
        customer_phone: body.shippingAddress.phone,
        customer_email: body.customer?.email || ""
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/service-success?order_id=${newOrder._id}`,
        notify_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/service-webhook`
      },
      order_tags: {
        order_type: "service",
        payment_type: "advance",
        original_order_id: newOrder._id.toString()
      }
    };

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
      await ServiceOrder.deleteOne({ _id: newOrder._id });
      return NextResponse.json(
        { 
          error: cashfreeData.message || "Payment session creation failed",
          details: cashfreeData
        },
        { status: cashfreeResponse.status }
      );
    }
    

    await ServiceOrder.updateOne(
      { _id: newOrder._id },
      { 
        $set: { 
          "advancePayment.transactionId": cashfreeData.payment_session_id 
        } 
      }
    );

    await sendOrderConfirmationEmail({
      order: newOrder,
      paymentType: "advance",
      amountPaid: advanceAmount,
      customerEmail: body.customer?.email
    });

    return NextResponse.json({
      success: true,
      payment_session_id: cashfreeData.payment_session_id,
      order_id: newOrder._id,
      advance_amount: advanceAmount,
      total_amount: body.total,
      due_amount: dueAmount
    });

  } catch (error) {
    console.error("Order creation failed:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        ...(error instanceof Error ? { details: error.message } : {})
      },
      { status: 500 }
    );
  }
}
