import { NextRequest, NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import Return from "@/models/Return";
import Order  from "@/models/Order";
import { auth } from "../../../../../auth";

/* POST  /api/mobile/returns  ------------------------------------ */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, userId, items, returnReason } = body;

    // 1. Auth guard (optional if you rely on userId in body)
    const session = await auth();
    if (!session || session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await mongooseConnect();

    // 2. Verify order belongs to user & delivered
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order || order.orderStatus !== "delivered") {
      return NextResponse.json({ error: "Invalid order" }, { status: 400 });
    }

    // 3. Compute total refund
    const total = items.reduce((sum:any,i:any)=>sum+i.refundAmount*i.quantity,0);

    // 4. Create Return record
    const ret = await Return.create({
      orderId, userId,
      returnItems: items,
      totalRefundAmount: total,
      returnReason,
    });

    // 5. Mark order
    order.returnStatus = "requested";
    await order.save();

    return NextResponse.json(ret, { status: 201 });
  } catch (e:any) {
    console.error("[RETURNS‑POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
