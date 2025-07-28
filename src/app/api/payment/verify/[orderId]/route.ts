// src/app/api/payment/verify/[orderId]/route.ts
import { NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import ServiceOrder from "@/models/OrderService";

export async function GET(
  req: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params;
    await mongooseConnect();

    const order = await ServiceOrder.findById(orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const totalPaid = order.paymentHistory
      .filter((p: any) => p.status === "completed")
      .reduce((sum: number, p: any) => sum + p.amount, 0);

    const isFullyPaid = totalPaid >= order.total - 0.01;

    if (isFullyPaid && order.paymentStatus !== "paid") {
      await ServiceOrder.updateOne(
        { _id: order._id },
        {
          $set: {
            paymentStatus: "paid",
            orderStatus: "confirmed",
            paidAmount: totalPaid,
            remainingAmount: 0,
            "finalPayment.amount": 0,
            "finalPayment.status": "completed",
          },
        }
      );

      // Update any paymentHistory without status to `completed`
      await ServiceOrder.updateOne(
        { _id: order._id },
        {
          $set: {
            "paymentHistory.$[elem].status": "completed"
          }
        },
        {
          arrayFilters: [
            {
              "elem.transactionId": { $exists: true },
              "elem.status": { $exists: false }
            }
          ]
        }
      );
    }

    return NextResponse.json({
      paymentStatus: isFullyPaid ? "paid" : order.paymentStatus,
      totalPaid,
      orderTotal: order.total,
      isFullyPaid,
    });

  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}