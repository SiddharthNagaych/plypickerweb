// models/Coupon.ts
import mongoose, { Schema, model, models, Document, Types } from "mongoose";
// FIXED: Interface for Coupon document with proper _id
interface ICoupon extends Document {
  _id: Types.ObjectId; // Explicitly add _id
  code: string;
  type: "percentage" | "fixed";
  discount: number;
  minOrder: number;
  validUntil?: Date;
  assignedTo: Types.ObjectId[];
  category?: Types.ObjectId;
  subcategory?: Types.ObjectId;
  group?: Types.ObjectId;
  subgroup?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}


const couponSchema = new Schema<ICoupon>({
  code: { type: String, required: true, unique: true },
  type: { type: String, enum: ["percentage", "fixed"], required: true },
  discount: { type: Number, required: true },
  minOrder: { type: Number, default: 0 },
  validUntil: { type: Date },
  assignedTo: [{ type: Schema.Types.ObjectId, ref: "User" }],
  category: { type: Schema.Types.ObjectId, ref: "Category" },
  subcategory: { type: Schema.Types.ObjectId, ref: "Subcategory" },
  group: { type: Schema.Types.ObjectId, ref: "Group" },
  subgroup: { type: Schema.Types.ObjectId, ref: "Subgroup" },
}, { timestamps: true });

const Coupon = models.Coupon as mongoose.Model<ICoupon> || model<ICoupon>("Coupon", couponSchema);

export default Coupon;
