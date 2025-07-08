import { Schema, Document, model, models } from "mongoose";

export interface ICategory extends Document {
  name: string;
  category_image?: string;
  city: "Pune" | "Navi Mumbai" | "Mumbai";
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true },
    category_image: { type: String },

    city: {
      type: String,
      enum: ["Pune", "Navi Mumbai", "Mumbai"],
      required: true
    }
  },
  { timestamps: true }
);

export default models.Category || model<ICategory>("Category", CategorySchema);
