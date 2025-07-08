// app/api/orders/[orderId]/return/route.ts
import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import Order from "@/models/Order";
import Return from "@/models/Return";
import { Types } from "mongoose";

interface ReturnItem {
  cartItemId: string;
  productId: string;
  productName: string;
  quantity: number;
  reason: string;
  condition: string;
  refundAmount: number;
}

interface ReturnRequest {
  orderId: string;
  userId: string;
  returnItems: ReturnItem[];
  totalRefundAmount: number;
  returnReason: string;
  returnStatus: string;
}

export async function POST(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { returnItems, returnReason } = await req.json();
    const order = await Order.findById(params.orderId);
    
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Validate return items
    if (!Array.isArray(returnItems) || returnItems.length === 0) {
      return NextResponse.json(
        { error: "At least one item must be returned" },
        { status: 400 }
      );
    }

    // Calculate refund amounts
    const returnItemsWithRefund = returnItems.map((item: any) => {
      const originalItem = order.items.find((i: any) => i.id === item.cartItemId);
      if (!originalItem) {
        throw new Error(`Item ${item.cartItemId} not found in order`);
      }

      const itemPrice = originalItem.productDiscountedPrice || originalItem.productPrice;
      const refundAmount = itemPrice * item.quantity;
      
      return {
        cartItemId: item.cartItemId,
        productId: originalItem.productId.toString(),
        productName: originalItem.productName,
        quantity: item.quantity,
        reason: item.reason,
        condition: item.condition,
        refundAmount
      };
    });

    const totalRefundAmount = returnItemsWithRefund.reduce(
      (sum: number, item: ReturnItem) => sum + item.refundAmount, 0
    );

    // Create return request
    const returnRequest: ReturnRequest = {
      orderId: params.orderId,
      userId: session.user.id,
      returnItems: returnItemsWithRefund,
      totalRefundAmount,
      returnReason,
      returnStatus: "requested"
    };

    const createdReturn = new Return(returnRequest);
    await createdReturn.save();

    // Update order status
    order.hasActiveReturn = true;
    await order.save();

    return NextResponse.json(createdReturn);
  } catch (error) {
    console.error("Error creating return:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to create return request" 
      },
      { status: 500 }
    );
  }
}