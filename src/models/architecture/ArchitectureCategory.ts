import  { Schema, model, models, Document } from "mongoose";
import slugify from "slugify";

export interface IArchitectureCategory extends Document {
  name: string;
  slug: string;
  city: City;
  order: number;
  image?: string;
}

const ArchitectureCategorySchema = new Schema<IArchitectureCategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true },
    city: { type: String, enum: ["Pune", "Mumbai", "Navi Mumbai"], required: true },
    order: { type: Number, default: 0 },
    image: { type: String },
  },
  { timestamps: true }
);

ArchitectureCategorySchema.pre("save", function (next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

export default models.ArchitectureCategory || model<IArchitectureCategory>(
  "ArchitectureCategory",
  ArchitectureCategorySchema
);
