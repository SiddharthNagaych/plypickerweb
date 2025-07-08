import mongoose, { Schema, model, Document, models } from "mongoose";
import slugify from "slugify";

interface IVariant {
  product_name: string;
  desc: {
    Box_Packing: string;
    Size: string;
    Colour: string;
    Material: string;
  };
  product_description: string;
  attributes: {
    var: string;
    color: string;
    images: string[];
  };
  filters: string[];
  laborPerFloor: number;
  price: number;
  discounted_price: number;
  discounted_percent: number;
}

export interface IProduct extends Document {
  plyid: string;
  city: "Pune" | "Navi Mumbai" | "Mumbai";
  category: mongoose.Types.ObjectId;
  subcategory: mongoose.Types.ObjectId;
  group: mongoose.Types.ObjectId;
  subgroup: mongoose.Types.ObjectId;
  brand: mongoose.Types.ObjectId;

 
  product_name: string;
  slug: string;
  product_description: string;

  desc: {
    Box_Packing: string;
    Size: string;
    Colour: string;
    Material: string;
  };

  attributes: {
    images: string[];
    finish?: string;
  };

  filters: string[];
  price: number;
  discounted_price: number;
  discounted_percent: number;

  applicability: number;
  laborPerFloor: number;
  loadingUnloadingPrice: number;

  system_rating: {
    rating: number;
    count: number;
  };

  vars: IVariant[];
  is_active: boolean;
  is_deleted: boolean;
}

const VariantSchema = new Schema<IVariant>({
  product_name: String,
  desc: {
    Box_Packing: String,
    Size: String,
    Colour: String,
    Material: String
  },
  product_description: String,
  attributes: {
    var: String,
    color: String,
    images: [String]
  },
  filters: [String],
  laborPerFloor: Number,
  price: Number,
  discounted_price: Number,
  discounted_percent: Number
});

const ProductSchema = new Schema<IProduct>(
  {
    plyid: { type: String, required: true },
  
    product_name: { type: String, required: true },
slug: { type: String, required: true },


    city: {
      type: String,
      enum: ["Pune", "Navi Mumbai", "Mumbai"],
      required: true
    },

    category: { type: Schema.Types.ObjectId, ref: "Category" },
    subcategory: { type: Schema.Types.ObjectId, ref: "Subcategory" },
    group: { type: Schema.Types.ObjectId, ref: "Group" },
    subgroup: { type: Schema.Types.ObjectId, ref: "Subgroup" },
    brand: { type: Schema.Types.ObjectId, ref: "Brand" },

    product_description: String,

    desc: {
      Box_Packing: String,
      Size: String,
      Colour: String,
      Material: String
    },

    attributes: {
      images: [String],
      finish: String
    },

    filters: [String],

    price: Number,
    discounted_price: Number,
    discounted_percent: Number,

    applicability: { type: Number, enum: [1, 2], default: 1 },
    laborPerFloor: Number,
    loadingUnloadingPrice: Number,

    system_rating: {
      rating: { type: Number, default: 4.2 },
      count: { type: Number, default: 100 }
    },

    vars: [VariantSchema],

    is_active: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

ProductSchema.pre("save", function (next) {
  if (!this.slug && this.product_name) {
    this.slug = slugify(this.product_name, { lower: true, strict: true });
  }

  const filters = [];
  if (this.desc?.Colour) filters.push(this.desc.Colour);
  if (this.desc?.Size) filters.push(this.desc.Size);
  if (this.attributes?.finish) filters.push(this.attributes.finish);
  this.filters = Array.from(new Set(filters));

  if (this.vars?.length) {
    this.vars = this.vars.map((variant) => {
      const vf = [];
      if (variant.desc?.Colour) vf.push(variant.desc.Colour);
      if (variant.desc?.Size) vf.push(variant.desc.Size);
      if (variant.attributes?.var) vf.push(variant.attributes.var);
      variant.filters = Array.from(new Set(vf));
      return variant;
    });
  }

  next();
});

export default models.Product || model<IProduct>("Product", ProductSchema);
