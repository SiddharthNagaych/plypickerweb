// types/architecture.ts
import { Document, Types } from "mongoose";

type City = "Pune" | "Mumbai" | "Navi Mumbai";

export interface IArchitectureCategory extends Document {
  name: string;
  slug: string;
  city: City;
  order: number;
  image?: string;
}

export interface IArchitectureSubcategory extends Document {
  name: string;
  category: Types.ObjectId;
  city: City;
  order: number;
  image?: string;
}

export interface IArchitectureService extends Document {
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
  vars: IArchitectureVariant[];
  get_price_requested: boolean;
}

interface IArchitectureVariant {
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

interface IVariantPrice {
  city: City;
  price?: number;
  discounted_price?: number;
  discounted_percent?: number;
}