import mongoose, { Schema, model, models, Document } from "mongoose";

export interface IServiceSubcategory extends Document {
  name: string;
  category: mongoose.Types.ObjectId; // Reference to ServiceCategory
  city: City;
  order: number;
  image?: string;
}

const ServiceSubcategorySchema = new Schema<IServiceSubcategory>(
  {
    name: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: "ServiceCategory", required: true },
    city: { type: String, enum: ["Pune", "Mumbai", "Navi Mumbai"], required: true },
    order: { type: Number, default: 0 },
    image: { type: String },
  },
  { timestamps: true }
);

export default models.ServiceSubcategory || model<IServiceSubcategory>(
  "ServiceSubcategory",
  ServiceSubcategorySchema
);
