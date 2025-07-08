import mongoose, { Schema, Document, model, models } from "mongoose";

export interface ISubgroup extends Document {
  name: string;
  category: mongoose.Types.ObjectId;
  subcategory: mongoose.Types.ObjectId;
  group: mongoose.Types.ObjectId;
  city: "Pune" | "Navi Mumbai" | "Mumbai";
}

const SubgroupSchema = new Schema<ISubgroup>(
  {
    name: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    subcategory: { type: Schema.Types.ObjectId, ref: "Subcategory", required: true },
    group: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    city: {
      type: String,
      enum: ["Pune", "Navi Mumbai", "Mumbai"],
      required: true
    }
  },
  { timestamps: true }
);

export default models.Subgroup || model<ISubgroup>("Subgroup", SubgroupSchema);
