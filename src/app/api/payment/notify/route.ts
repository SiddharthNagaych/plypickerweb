// Create this file at: app/payment/notify/route.ts

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('order_id');
    
    console.log("📬 Payment notify received for order:", orderId);
    
    // This endpoint is just for logging/acknowledgment
    // The actual webhook processing happens in /api/payment/webhook
    
    return NextResponse.json({ 
      success: true, 
      message: "Notification received",
      order_id: orderId
    });

  } catch (error) {
    console.error("❌ Notify route error:", error);
    return NextResponse.json({ 
      error: "Server error", 
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  // Handle GET requests as well
  return NextResponse.json({ message: "Payment notify endpoint" });
}