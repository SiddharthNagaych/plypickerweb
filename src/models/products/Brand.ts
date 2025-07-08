import mongoose, { Schema, model, models, Document } from "mongoose";

export interface IBrand extends Document {
  Brand_name: string;
  Brand_image?: string;
  city: "Pune" | "Navi Mumbai" | "Mumbai";

  Category: mongoose.Types.ObjectId;
  SubCategory: mongoose.Types.ObjectId[];
  group: mongoose.Types.ObjectId[];
  subgroup: mongoose.Types.ObjectId[];
}

const BrandSchema = new Schema<IBrand>(
  {
    Brand_name: { type: String, required: true },
    Brand_image: { type: String },

    city: {
      type: String,
      enum: ["Pune", "Navi Mumbai", "Mumbai"],
      required: true
    },

    Category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },

    SubCategory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subcategory"
      }
    ],

    group: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group"
      }
    ],

    subgroup: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subgroup"
      }
    ]
  },
  { timestamps: true }
);

export default models.Brand || model<IBrand>("Brand", BrandSchema);
