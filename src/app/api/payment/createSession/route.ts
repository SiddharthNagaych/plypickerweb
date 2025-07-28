import { NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import Order from "@/models/Order";
import { sendOrderConfirmationEmail } from "@/lib/emailService";

// Define interfaces with index signatures
interface Address {
  [key: string]: any; // Index signature
  name: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  type?: string;
  email?: string;
}

interface Customer {
  [key: string]: any; // Index signature
  customer_id: string;
  customer_email: string;
  customer_phone: string;
  customer_name?: string;
}

interface OrderItem {
  product_id: string;
  name: string;
  unit_price: number;
  quantity: number;
  specifications?: Record<string, unknown>;
}

interface GstDetails {
  company_name: string;
  gst_number: string;
  billing_address?: Address;
}

export async function POST(req: Request) {
  const startTime = Date.now();
  let orderId: string | null = null;

  try {
    console.log("ℹ️ [Payment] Starting payment session creation");

    const requestBody = await req.json();
    console.log("ℹ️ [Payment] Request body received:", JSON.stringify(requestBody, null, 2));

    const {
      amount,
      customer,
      order_meta,
      payment_methods = "cc,dc,upi",
      items,
      shipping_address,
      billing_address,
      transportType,
      transportCharge,
      laborCharges,
      subtotal,
      gst,
      discount,
      coupon,
      total,
      gst_details,
    } = requestBody;

    // Type assertions with proper typing
    const typedCustomer: Customer = customer;
    const typedItems: OrderItem[] = items;
    const typedShippingAddress: Address = shipping_address;
    const typedBillingAddress: Address | undefined = billing_address;
    const typedGstDetails: GstDetails | undefined = gst_details;

    console.log("ℹ️ [Payment] Validating request data...");

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount. Must be a positive number", received: amount },
        { status: 400 }
      );
    }

    // Create a type-safe field checker
    const hasRequiredFields = (obj: Record<string, any>, fields: string[]): boolean => {
      return fields.every(field => obj[field] !== undefined && obj[field] !== null);
    };

    const requiredCustomerFields = ["customer_id", "customer_email", "customer_phone"];
    if (!hasRequiredFields(typedCustomer, requiredCustomerFields)) {
      const missingCustomerFields = requiredCustomerFields.filter(field => !typedCustomer[field]);
      return NextResponse.json(
        { error: "Missing customer details", missingFields: missingCustomerFields },
        { status: 400 }
      );
    }

    const requiredShippingFields = ["name", "phone", "addressLine1", "city", "state", "pincode"];
    if (!hasRequiredFields(typedShippingAddress, requiredShippingFields)) {
      const missingShippingFields = requiredShippingFields.filter(field => !typedShippingAddress[field]);
      return NextResponse.json(
        {
          error: "Invalid shipping address",
          missingFields: missingShippingFields,
          receivedAddress: typedShippingAddress,
        },
        { status: 400 }
      );
    }

    if (!typedItems || typedItems.length === 0) {
      return NextResponse.json({ error: "Must include at least one item" }, { status: 400 });
    }

    orderId = `order_${Date.now()}`;
    console.log("ℹ️ [Payment] Generated order ID:", orderId);

    await mongooseConnect();
    console.log("✅ [Payment] Database connected");

    // Calculate subtotal if not provided
    const calculatedSubtotal = subtotal || typedItems.reduce(
      (sum: number, item: OrderItem) => sum + (item.unit_price * item.quantity),
      0
    );

    // Create order data with proper typing - FIXED FIELD MAPPING
    const orderData = {
      userId: typedCustomer.customer_id,
      sessionId: orderId,
      shippingAddress: {
        name: typedShippingAddress.name,
        phone: typedShippingAddress.phone,
        email: typedCustomer.customer_email,
        addressLine1: typedShippingAddress.addressLine1,
        city: typedShippingAddress.city,
        state: typedShippingAddress.state,
        pincode: typedShippingAddress.pincode,
        country: typedShippingAddress.country || "India",
        type: typedShippingAddress.type || "HOME",
      },
      billingAddress: {
        ...(typedBillingAddress || typedShippingAddress),
        type: typedBillingAddress?.type === "BILLING" ? "HOME" : (typedBillingAddress?.type || typedShippingAddress.type || "HOME"), // ✅ Convert BILLING to HOME
        email: typedCustomer.customer_email
      },
      transportType: transportType || "standard",
      transportCharge: transportCharge || 0,
      laborCharges: laborCharges || 0,
      subtotal: calculatedSubtotal,
      gst: gst || 0,
      discount: discount || 0,
      total: total || amount,
      coupon: coupon || null,
      gstDetails: typedGstDetails ? {
        companyName: typedGstDetails.company_name,
        gstNumber: typedGstDetails.gst_number,
        billingAddress: typedGstDetails.billing_address ? {
          ...typedGstDetails.billing_address,
          type: typedGstDetails.billing_address.type === "BILLING" ? "HOME" : (typedGstDetails.billing_address.type || "HOME") // ✅ Convert BILLING to HOME
        } : null
      } : null,
      paymentStatus: "pending",
      orderStatus: "placed",
      createdAt: new Date(),
      // ✅ FIXED: Map fields according to schema requirements
      items: typedItems.map((item: OrderItem) => ({
        id: item.product_id,           // ✅ FIXED: Schema expects 'id'
        productId: item.product_id,    // ✅ FIXED: Schema expects 'productId'
        productName: item.name,        // ✅ FIXED: Schema expects 'productName'
        productPrice: item.unit_price, // ✅ FIXED: Schema expects 'productPrice'
        quantity: item.quantity,
        specifications: item.specifications || {},
        addedAt: new Date(),
      })),
    };

    const newOrder = await Order.create(orderData);
    console.log("✅ [Payment] Order saved to database:", orderId);

    const cashfreePayload = {
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: typedCustomer.customer_id,
        customer_name: typedCustomer.customer_name || typedCustomer.customer_email.split("@")[0],
        customer_email: typedCustomer.customer_email,
        customer_phone: typedCustomer.customer_phone,
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
        notify_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/webhook?order_id=${orderId}`,
      },
      payment_methods,
    };

    const cashfreeStart = Date.now();
    const cashfreeResponse = await fetch("https://sandbox.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": process.env.CASHFREE_APP_ID!,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY!,
        "x-api-version": "2023-08-01",
      },
      body: JSON.stringify(cashfreePayload),
    });

    const cashfreeData = await cashfreeResponse.json();
    const cashfreeDuration = Date.now() - cashfreeStart;
    console.log(`ℹ️ [Payment] Cashfree API response (${cashfreeDuration}ms):`, JSON.stringify(cashfreeData, null, 2));

    if (!cashfreeResponse.ok) {
      await Order.deleteOne({ sessionId: orderId });
      return NextResponse.json(
        { error: cashfreeData.message || "Failed to create payment session" },
        { status: cashfreeResponse.status }
      );
    }

    try {
      await sendOrderConfirmationEmail({
        order: newOrder,
        customerEmail: typedCustomer.customer_email,
      });
      console.log("✅ [Payment] Product order confirmation email sent");
    } catch (emailError) {
      console.error("⚠️ [Payment] Email sending failed (non-critical):", emailError);
    }

    const totalDuration = Date.now() - startTime;
    console.log(`✅ [Payment] Payment session created successfully (total ${totalDuration}ms)`);

    return NextResponse.json({
      payment_session_id: cashfreeData.payment_session_id,
      order_id: orderId,
      order_token: cashfreeData.order_token,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    if (orderId) {
      try {
        await Order.deleteOne({ sessionId: orderId });
        console.log("✅ [Payment] Failed order cleaned up");
      } catch (dbError) {
        console.error("⚠️ [Payment] Failed to clean up order:", dbError);
      }
    }

    console.error("❌ [Payment] Unhandled server error:", error);

    return NextResponse.json(
      {
        error: "Payment processing failed",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}