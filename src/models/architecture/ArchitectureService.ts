import { Schema, model, models, Document } from "mongoose";

// --- Allowed cities ---
const allowedCities = ["Pune", "Mumbai", "Navi Mumbai"] as const;
type City = (typeof allowedCities)[number];

// --- Variant Interface ---
interface IVariantPrice {
  city: City;
  price?: number;
  discounted_price?: number;
  discounted_percent?: number;
}

interface IServiceVariant {
  serviceName: string;
  serviceDescription: string;
  attrs: {
    Variants: string;
    imgs: string[];
  };
  price?: number;
  discounted_price?: IVariantPrice[];
  discounted_percent?: number;
}

// --- Main Interface ---
export interface IArchitectureService extends Document {
  city: City;
  serviceCategory: string;
  serviceSubcategory: string;
  serviceName: string;
  serviceDescription: string;
  order: number;
  unit: "rft" | "sft" | "nos";
  attrs: {
    imgs: string[];
  };
  rating_and_review: number;
  vars: IServiceVariant[];
  get_price_requested: boolean;
}

// --- Variant Schema ---
const ServiceVariantSchema = new Schema<IServiceVariant>(
  {
    serviceName: { type: String, required: true },
    serviceDescription: { type: String, required: true },
    attrs: {
      Variants: { type: String },
      imgs: [String],
    },
    price: Number,
    discounted_price: [
      {
        city: { type: String, enum: allowedCities },
        price: Number,
        discounted_price: Number,
        discounted_percent: Number,
      },
    ],
    discounted_percent: Number,
  },
  { _id: false }
);

// --- Main ArchitectureService Schema ---
const ArchitectureSchema = new Schema<IArchitectureService>(
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
    rating_and_review: { type: Number, default: 4.5 },
    vars: [ServiceVariantSchema],
    get_price_requested: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// --- Export Model ---
export default models.ArchitectureService ||
  model<IArchitectureService>("ArchitectureService", ArchitectureSchema);
