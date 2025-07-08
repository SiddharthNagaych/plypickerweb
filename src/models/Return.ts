import mongoose, { Schema, model, models } from "mongoose";

const returnSchema = new Schema({
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  returnItems: [{
    cartItemId: {
      type: String,
      required: true
    },
    productId: {
      type: Schema.Types.ObjectId, // Changed from String to ObjectId
      ref: 'Product',
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    reason: {
      type: String,
      required: true
    },
    condition: {
      type: String,
      enum: ["damaged", "defective", "wrong_item", "not_as_described", "other"],
      required: true
    },
    images: [String],
    refundAmount: {
      type: Number,
      required: true,
      min: 0
    },
    refundMethod: { // Added refund method per item
      type: String,
      enum: ["original", "credit"],
      default: "original"
    }
  }],
  totalRefundAmount: {
    type: Number,
    required: true,
    min: 0
  },
  returnReason: {
    type: String,
    required: true
  },
  returnStatus: {
    type: String,
    enum: ["requested", "approved", "rejected", "refunded", "partially_refunded"],
    default: "requested",
    index: true
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: Date,
  rejectedAt: Date,
  rejectionReason: String,
  refundProcessedAt: Date,
  refundTransactionId: String,
  refundMethod: { // Added overall refund method
    type: String,
    enum: ["original", "credit", "partial"],
    default: "original"
  },
  plyCreditsCredited: {
    type: Boolean,
    default: false
  },
  plyCreditsAmount: Number,
  plyCreditsCreditedAt: Date,
  adminNotes: String,
  processedBy: String,
  trackingNumber: String, // Added for return shipments
  carrier: String // Added for return shipments
}, {
  timestamps: true
});

// Add compound indexes for better query performance
returnSchema.index({ orderId: 1, returnStatus: 1 });
returnSchema.index({ userId: 1, returnStatus: 1 });
returnSchema.index({ refundProcessedAt: 1 });
returnSchema.index({ plyCreditsCredited: 1 });

const Return = models.Return || model("Return", returnSchema);
export default Return;