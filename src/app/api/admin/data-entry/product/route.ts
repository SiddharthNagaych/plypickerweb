import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { mongooseConnect } from "@/lib/mongooseConnect";
import Product from "@/models/products/Product";
import slugify from "slugify";
import { generatePlyId } from "@/lib/products/seed/generatePlyId";
import { generateSystemRating } from "@/lib/products/seed/generateRating";
import mongoose from "mongoose";

// -------- Zod Schemas --------
const allowedCities = ["Pune", "Mumbai", "Navi Mumbai"] as const;
const cityEnum = z.enum(allowedCities);

const VariantSchema = z.object({
  product_name: z.string(),
  product_description: z.string(),
  desc: z.object({
    Box_Packing: z.string(),
    Size: z.string(),
    Colour: z.string(),
    Material: z.string(),
  }),
  attributes: z.object({
    var: z.string(),
    color: z.string(),
    images: z.array(z.string().url()),
  }),
  filters: z.array(z.string()).optional(),
  laborPerFloor: z.number(),
  price: z.number(),
  discounted_price: z.number(),
  discounted_percent: z.number(),
});

const ProductSchema = z.object({
  product_name: z.string(),
  product_description: z.string(),
  desc: z.object({
    Box_Packing: z.string(),
    Size: z.string(),
    Colour: z.string(),
    Material: z.string(),
  }),
  attributes: z.object({
    images: z.array(z.string().url()),
    finish: z.string().optional(),
  }),
  price: z.number(),
  discounted_price: z.number(),
  applicability: z.union([z.literal(1), z.literal(2)]),
  laborPerFloor: z.number().optional(),
  loadingUnloadingPrice: z.number().optional(),
  category: z.string(),
  subcategory: z.string(),
  group: z.string().optional(),
  subgroup: z.string().optional(),
  brand: z.string(),
  vars: z.array(VariantSchema).optional(),
  city: cityEnum,
});

const BulkSchema = z.array(ProductSchema);

// -------- POST Handler --------
export async function POST(req: NextRequest) {
  await mongooseConnect();

  try {
    const body = await req.json();

    const products = body.bulkJson
      ? BulkSchema.parse(JSON.parse(body.bulkJson))
      : [ProductSchema.parse(body)];

    for (const p of products) {
      const filters = [p.desc.Colour, p.desc.Size, p.attributes.finish || ""].filter(Boolean);
      const slug = slugify(p.product_name, { lower: true, strict: true });
      const rating_and_review = generateSystemRating();
      const plyid = await generatePlyId();

      const newProduct = {
        ...p,
        slug,
        plyid,
        filters,
        system_rating: rating_and_review,
        category: new mongoose.Types.ObjectId(p.category),
        subcategory: new mongoose.Types.ObjectId(p.subcategory),
        group: p.group ? new mongoose.Types.ObjectId(p.group) : undefined,
        subgroup: p.subgroup ? new mongoose.Types.ObjectId(p.subgroup) : undefined,
        brand: new mongoose.Types.ObjectId(p.brand),
        vars: p.vars?.map((v) => ({
          ...v,
          filters: [...new Set([v.desc.Colour, v.desc.Size, v.attributes.var])],
        })),
      };

      await Product.create(newProduct);
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
