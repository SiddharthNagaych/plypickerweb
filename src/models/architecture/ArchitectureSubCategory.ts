import mongoose, { Schema, model, models, Document } from "mongoose";

export interface IArchitectureSubcategory extends Document {
  name: string;
  category: mongoose.Types.ObjectId; // Ref to ArchitectureCategory
  city: City;
  order: number;
  image?: string;
}

const ArchitectureSubcategorySchema = new Schema<IArchitectureSubcategory>(
  {
    name: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: "ArchitectureCategory", required: true },
    city: { type: String, enum: ["Pune", "Mumbai", "Navi Mumbai"], required: true },
    order: { type: Number, default: 0 },
    image: { type: String },
  },
  { timestamps: true }
);

export default models.ArchitectureSubcategory || model<IArchitectureSubcategory>(
  "ArchitectureSubcategory",
  ArchitectureSubcategorySchema
);
