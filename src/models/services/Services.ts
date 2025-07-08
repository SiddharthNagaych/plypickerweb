import { Schema, model, models, Document } from "mongoose";

const allowedCities = ["Pune", "Mumbai", "Navi Mumbai"] as const;
type City = (typeof allowedCities)[number];

interface VariantPrice {
  city: City;
  price?: number;
  discounted_price?: number;
  discounted_percent?: number;
}

interface ServiceVariant {
  serviceName: string;
  serviceDescription: string;
  attrs: {
    Variants: string;
    imgs: string[];
  };
  pricing: VariantPrice[];
}

export interface IService extends Document {
  city: City;
  serviceCategory: string;
  serviceSubcategory: string;
  serviceName: string;
  serviceDescription: string;
  order: number;
  unit: "rft" | "sft" | "nos"; // e.g., running ft, sq. ft, or quantity
  attrs: {
    imgs: string[];
  };
  rating_and_review: number;
  vars: ServiceVariant[];
  get_price_requested?: boolean;
}

const VariantPriceSchema = new Schema<VariantPrice>({
  city: { type: String, enum: allowedCities, required: true },
  price: Number,
  discounted_price: Number,
  discounted_percent: Number,
});

const ServiceVariantSchema = new Schema<ServiceVariant>({
  serviceName: String,
  serviceDescription: String,
  attrs: {
    Variants: String,
    imgs: [String],
  },
  pricing: [VariantPriceSchema],
});

const ServiceSchema = new Schema<IService>(
  {
    city: { type: String, enum: allowedCities, required: true },
    serviceCategory: { type: String, required: true },
    serviceSubcategory: { type: String, required: true },
    serviceName: { type: String, required: true },
    serviceDescription: { type: String, required: true },
    order: { type: Number, default: 0 },
    unit: { type: String, enum: ["rft", "sft", "nos"], required: true },
    attrs: {
      imgs: [String],
    },
    rating_and_review: { type: Number, default: 4.2 },
    vars: [ServiceVariantSchema],
    get_price_requested: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default models.Service || model<IService>("Service", ServiceSchema);
