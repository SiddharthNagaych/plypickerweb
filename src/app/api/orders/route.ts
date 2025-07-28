import { NextRequest, NextResponse } from 'next/server';
import { auth } from "../../../../auth";
import { ObjectId } from 'mongodb';
import { mongooseConnect } from "@/lib/mongooseConnect";
import Order from "@/models/Order";
import PCash from "@/models/PCash";
import Return from "@/models/Return";
import Product from "@/models/products/Product";

// Define proper types for the lean queries
interface OrderItem {
  id?: string;
  productId: ObjectId | string;
  productName: string;
  productPrice: number;
  productDiscountedPrice?: number;
  productImage?: string;
  quantity: number;
  includeLabor: boolean;
  laborFloors: number;
  laborPerFloor?: number;
  variantIndex?: number;
  variantName?: string;
  brand?: any;
  desc?: any;
  applicability?: number;
  loadingUnloadingPrice?: number;
  estimatedDelivery?: string;
  addedAt?: string;
}

interface OrderService {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  quantity?: number;
}

interface OrderAddress {
  name: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  type?: string;
  coordinates?: { lat: number; lng: number };
  distanceFromCenter?: number;
}

interface PaymentDetails {
  mode?: string;
  time?: string;
  amount?: number;
  cf_payment_id?: string;
  processedAt?: Date;
}

