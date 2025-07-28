// types/services.ts
import mongoose, { Document, Types } from "mongoose";

type City = "Pune" | "Mumbai" | "Navi Mumbai";

export interface IServiceCategory extends Document {
  name: string;
  slug: string;
  city: City;
  order: number;
  image?: string;
}

export interface IServiceSubcategory extends Document {
  name: string;
   category: string | { _id: string | mongoose.Types.ObjectId; name: string };
  city: City;
  order: number;
  image?: string;
}

export interface IService extends Document {
  city: City;
  serviceCategory: Types.ObjectId;
  serviceSubcategory: Types.ObjectId;
  serviceName: string;
  serviceDescription: string;
  order: number;
  unit: "rft" | "sft" | "nos";
  attrs: {
    imgs: string[];
  };
  rating_and_review: number;
  vars: IServiceVariant[];
  get_price_requested?: boolean;
}

interface IServiceVariant {
  serviceName: string;
  serviceDescription: string;
  attrs: {
    Variants: string;
    imgs: string[];
  };
  pricing: IVariantPrice[];
}

interface IVariantPrice {
  city: City;
  price?: number;
  discounted_price?: number;
  discounted_percent?: number;
}