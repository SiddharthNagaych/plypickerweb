import mongoose, { Schema, Document, Types } from "mongoose";

export interface IArchitecturePriceRequest extends Document {
  serviceId: Types.ObjectId;
  variantId: Types.ObjectId; // Changed from optional string to required ObjectId
  city: string;
  variantName: string; // Human-readable name for display
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

const ArchitecturePriceRequestSchema = new Schema<IArchitecturePriceRequest>(
  {
    serviceId: { 
      type: Schema.Types.ObjectId, 
      ref: "ArchitectureService",
      required: true,
      index: true 
    },
    variantId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "ArchitectureService.variants._id", // Reference to variant subdocument
      index: true
    },
    city: { 
      type: String, 
      required: true,
      index: true 
    },
    variantName: { 
      type: String, 
      required: true 
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
ArchitecturePriceRequestSchema.index({ 
  serviceId: 1, 
  variantId: 1,
  status: 1 
});

ArchitecturePriceRequestSchema.index({ 
  userId: 1, 
  status: 1,
  createdAt: -1 
});

// Text index for search functionality
ArchitecturePriceRequestSchema.index({
  variantName: "text",
  userName: "text",
  userEmail: "text"
});

// Pre-save hook for data validation
ArchitecturePriceRequestSchema.pre("save", function(next) {
  if (this.status === "completed" && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

// Transform for API responses
ArchitecturePriceRequestSchema.set("toJSON", {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.models.ArchitecturePriceRequest || 
  mongoose.model<IArchitecturePriceRequest>(
    "ArchitecturePriceRequest", 
    ArchitecturePriceRequestSchema
  );