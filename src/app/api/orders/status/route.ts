// Create this file at: app/api/order/status/route.ts

import { NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import Order from "@/models/Order";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('order_id');
    
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    await mongooseConnect();
    
    const order = await Order.findOne({ sessionId: orderId });
    
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      orderId: order.sessionId,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      total: order.total,
      paymentDetails: order.paymentDetails,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    });

  } catch (error) {
    console.error("Error fetching order status:", error);
    return NextResponse.json({ 
      error: "Server error", 
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}