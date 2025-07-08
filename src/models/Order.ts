import mongoose, { Schema, model, models } from "mongoose";

const orderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    items: [
      {
        id: String, // Add this field as it's referenced in ReturnItem
        productId: { type: Schema.Types.ObjectId, required: true, ref: "Product" },
        productName: String,
        productPrice: Number,
        productDiscountedPrice: Number,
        productImage: String,
        desc: {
          Box_Packing: String,
          Size: String,
          Colour: String,
          Material: String,
        },
        brand: {
          _id: Schema.Types.ObjectId,
          Brand_name: String,
        },
        quantity: Number,
        variantIndex: Number,
        variantName: String,
        includeLabor: Boolean,
        laborFloors: Number,
        laborPerFloor: Number,
        applicability: Number,
        loadingUnloadingPrice: Number,
        estimatedDelivery: String,
        addedAt: String,
      },
    ],

    services: [
      {
        id: String,
        name: String,
        description: String,
        price: Number,
        duration: String,
        quantity: Number,
      },
    ],

    address: {
      name: String,
      phone: String,
      addressLine1: String,
      city: String,
      state: String,
      pincode: String,
      country: String,
      type: { type: String, enum: ["HOME", "WORK", "OTHER"] },
      coordinates: {
        lat: Number,
        lng: Number,
      },
      distanceFromCenter: Number,
    },

    transportType: { type: String, enum: ["bike", "three_wheeler", "tempo", "pickup", "standard"] },
    transportCharge: Number,
    laborCharges: Number,
    subtotal: Number,
    gst: Number,
    discount: Number,
    total: Number,

    coupon: {
      id: String,
      code: String,
      discount: Number,
      type: { type: String, enum: ["percentage", "fixed"] },
      minOrder: Number,
      validUntil: String,
    },

    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    orderStatus: {
      type: String,
      enum: ["placed", "processing", "shipped", "delivered", "cancelled"],
      default: "placed",
    },

    sessionId: String, // for tracking guest sessions if needed
    
    // Return-related fields
    deliveredAt: Date,
    returnDeadline: Date,
    hasActiveReturn: {
      type: Boolean,
      default: false
    },
    canReturn: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Add indexes for better query performance on return-related fields
orderSchema.index({ userId: 1, orderStatus: 1 });
orderSchema.index({ deliveredAt: 1 });
orderSchema.index({ returnDeadline: 1 });
orderSchema.index({ hasActiveReturn: 1 });
orderSchema.index({ canReturn: 1 });

const Order = models.Order || model("Order", orderSchema);
export default Order;