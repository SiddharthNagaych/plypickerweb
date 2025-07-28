import mongoose, { Schema, model, models, Document } from "mongoose";

interface IAddress {
  name: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  type: "HOME" | "WORK" | "OTHER";
  addressType?: "SHIPPING" | "BILLING" | "BOTH";
  coordinates?: {
    lat: number;
    lng: number;
  };
  distanceFromCenter?: number;
  companyName?: string;
  gstNumber?: string;
  email?: string;
}

interface ICoupon {
  id: string;
  code: string;
  discount: number;
  type: "percentage" | "fixed";
  minOrder?: number;
  validUntil?: string;
}

interface IOrderItem {
  id: string;
  productId: mongoose.Types.ObjectId;
  productName: string;
  productPrice: number;
  productDiscountedPrice?: number;
  productImage?: string;
  desc: {
    Box_Packing?: string;
    Size?: string;
    Colour?: string;
    Material?: string;
  };
  brand: {
    _id: mongoose.Types.ObjectId;
    Brand_name: string;
  };
  quantity: number;
  variantIndex?: number;
  variantName?: string;
  includeLabor?: boolean;
  laborFloors?: number;
  laborPerFloor?: number;
  applicability?: number;
  loadingUnloadingPrice?: number;
  estimatedDelivery?: string;
  addedAt: string;
}

// Updated interface with webhook-specific fields
interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IAddress;
  billingAddress: IAddress;
  transportType: "bike" | "three_wheeler" | "tempo" | "pickup" | "standard";
  transportCharge: number;
  laborCharges: number;
  subtotal: number;
  gst: number;
  discount: number;
  total: number;
  coupon?: ICoupon;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  orderStatus: "placed" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "returned";
  sessionId?: string;
  gstDetails?: {
    number?: string;
    companyName?: string;
    verified?: boolean;
  };
  // Webhook-specific fields
  type?: "product" | "service";
  paymentDetails?: {
    mode?: string;
    time?: Date;
    amount?: number;
    transactionId?: string;
    processedAt?: Date;
  };
  webhookIdempotencyKey?: string;
  advancePayment?: boolean;
  deliveredAt?: Date;
  returnDeadline?: Date;
  hasActiveReturn?: boolean;
  canReturn?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        id: { type: String, required: true },
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        productName: { type: String, required: true },
        productPrice: { type: Number, required: true },
        productDiscountedPrice: Number,
        productImage: String,
        desc: {
          Box_Packing: String,
          Size: String,
          Colour: String,
          Material: String,
        },
        brand: {
          _id: { type: Schema.Types.ObjectId, ref: "Brand" },
          Brand_name: String,
        },
        quantity: { type: Number, default: 1 },
        variantIndex: Number,
        variantName: String,
        includeLabor: { type: Boolean, default: false },
        laborFloors: { type: Number, default: 1 },
        laborPerFloor: Number,
        applicability: Number,
        loadingUnloadingPrice: Number,
        estimatedDelivery: String,
        addedAt: { type: String, default: new Date().toISOString() },
      },
    ],
    shippingAddress: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine1: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: "India" },
      type: { type: String, enum: ["HOME", "WORK", "OTHER"], default: "HOME" },
      addressType: { type: String, enum: ["SHIPPING", "BILLING", "BOTH"], default: "SHIPPING" },
      coordinates: {
        lat: Number,
        lng: Number,
      },
      distanceFromCenter: Number,
      companyName: String,
      gstNumber: String,
      email: String,
    },
    billingAddress: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine1: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: "India" },
      type: { type: String, enum: ["HOME", "WORK", "OTHER"], default: "HOME" },
      addressType: { type: String, enum: ["SHIPPING", "BILLING", "BOTH"], default: "BILLING" },
      coordinates: {
        lat: Number,
        lng: Number,
      },
      distanceFromCenter: Number,
      companyName: String,
      gstNumber: String,
      email: String,
    },
    transportType: {
      type: String,
      enum: ["bike", "three_wheeler", "tempo", "pickup", "standard"],
      default: "bike",
    },
    transportCharge: { type: Number, default: 0 },
    laborCharges: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
    gst: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    coupon: {
      id: String,
      code: String,
      discount: Number,
      type: { type: String, enum: ["percentage", "fixed"] },
      minOrder: Number,
      validUntil: String,
    },
    // Updated payment status to include refunded
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    // Updated order status to include confirmed and returned
    orderStatus: {
      type: String,
      enum: ["placed", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"],
      default: "placed",
    },
    sessionId: String,
    gstDetails: {
      number: String,
      companyName: String,
      verified: { type: Boolean, default: false },
    },
    // Webhook-specific fields
    type: {
      type: String,
      enum: ["product", "service"],
      default: "product",
    },
    paymentDetails: {
      mode: String,
      time: Date,
      amount: Number,
      transactionId: String,
      processedAt: Date,
    },
    webhookIdempotencyKey: {
      type: String,
      unique: true,
      sparse: true, // Allows null values while maintaining uniqueness for non-null values
    },
    advancePayment: {
      type: Boolean,
      default: false,
    },
    deliveredAt: Date,
    returnDeadline: Date,
    hasActiveReturn: { type: Boolean, default: false },
    canReturn: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
orderSchema.index({ userId: 1, orderStatus: 1 });
orderSchema.index({ deliveredAt: 1 });
orderSchema.index({ returnDeadline: 1 });
orderSchema.index({ hasActiveReturn: 1 });
orderSchema.index({ canReturn: 1 });
orderSchema.index({ "shippingAddress.pincode": 1 });
orderSchema.index({ "billingAddress.pincode": 1 });
orderSchema.index({ "gstDetails.number": 1 }, { sparse: true });
orderSchema.index({ sessionId: 1 }, { sparse: true });
orderSchema.index({ "paymentDetails.transactionId": 1 }, { sparse: true });
orderSchema.index({ webhookIdempotencyKey: 1 }, { sparse: true });

const Order = models.Order || model<IOrder>("Order", orderSchema);
export default Order;