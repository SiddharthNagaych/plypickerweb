import { Schema, model, models } from "mongoose";

const pcashSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true 
  },

  credited: [
    {
      amount: { 
        type: Number, 
        required: true,
        min: 0 
      },
      reason: { 
        type: String,
        enum: ["return_refund", "referral", "promotion", "other"], // Added specific reasons
        required: true 
      },
      source: String,
      orderId: { type: Schema.Types.ObjectId, ref: "Order" }, // Added to link to orders
      returnId: { type: Schema.Types.ObjectId, ref: "Return" }, // Added to link to returns
      productId: { type: Schema.Types.ObjectId, ref: "Product" },
      creditedAt: { type: Date, default: Date.now },
      expiresAt: Date,
      status: { 
        type: String,
        enum: ["active", "expired", "used"],
        default: "active"
      }
    },
  ],

  consumed: [
    {
      amount: { 
        type: Number, 
        required: true,
        min: 0 
      },
      orderId: { type: Schema.Types.ObjectId, ref: "Order" }, // Added to link to orders
      productId: { type: Schema.Types.ObjectId, ref: "Product" },
      usedAt: { type: Date, default: Date.now },
      remainingBalance: Number // Track balance after each use
    },
  ],
  
  // Add summary fields for easier queries
  totalCredited: {
    type: Number,
    default: 0
  },
  totalConsumed: {
    type: Number,
    default: 0
  },
  currentBalance: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true 
});

// Add indexes for better performance
pcashSchema.index({ userId: 1, "credited.status": 1 });
pcashSchema.index({ "credited.expiresAt": 1 });
pcashSchema.index({ "credited.returnId": 1 });

export default models.PCash || model("PCash", pcashSchema);