// models/Return.ts
import { Schema, model, models, Types } from "mongoose";

const ItemSchema = new Schema({
  cartItemId:   { type: String, required: true },          // client row‑id
  productId:    { type: Types.ObjectId, ref: "Product", required: true },
  variantId:    { type: Types.ObjectId, ref: "Variant" },  // ← NEW (colour/size)
  productName:  { type: String, required: true },
  quantity:     { type: Number, min: 1, required: true },
  reason:       { type: String, required: true },
  condition:    {
    type: String,
    enum: [
      "damaged",
      "defective",
      "wrong_item",
      "not_as_described",
      "other",
    ],
    required: true,
  },
  images:       [String],                                  // s3 / cloudinary urls
  refundAmount: { type: Number, min: 0, required: true },
  refundMethod: {
    type: String,
    enum: ["original", "credit"],
    default: "original",
  },
  itemStatus:   { type: String, enum: [
                   "requested","approved","rejected","received","refunded"],
                 default: "requested" },                   // ← NEW granular
});

const ReturnSchema = new Schema(
  {
    orderId:  { type: Types.ObjectId, ref: "Order", required: true, index: true },
    userId:   { type: Types.ObjectId, ref: "User",  required: true, index: true },
    returnItems: [ItemSchema],
    totalRefundAmount: { type: Number, min: 0, required: true },
    returnReason:  { type: String, required: true },
    returnStatus:  {
      type: String,
      enum: ["requested","approved","rejected","refunded","partially_refunded"],
      default: "requested",
      index: true,
    },
    logisticsLabelUrl: String,          // ← shipping label / QR
    trackingNumber: String,
    carrier:        String,
    // … financial bookkeeping
    refundProcessedAt: Date,
    refundTransactionId: String,
    refundMethod: { type: String, enum: ["original","credit","partial"], default:"original"},
    // PCash
    plyCreditsCredited: { type: Boolean, default: false },
    plyCreditsAmount: Number,
    plyCreditsCreditedAt: Date,
    // metadata
    adminNotes: String,
    processedBy: String,
  },
  { timestamps: true }
);

ReturnSchema.index({ orderId: 1, "returnItems.productId": 1 });
export default models.Return || model("Return", ReturnSchema);
