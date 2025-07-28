import { NextRequest, NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import { ObjectId } from 'mongodb';
import Order from "@/models/Order";
import Return from "@/models/Return";
import nodemailer from "nodemailer";

// Types for return request
interface ReturnItem {
  cartItemId?: string;
  productId: string | ObjectId;
  productName?: string;
  quantity: number;
  reason: string;
  condition: string;
  images?: string[];
  refundAmount?: number;
  refundMethod?: string;
}

interface ReturnRequestPayload {
  orderId: string;
  userId: string;
  returnItems: ReturnItem[];
  returnReason: string;
  refundMethod?: string;
}

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
}

interface PopulatedUser {
  _id: ObjectId;
  name: string;
  email: string;
  phone: string;
}

interface LeanOrder {
  _id: ObjectId;
  userId: PopulatedUser;
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
  paymentStatus: string;
  orderStatus: string;
  canReturn: boolean;
  hasActiveReturn: boolean;
  returnDeadline?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<void>;
}

interface LeanReturn {
  _id: ObjectId;
  orderId: ObjectId;
  userId: ObjectId;
  returnItems: ReturnItem[];
  totalRefundAmount: number;
  returnReason: string;
  returnStatus: string;
  refundMethod?: string;
  requestedAt: Date;
}

interface ProcessedReturnItem extends ReturnItem {
  cartItemId: string;
  productId: ObjectId | string;
  productName: string;
  refundAmount: number;
  refundMethod: string;
}

