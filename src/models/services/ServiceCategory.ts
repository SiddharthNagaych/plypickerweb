import  { Schema, model, models, Document } from "mongoose";
import slugify from "slugify";

const allowedCities = ["Pune", "Mumbai", "Navi Mumbai"] as const;
type City = (typeof allowedCities)[number];

export interface IServiceCategory extends Document {
  name: string;
  slug: string;
  city: City;
  order: number;
  image?: string;
}

const ServiceCategorySchema = new Schema<IServiceCategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true },
    city: { type: String, enum: allowedCities, required: true },
    order: { type: Number, default: 0 },
    image: { type: String },
  },
  { timestamps: true }
);

ServiceCategorySchema.pre("save", function (next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

export default models.ServiceCategory || model<IServiceCategory>(
  "ServiceCategory",
  ServiceCategorySchema
);
