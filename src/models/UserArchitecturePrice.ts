// models/UserArchitecturePrice.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUserArchitecturePrice extends Document {
  userId: Types.ObjectId;
  serviceId: Types.ObjectId;
  variant: string;
  variantId?: string; // Add variant ID for better tracking
  city: string;
  finalPrice: number;
  discountedPrice?: number;
  discountedPercent?: number;
  priceRequestId?: Types.ObjectId; // Link to the original price request
  validUntil?: Date; // Price validity period
  status?: "active" | "expired" | "used";
}

const UserArchitecturePriceSchema = new Schema<IUserArchitecturePrice>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: "ArchitectureService", required: true },
    variant: { type: String, required: true },
    variantId: { type: String }, // Store variant identifier for easier lookup
    city: { type: String, required: true },
    finalPrice: { type: Number, required: true },
    discountedPrice: { type: Number },
    discountedPercent: { type: Number },
    priceRequestId: { type: Schema.Types.ObjectId, ref: "PriceRequest" },
    validUntil: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }, // 30 days validity
    status: { 
      type: String, 
      enum: ["active", "expired", "used"], 
      default: "active" 
    }
  },
  { timestamps: true }
);

// Add indexes for better query performance
UserArchitecturePriceSchema.index({ userId: 1, serviceId: 1, variant: 1 }, { unique: true });
UserArchitecturePriceSchema.index({ serviceId: 1, variant: 1, city: 1 });
UserArchitecturePriceSchema.index({ status: 1, validUntil: 1 });

export default mongoose.models.UserArchitecturePrice ||
  mongoose.model<IUserArchitecturePrice>(
    "UserArchitecturePrice",
    UserArchitecturePriceSchema
  );
