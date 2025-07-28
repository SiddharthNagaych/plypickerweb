import mongoose, { Schema, Document, Types } from "mongoose";

export interface IServicePriceRequest extends Document {
  serviceId: Types.ObjectId;
  variantId: Types.ObjectId; // Changed from optional string to required ObjectId
  city: string;
  variantName: string; // Renamed from 'variant' for clarity
  userId?: Types.ObjectId;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  status: "pending" | "completed" | "expired";
  requestedAt: Date;
  completedAt?: Date;
  finalPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ServicePriceRequestSchema = new Schema<IServicePriceRequest>(
  {
    serviceId: { 
      type: Schema.Types.ObjectId, 
      ref: "Service",
      required: true,
      index: true 
    },
    variantId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Service.variants._id", // Reference to variant subdocument
      index: true
    },
    city: { 
      type: String, 
      required: true,
      index: true 
    },
    variantName: { 
      type: String, 
      required: true,
      index: true 
    },
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User",
      index: true 
    },
    userName: String,
    userPhone: String,
    userEmail: String,
    status: {
      type: String,
      enum: ["pending", "completed", "expired"],
      default: "pending",
      index: true
    },
    requestedAt: { 
      type: Date, 
      default: Date.now 
    },
    completedAt: { 
      type: Date 
    },
    finalPrice: { 
      type: Number 
    }
  },
  { 
    timestamps: true // Adds createdAt and updatedAt automatically
  }
);

// Compound indexes for optimized queries
ServicePriceRequestSchema.index({ 
  serviceId: 1, 
  variantId: 1,
  status: 1 
});

ServicePriceRequestSchema.index({ 
  userId: 1, 
  status: 1,
  createdAt: -1 
});

// Text index for search functionality
ServicePriceRequestSchema.index({
  variantName: "text",
  userName: "text",
  userEmail: "text"
});

// Pre-save hook for data validation
ServicePriceRequestSchema.pre("save", function(next) {
  if (this.status === "completed" && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

// Transform for API responses
ServicePriceRequestSchema.set("toJSON", {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.models.ServicePriceRequest || 
  mongoose.model<IServicePriceRequest>(
    "ServicePriceRequest", 
    ServicePriceRequestSchema
  );