export async function POST(req: NextRequest) {
  try {
    const payload: ReturnRequestPayload = await req.json();
    
    const {
      orderId,
      userId,
      returnItems,
      returnReason,
      refundMethod = "original"
    } = payload;

    // Validation
    if (!orderId || !userId || !returnItems || !Array.isArray(returnItems) || returnItems.length === 0) {
      return NextResponse.json({ 
        error: "Order ID, User ID, and return items are required" 
      }, { status: 400 });
    }

    if (!returnReason || returnReason.trim().length === 0) {
      return NextResponse.json({ 
        error: "Return reason is required" 
      }, { status: 400 });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(orderId)) {
      return NextResponse.json({ 
        error: "Invalid order ID format" 
      }, { status: 400 });
    }

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ 
        error: "Invalid user ID format" 
      }, { status: 400 });
    }

    await mongooseConnect();

    // Find the order with populated user data
    const order = await Order.findById(orderId)
      .populate('userId', 'name email phone')
      .lean<LeanOrder>();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if user owns the order
    if (order.userId._id.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if order is eligible for return
    const now = new Date();
    if (!order.canReturn || !order.returnDeadline || now > order.returnDeadline) {
      return NextResponse.json({ 
        error: "This order is not eligible for return. Return window may have expired." 
      }, { status: 400 });
    }

    if (order.orderStatus !== "delivered") {
      return NextResponse.json({ 
        error: "Only delivered orders can be returned" 
      }, { status: 400 });
    }

    // Check for existing active return
    const existingReturn = await Return.findOne({
      orderId: new ObjectId(orderId),
      returnStatus: { $in: ["requested", "approved", "in_progress"] }
    }).lean<LeanReturn>();

    if (existingReturn) {
      return NextResponse.json({ 
        error: "An active return request already exists for this order" 
      }, { status: 400 });
    }

    // Validate return items against order items
    const validReturnItems: ProcessedReturnItem[] = [];
    let totalRefundAmount = 0;

    for (const returnItem of returnItems) {
      // Validate return item fields
      if (!returnItem.productId || !returnItem.quantity || !returnItem.reason || !returnItem.condition) {
        return NextResponse.json({ 
          error: "Each return item must have productId, quantity, reason, and condition" 
        }, { status: 400 });
      }

      if (returnItem.quantity <= 0) {
        return NextResponse.json({ 
          error: "Return quantity must be greater than 0" 
        }, { status: 400 });
      }

      // Find the matching order item
      const orderItem = order.items.find(item => {
        const itemId = item.id || item.productId.toString();
        const returnProductId = returnItem.productId.toString();
        const returnCartItemId = returnItem.cartItemId;
        
        return itemId === returnCartItemId || 
               item.productId.toString() === returnProductId ||
               itemId === returnProductId;
      });

      if (!orderItem) {
        return NextResponse.json({ 
          error: `Invalid item: ${returnItem.productId}. Item not found in order.` 
        }, { status: 400 });
      }

      // Check if quantity is valid
      if (returnItem.quantity > orderItem.quantity) {
        return NextResponse.json({ 
          error: `Cannot return more items than ordered for ${orderItem.productName}. Ordered: ${orderItem.quantity}, Requested: ${returnItem.quantity}` 
        }, { status: 400 });
      }

      // Calculate refund amount
      const itemPrice = orderItem.productDiscountedPrice || orderItem.productPrice;
      const refundAmount = itemPrice * returnItem.quantity;

      const processedReturnItem: ProcessedReturnItem = {
        cartItemId: returnItem.cartItemId || orderItem.id || orderItem.productId.toString(),
        productId: orderItem.productId,
        productName: orderItem.productName,
        quantity: returnItem.quantity,
        reason: returnItem.reason.trim(),
        condition: returnItem.condition.trim(),
        images: returnItem.images || [],
        refundAmount: refundAmount,
        refundMethod: returnItem.refundMethod || refundMethod
      };

      validReturnItems.push(processedReturnItem);
      totalRefundAmount += refundAmount;
    }

    // Additional validation
    if (totalRefundAmount <= 0) {
      return NextResponse.json({ 
        error: "Total refund amount must be greater than 0" 
      }, { status: 400 });
    }

    if (totalRefundAmount > order.total) {
      return NextResponse.json({ 
        error: "Total refund amount cannot exceed order total" 
      }, { status: 400 });
    }

    // Create return request
    const returnRequest = await Return.create({
      orderId: new ObjectId(orderId),
      userId: new ObjectId(userId),
      returnItems: validReturnItems,
      totalRefundAmount: totalRefundAmount,
      returnReason: returnReason.trim(),
      returnStatus: "requested",
      refundMethod: refundMethod,
      requestedAt: new Date(),
      plyCreditsCredited: false,
      plyCreditsAmount: 0
    });

    // Update order to reflect active return
    await Order.findByIdAndUpdate(orderId, {
      hasActiveReturn: true,
      updatedAt: new Date()
    });

    // Send email notification
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      });

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5aa0; text-align: center; margin-bottom: 30px;">Return Request Received</h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0;">Return Request Details</h3>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Return Request ID:</strong> ${returnRequest._id}</p>
            <p><strong>Customer:</strong> ${order.userId.name}</p>
            <p><strong>Email:</strong> ${order.userId.email}</p>
            <p><strong>Phone:</strong> ${order.userId.phone}</p>
            <p><strong>Requested Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Return Reason:</strong> ${returnReason}</p>
            <p><strong>Refund Method:</strong> ${refundMethod}</p>
            <p><strong>Total Refund Amount:</strong> ₹${totalRefundAmount.toFixed(2)}</p>
          </div>

          <div style="background-color: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0;">Items to Return</h3>
            ${validReturnItems.map(item => `
              <div style="border-bottom: 1px solid #eee; padding: 15px 0; margin-bottom: 15px;">
                <p><strong>Product:</strong> ${item.productName}</p>
                <p><strong>Quantity:</strong> ${item.quantity}</p>
                <p><strong>Reason:</strong> ${item.reason}</p>
                <p><strong>Condition:</strong> ${item.condition}</p>
                <p><strong>Refund Amount:</strong> ₹${item.refundAmount.toFixed(2)}</p>
                ${item.images && item.images.length > 0 ? `<p><strong>Images:</strong> ${item.images.length} attached</p>` : ''}
              </div>
            `).join('')}
          </div>

          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <h4 style="color: #856404; margin-top: 0;">Next Steps</h4>
            <p style="color: #856404; margin-bottom: 0;">
              Your return request has been submitted successfully. Our team will review your request and contact you within 24-48 hours with further instructions.
            </p>
          </div>

          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <h4 style="color: #155724; margin-top: 0;">Order Information</h4>
            <p style="color: #155724; margin-bottom: 5px;"><strong>Original Order Total:</strong> ₹${order.total.toFixed(2)}</p>
            <p style="color: #155724; margin-bottom: 5px;"><strong>Delivery Address:</strong> ${order.address.name}, ${order.address.addressLine1}, ${order.address.city}</p>
            <p style="color: #155724; margin-bottom: 0;"><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 14px;">
              If you have any questions, please contact our customer support team.
            </p>
          </div>
        </div>
      `;

      // Send email to customer
      await transporter.sendMail({
        from: `"Ply Picker" <${process.env.MAIL_USER}>`,
        to: order.userId.email,
        subject: `Return Request Submitted - Order #${orderId}`,
        html: emailHtml,
      });

      // Send notification to admin
            // Send notification to admin
      await transporter.sendMail({
        from: `"Ply Picker" <${process.env.MAIL_USER}>`,
        to: process.env.ADMIN_EMAIL || 'admin@example.com',
        subject: `New Return Request - Order #${orderId}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c5aa0; text-align: center; margin-bottom: 30px;">New Return Request</h2>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #333; margin-top: 0;">Return Request Details</h3>
              <p><strong>Order ID:</strong> ${orderId}</p>
              <p><strong>Return Request ID:</strong> ${returnRequest._id}</p>
              <p><strong>Customer:</strong> ${order.userId.name}</p>
              <p><strong>Email:</strong> ${order.userId.email}</p>
              <p><strong>Phone:</strong> ${order.userId.phone}</p>
              <p><strong>Requested Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Return Reason:</strong> ${returnReason}</p>
              <p><strong>Refund Method:</strong> ${refundMethod}</p>
              <p><strong>Total Refund Amount:</strong> ₹${totalRefundAmount.toFixed(2)}</p>
            </div>

            <div style="background-color: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h3 style="color: #333; margin-top: 0;">Items to Return</h3>
              ${validReturnItems.map(item => `
                <div style="border-bottom: 1px solid #eee; padding: 15px 0; margin-bottom: 15px;">
                  <p><strong>Product:</strong> ${item.productName}</p>
                  <p><strong>Quantity:</strong> ${item.quantity}</p>
                  <p><strong>Reason:</strong> ${item.reason}</p>
                  <p><strong>Condition:</strong> ${item.condition}</p>
                  <p><strong>Refund Amount:</strong> ₹${item.refundAmount.toFixed(2)}</p>
                  ${item.images && item.images.length > 0 ? `<p><strong>Images:</strong> ${item.images.length} attached</p>` : ''}
                </div>
              `).join('')}
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.ADMIN_URL}/returns/${returnRequest._id}" 
                 style="background-color: #2c5aa0; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View Return Request
              </a>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send email notification:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ 
      success: true, 
      returnRequestId: returnRequest._id,
      message: "Return request submitted successfully" 
    }, { status: 201 });

  } catch (error) {
    console.error("Error processing return request:", error);
    return NextResponse.json({ 
      error: "An error occurred while processing your return request" 
    }, { status: 500 });
  }
}