import mongoose, { Schema, Document, model, models } from "mongoose";

export interface ISubcategory extends Document {
  name: string;
  category: mongoose.Types.ObjectId;
  city: "Pune" | "Navi Mumbai" | "Mumbai";
}

const SubcategorySchema = new Schema<ISubcategory>(
  {
    name: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    city: {
      type: String,
      enum: ["Pune", "Navi Mumbai", "Mumbai"],
      required: true
    }
  },
  { timestamps: true }
);

export default models.Subcategory || model<ISubcategory>("Subcategory", SubcategorySchema);
