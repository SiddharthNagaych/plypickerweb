import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IGroup extends Document {
  name: string;
  category: mongoose.Types.ObjectId;
  subcategory: mongoose.Types.ObjectId;
  city: "Pune" | "Navi Mumbai" | "Mumbai";
}

const GroupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },
    subcategory: {
      type: Schema.Types.ObjectId,
      ref: "Subcategory",
      required: true
    },
    city: {
      type: String,
      enum: ["Pune", "Navi Mumbai", "Mumbai"],
      required: true
    }
  },
  { timestamps: true }
);

export default models.Group || model<IGroup>("Group", GroupSchema);