interface LeanOrder {
  _id: ObjectId;
  userId: ObjectId | { _id: ObjectId; name: string; email: string; phone: string };
  sessionId?: string;
  items: OrderItem[];
  services?: OrderService[];
  address: OrderAddress;
  transportType: string;
  transportCharge: number;
  laborCharges: number;
  subtotal: number;
  gst: number;
  discount: number;
  total: number;
  coupon?: ObjectId | { _id: ObjectId; code: string; discount_amount: number };
  paymentMethod?: string;
  paymentStatus: string;
  orderStatus: string;
  paymentDetails?: PaymentDetails;
  pcashUsed?: number;
  canReturn: boolean;
  hasActiveReturn: boolean;
  returnDeadline?: Date;
  deliveredAt?: Date;
  webhookIdempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface LeanReturn {
  _id: ObjectId;
  orderId: ObjectId;
  userId: ObjectId;
  returnStatus: string;
  requestedAt: Date;
  totalRefundAmount: number;
  plyCreditsCredited: boolean;
  plyCreditsAmount?: number;
  returnReason: string;
  refundMethod?: string;
}

interface EnhancedOrder extends LeanOrder {
  returnStatus?: string;
  returnRequestedAt?: Date;
  refundAmount?: number;
  plyCreditsCredited?: boolean;
  plyCreditsAmount?: number;
  returnReason?: string;
  refundMethod?: string;
  daysRemainingForReturn?: number;
  returnInfo?: {
    canReturn: boolean;
    hasActiveReturn: boolean;
    daysRemaining: number;
    returnDeadline?: Date;
    activeReturnId?: ObjectId;
    activeReturnStatus?: string;
  };
  orderSummary?: {
    totalItems: number;
    totalServices: number;
    totalQuantity: number;
    subtotal: number;
    gst: number;
    discount: number;
    transportCharge: number;
    laborCharges: number;
    total: number;
  };
  deliveryInfo?: {
    status: string;
    deliveredAt?: Date;
    estimatedDelivery: string;
    address: OrderAddress;
    transportType: string;
  };
}

interface CreateOrderPayload {
  amount: number;
  customer: {
    customer_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
  };
  order_meta?: any;
  payment_methods?: string;
  items: OrderItem[];
  services?: OrderService[];
  address: OrderAddress;
  transportType?: string;
  transportCharge?: number;
  laborCharges?: number;
  subtotal?: number;
  gst?: number;
  discount?: number;
  coupon?: string;
  total?: number;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const orderId = searchParams.get("orderId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const canReturn = searchParams.get("canReturn");

    await mongooseConnect();

    let query: any = {};
    
    // Build query based on parameters
    if (userId) {
      query.userId = userId;
    }
    
    if (orderId) {
      query._id = orderId;
    }
    
    if (status) {
      query.orderStatus = status;
    }
    
    if (canReturn === "true") {
      query.canReturn = true;
      query.returnDeadline = { $gt: new Date() };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch orders with pagination
    const orders = await Order.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<LeanOrder[]>();

    const totalOrders = await Order.countDocuments(query);

    // Process each order to add return information
const processedOrders: EnhancedOrder[] = await Promise.all(
  orders.map(async (order) => {
    // Check if order has any active returns
    const activeReturn = await Return.findOne({
      orderId: order._id,
      returnStatus: { $in: ["requested", "approved"] }
    }).lean<LeanReturn>();

    // Update return eligibility based on current date
    const now = new Date();
    const canReturnNow = Boolean(
      order.canReturn && 
      order.returnDeadline && 
      now <= order.returnDeadline && 
      !activeReturn &&
      order.orderStatus === "delivered"
    );

    // Calculate days remaining for return
    let daysRemainingForReturn = 0;
    if (order.returnDeadline && canReturnNow) {
      const timeDiff = order.returnDeadline.getTime() - now.getTime();
      daysRemainingForReturn = Math.ceil(timeDiff / (1000 * 3600 * 24));
    }

    return {
      ...order,
      canReturn: canReturnNow,
      hasActiveReturn: !!activeReturn,
      daysRemainingForReturn,
      returnInfo: {
        canReturn: canReturnNow,  // Now definitely a boolean
        hasActiveReturn: !!activeReturn,
        daysRemaining: daysRemainingForReturn,
        returnDeadline: order.returnDeadline,
        activeReturnId: activeReturn?._id,
        activeReturnStatus: activeReturn?.returnStatus,
      },
          // Calculate order summary
          orderSummary: {
            totalItems: order.items?.length || 0,
            totalServices: order.services?.length || 0,
            totalQuantity: order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0,
            subtotal: order.subtotal || 0,
            gst: order.gst || 0,
            discount: order.discount || 0,
            transportCharge: order.transportCharge || 0,
            laborCharges: order.laborCharges || 0,
            total: order.total || 0,
          },
          // Format delivery information
          deliveryInfo: {
            status: order.orderStatus,
            deliveredAt: order.deliveredAt,
            estimatedDelivery: order.items?.[0]?.estimatedDelivery || "7-10 days",
            address: order.address,
            transportType: order.transportType,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      orders: processedOrders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        hasNextPage: page < Math.ceil(totalOrders / limit),
        hasPrevPage: page > 1,
      },
      filters: {
        userId,
        orderId,
        status,
        canReturn,
      },
    });

  } catch (error) {
    console.error("❌ Orders fetch error:", error);
    return NextResponse.json({
      error: "Server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload: CreateOrderPayload = await req.json();
    
    const {
      amount,
      customer,
      order_meta,
      payment_methods = "cc,dc,upi",
      items = [],
      services = [],
      address,
      transportType,
      transportCharge,
      laborCharges,
      subtotal,
      gst,
      discount,
      coupon,
      total,
    } = payload;

    console.log("📦 Order creation request:", {
      amount,
      customer,
      itemsCount: items.length,
      servicesCount: services.length,
      total
    });

    // Validation
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    if (!customer?.customer_email || !customer?.customer_id) {
      return NextResponse.json({ error: "Customer details required" }, { status: 400 });
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
    }

    if (!address || !address.addressLine1) {
      return NextResponse.json({ error: "Delivery address is required" }, { status: 400 });
    }

    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await mongooseConnect();

    // Process items - ensure each item has required fields and generate IDs
    const processedItems: OrderItem[] = items.map((item, index) => ({
      id: item.id || `item_${index}_${Date.now()}`,
      productId: item.productId,
      productName: item.productName,
      productPrice: item.productPrice,
      productDiscountedPrice: item.productDiscountedPrice,
      productImage: item.productImage,
      desc: item.desc || {},
      brand: item.brand || {},
      quantity: item.quantity || 1,
      variantIndex: item.variantIndex || 0,
      variantName: item.variantName || '',
      includeLabor: item.includeLabor || false,
      laborFloors: item.laborFloors || 0,
      laborPerFloor: item.laborPerFloor || 0,
      applicability: item.applicability || 0,
      loadingUnloadingPrice: item.loadingUnloadingPrice || 0,
      estimatedDelivery: item.estimatedDelivery || '7-10 days',
      addedAt: item.addedAt || new Date().toISOString(),
    }));

    // Process services - ensure each service has required fields and generate IDs
    const processedServices: OrderService[] = services.map((service, index) => ({
      id: service.id || `service_${index}_${Date.now()}`,
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      quantity: service.quantity || 1,
    }));

    // Calculate estimated delivery date (7 days from now as default)
    const estimatedDeliveryDate = new Date();
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 7);

    // Create the order with all details
    const newOrder = await Order.create({
      userId: customer.customer_id,
      sessionId: orderId,
      items: processedItems,
      services: processedServices,
      address: {
        name: address.name,
        phone: address.phone,
        addressLine1: address.addressLine1,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country || 'India',
        type: address.type || 'HOME',
        coordinates: address.coordinates || { lat: 0, lng: 0 },
        distanceFromCenter: address.distanceFromCenter || 0,
      },
      transportType: transportType || 'standard',
      transportCharge: transportCharge || 0,
      laborCharges: laborCharges || 0,
      subtotal: subtotal || 0,
      gst: gst || 0,
      discount: discount || 0,
      total: total || amount,
      coupon: coupon || null,
      paymentStatus: "pending",
      orderStatus: "placed",
      createdAt: new Date(),
      // Initialize return-related fields
      canReturn: false,
      hasActiveReturn: false,
      deliveredAt: null,
      returnDeadline: null,
    });

    console.log("✅ Order created successfully:", {
      orderId,
      totalItems: processedItems.length,
      totalServices: processedServices.length,
      totalAmount: total || amount,
      mongoOrderId: newOrder._id
    });

    // Call Cashfree API to create payment session
    const cashfreePayload = {
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: customer.customer_id,
        customer_name: customer.customer_name,
        customer_email: customer.customer_email,
        customer_phone: customer.customer_phone,
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?order_id=${orderId}`,
        notify_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/webhook?order_id=${orderId}`,
        ...order_meta,
      },
      payment_methods: payment_methods,
    };

    console.log("📤 Sending to Cashfree:", JSON.stringify(cashfreePayload, null, 2));

    const res = await fetch("https://sandbox.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": process.env.CASHFREE_APP_ID!,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY!,
        "x-api-version": "2023-08-01",
      },
      body: JSON.stringify(cashfreePayload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("❌ Cashfree create order failed:", data);
      
      // Clean up the order if Cashfree fails
      await Order.deleteOne({ sessionId: orderId });
      
      return NextResponse.json(
        { error: data.message || "Failed to create order" },
        { status: 400 }
      );
    }

    console.log("✅ Cashfree order created successfully:", data);

    return NextResponse.json({
      payment_session_id: data.payment_session_id,
      order_id: orderId,
      order_token: data.order_token,
      order_details: {
        mongo_order_id: newOrder._id,
        total_items: processedItems.length,
        total_services: processedServices.length,
        total_amount: total || amount,
        estimated_delivery: estimatedDeliveryDate.toISOString(),
      },
    });

  } catch (error) {
    console.error("❌ Order creation error:", error);
    return NextResponse.json({
      error: "Server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}