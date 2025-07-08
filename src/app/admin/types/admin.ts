// types/admin.ts

import { z } from "zod";

// --- Cities ---
export const cities = ["Pune", "Mumbai", "Navi Mumbai"] as const;
export type City = typeof cities[number];
export const CityEnum = z.enum(cities);

// --- Base Entity ---
export interface BaseEntity {
  _id: string;
  name: string;
  city: City;
}

// --- Taxonomy Types ---
export interface Category extends BaseEntity {
  category_image?: string;
}

export interface Subcategory extends BaseEntity {
  category: string;
}

export interface Group extends BaseEntity {
  category: string;
  subcategory?: string;
}

export interface Subgroup extends BaseEntity {
  category: string;
  subcategory?: string;
  group?: string;
}

export interface Brand {
  _id: string;
  Brand_name: string;
  Category: string;
  city: City;
}

export interface Taxonomy {
  categories: Category[];
  subcategories: Subcategory[];
  groups: Group[];
  subgroups: Subgroup[];
  brands: Brand[];
}

// --- Zod Schemas ---
export const CategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  category_image: z.string().url().optional().or(z.literal("")),
  city: CityEnum,
});

export const SubcategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  category_image: z.string().url().optional().or(z.literal("")),
  city: CityEnum,
});

export const GroupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
  category_image: z.string().url().optional().or(z.literal("")),
  city: CityEnum,
});

export const SubgroupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
  group: z.string().optional(),
  category_image: z.string().url().optional().or(z.literal("")),
  city: CityEnum,
});

export const BrandSchema = z.object({
  Brand_name: z.string().min(1, "Brand name is required"),
  Category: z.string().min(1, "Category is required"),
  city: CityEnum,
});

// --- Inferred Zod Types ---
export type CategoryFormData = z.infer<typeof CategorySchema>;
export type SubcategoryFormData = z.infer<typeof SubcategorySchema>;
export type GroupFormData = z.infer<typeof GroupSchema>;
export type SubgroupFormData = z.infer<typeof SubgroupSchema>;
export type BrandFormData = z.infer<typeof BrandSchema>;
