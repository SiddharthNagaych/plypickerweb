import { Schema, model, models, Document, Types } from "mongoose";
import slugify from "slugify";

// --- Allowed cities ---
const allowedCities = ["Pune", "Mumbai", "Navi Mumbai"] as const;
type City = (typeof allowedCities)[number];

// --- Price Interface ---
interface IPrice {
  city: City;
  price?: number;
  discountedPrice?: number;
  discountedPercent?: number;
}

// --- Variant Interface ---
interface IServiceVariant {
  _id?: Types.ObjectId; // Add this line
 
  serviceDescription: string;
  variantName: string;
  images: string[]; // Required - each variant must have images
  specs: string; // Required - each variant must have specs
  prices: IPrice[]; // Required - each variant must have pricing
  get_price_requested?: boolean; // MOVED HERE - variant level control
  attrs?: {
    deliveryTime?: string;
    revisions?: string;
    [key: string]: any;
  };
}

// --- Main Interface ---
export interface IArchitectureService extends Document {
  city: City;
  serviceCategory: Schema.Types.ObjectId | string;
  serviceSubcategory: Schema.Types.ObjectId | string;
  serviceName: string; // Master service name
  serviceDescription: string; // General service description
  slug: string;
  order: number;
  unit: "rft" | "sft" | "nos";
  rating_and_review: number;
  variants: IServiceVariant[]; // All product data lives here
  // REMOVED: get_price_requested - now at variant level
  createdAt: Date;
  updatedAt: Date;
}

// --- Price Schema ---
const PriceSchema = new Schema<IPrice>(
  {
    city: { type: String, enum: allowedCities, required: true },
    price: Number,
    discountedPrice: Number,
    discountedPercent: Number
  },
  { _id: false }
);

// --- Variant Schema ---
const ServiceVariantSchema = new Schema<IServiceVariant>(
  {
 
    serviceDescription: { type: String, required: true },
    variantName: { type: String, required: true },
    images: { 
      type: [String], 
      required: true, 
      validate: [arrayLimit, '{PATH} must have at least one image'] 
    },
    specs: { type: String, required: true },
    prices: { 
      type: [PriceSchema], 
      required: true, 
      validate: [arrayLimit, '{PATH} must have at least one price'] 
    },
    get_price_requested: { type: Boolean, default: false }, // ADDED HERE
    attrs: {
      deliveryTime: String,
      revisions: String,
      // Allow flexible attributes for different service types
      type: Schema.Types.Mixed
    }
  }
);

// Validator function to ensure arrays have at least one element
function arrayLimit(val: any[]) {
  return val && val.length > 0;
}

// --- Main ArchitectureService Schema ---
const ArchitectureSchema = new Schema<IArchitectureService>(
  {
    city: { type: String, enum: allowedCities, required: true },
    serviceCategory: { 
      type: Schema.Types.ObjectId, 
      ref: 'ArchitectureCategory', 
      required: true 
    },
    serviceSubcategory: { 
      type: Schema.Types.ObjectId, 
      ref: 'ArchitectureSubcategory', 
      required: true 
    },
    serviceName: { type: String, required: true }, // Master service name only
    serviceDescription: { type: String, required: true }, // General description only
    slug: { type: String, unique: true },
    order: { type: Number, default: 0 },
    unit: { type: String, enum: ["rft", "sft", "nos"], required: true },
    rating_and_review: { type: Number, default: 4.2 },
    variants: { 
      type: [ServiceVariantSchema], 
      required: true, 
      validate: [arrayLimit, 'Service must have at least one variant'] 
    }
    // REMOVED: get_price_requested - now at variant level
  },
  { 
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Add pre-save hook to generate slug
ArchitectureSchema.pre("save", function (next) {
  if (!this.slug && this.serviceName) {
    this.slug = slugify(this.serviceName, { 
      lower: true, 
      strict: true,
      trim: true
    });
  }
  next();
});

// Add indexes for better query performance
ArchitectureSchema.index({ city: 1, slug: 1 });
ArchitectureSchema.index({ city: 1, serviceName: 1 });
ArchitectureSchema.index({ serviceCategory: 1 });
ArchitectureSchema.index({ serviceSubcategory: 1 });
ArchitectureSchema.index({ 'variants.prices.city': 1 });
ArchitectureSchema.index({ 'variants.get_price_requested': 1 }); // NEW INDEX

// Virtual for populated category name
ArchitectureSchema.virtual('categoryName', {
  ref: 'ArchitectureCategory',
  localField: 'serviceCategory',
  foreignField: '_id',
  justOne: true,
  options: { select: 'name' }
});

// Virtual for populated subcategory name
ArchitectureSchema.virtual('subcategoryName', {
  ref: 'ArchitectureSubcategory',
  localField: 'serviceSubcategory',
  foreignField: '_id',
  justOne: true,
  options: { select: 'name' }
});

// --- Export Model ---
export default models.ArchitectureService ||
  model<IArchitectureService>("ArchitectureService", ArchitectureSchema);