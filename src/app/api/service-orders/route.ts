import { NextRequest, NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import ServiceOrder from "@/models/OrderService";
import { Types } from "mongoose";

// ✅ Lean-safe type for lean({ virtuals: true }) objects
type LeanServiceOrder = {
  _id: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  services: IServiceItem[];
  shippingAddress: IAddress;
  subtotal: number;
  gst: number;
  discount?: number;
  total: number;
  paymentStatus: string;
  orderStatus: string;
  paymentHistory: IPaymentRecord[];
  advancePayment?: IAdvancePayment;
  finalPayment?: IFinalPayment;
  scheduledDate: Date;
  scheduledTime: string;
  createdAt: Date;
  updatedAt: Date;
  deliveredAt?: Date;
  remainingAmount: number; // virtual
};

export async function GET(req: NextRequest) {
  try {
    await mongooseConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");

    if (!userId || !Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: "Valid userId is required" },
        { status: 400 }
      );
    }

    const filter: { userId: Types.ObjectId; orderStatus?: string } = {
      userId: new Types.ObjectId(userId),
    };
    if (status && status !== "all") {
      filter.orderStatus = status;
    }

    // ✅ Fetch using lean + virtuals and cast safely
    const serviceOrders = await ServiceOrder.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean({ virtuals: true }) as unknown as LeanServiceOrder[];

    const transformedOrders = serviceOrders.map((order) => ({
      _id: order._id.toString(),
      userId: order.userId.toString(),
      items: [],
      services: order.services.map((service: IServiceItem) => ({
        name: service.name,
        description: service.description,
        price: service.price,
        duration: service.duration,
        quantity: service.quantity || 1,
        paymentStatus: service.paymentStatus || "pending",
        amountPaid: service.amountPaid || 0,
      })),
      address: {
        name: order.shippingAddress?.name || "",
        phone: order.shippingAddress?.phone || "",
        addressLine1: order.shippingAddress?.addressLine1 || "",
        city: order.shippingAddress?.city || "",
        state: order.shippingAddress?.state || "",
        pincode: order.shippingAddress?.pincode || "",
      },
      transportType: "service",
      transportCharge: 0,
      laborCharges: 0,
      subtotal: order.subtotal,
      gst: order.gst,
      discount: order.discount || 0,
      total: order.total,
      paymentMethod: order.paymentHistory?.[0]?.method || "online",
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      paidAmount: order.total - order.remainingAmount,
      remainingAmount: order.remainingAmount,
      scheduledDate: order.scheduledDate,
      scheduledTime: order.scheduledTime,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      deliveredAt: order.deliveredAt,
      isServiceOrder: true,
      advancePayment: order.advancePayment,
      finalPayment: order.finalPayment,
    }));

    const totalCount = await ServiceOrder.countDocuments(filter);

    return NextResponse.json({
      success: true,
      orders: transformedOrders,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching service orders:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch service orders",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
