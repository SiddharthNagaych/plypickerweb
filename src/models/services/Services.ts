import { Schema, model, models, Document, Types } from "mongoose";
import slugify from "slugify";

const allowedCities = ["Pune", "Mumbai", "Navi Mumbai"] as const;
type City = (typeof allowedCities)[number];

interface VariantPrice {
  city: City;
  price?: number;
  discounted_price?: number;
  discounted_percent?: number;
}

interface ServiceVariant {
  _id?: Types.ObjectId; // MongoDB-generated ID
  variantName: string; // Now the single name field
  serviceDescription: string;
  specs: string;
  images: string[];
  pricing: VariantPrice[];
  get_price_requested?: boolean;
  attrs?: {
    deliveryTime?: string;
    revisions?: string;
    [key: string]: any;
  };
}

export interface IService extends Document {
  _id: Types.ObjectId; // Explicit ID
  city: City;
  serviceCategory: string;
  serviceSubcategory: string;
  serviceName: string;
  serviceDescription: string;
  slug: string;
  order: number;
  unit: "rft" | "sft" | "nos";
  rating_and_review: number;
  variants: ServiceVariant[]; // Renamed from 'vars' for clarity
  createdAt: Date;
  updatedAt: Date;
}

// Validator function remains the same
function arrayLimit(val: any[]) {
  return val && val.length > 0;
}

const VariantPriceSchema = new Schema<VariantPrice>(
  {
    city: { type: String, enum: allowedCities, required: true },
    price: Number,
    discounted_price: Number,
    discounted_percent: Number,
  },
  { _id: false }
);

const ServiceVariantSchema = new Schema<ServiceVariant>({
  // _id is automatically added by MongoDB
  variantName: { type: String, required: true }, // Now the primary name field
  serviceDescription: { type: String, required: true },
  specs: { type: String, required: true },
  images: {
    type: [String],
    required: true,
    validate: [arrayLimit, "Each variant must have at least one image"],
  },
  pricing: {
    type: [VariantPriceSchema],
    required: true,
    validate: [arrayLimit, "Each variant must have at least one price"],
  },
  get_price_requested: { type: Boolean, default: false },
  attrs: {
    deliveryTime: String,
    revisions: String,
    type: Schema.Types.Mixed,
  },
});

const ServiceSchema = new Schema<IService>(
  {
    city: { type: String, enum: allowedCities, required: true },
    serviceCategory: { type: String, required: true },
    serviceSubcategory: { type: String, required: true },
    serviceName: { type: String, required: true },
    serviceDescription: { type: String, required: true },
    slug: { type: String, unique: true },
    order: { type: Number, default: 0 },
    unit: { type: String, enum: ["rft", "sft", "nos"], required: true },
    rating_and_review: { type: Number, default: 4.2 },
    variants: { // Changed from 'vars' to 'variants' for clarity
      type: [ServiceVariantSchema],
      required: true,
      validate: [arrayLimit, "Service must have at least one variant"],
    },
  },
  {
    timestamps: true, // Auto-add createdAt/updatedAt
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Auto-generate slug
ServiceSchema.pre("save", function (next) {
  if (!this.slug && this.serviceName) {
    this.slug = slugify(this.serviceName, {
      lower: true,
      strict: true,
      trim: true,
    });
  }
  next();
});

// Indexes
ServiceSchema.index({ city: 1, slug: 1 });
ServiceSchema.index({ city: 1, serviceName: 1 });
ServiceSchema.index({ serviceCategory: 1 });
ServiceSchema.index({ serviceSubcategory: 1 });
ServiceSchema.index({ "variants.pricing.city": 1 });
ServiceSchema.index({ "variants.get_price_requested": 1 });

export default models.Service || model<IService>("Service", ServiceSchema);