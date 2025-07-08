import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import slugify from "slugify";
import mongoose from "mongoose";

import { mongooseConnect } from "@/lib/mongooseConnect";
import Product from "@/models/products/Product";
import Category from "@/models/products/Category";
import Subcategory from "@/models/products/Subcategory";
import Brand from "@/models/products/Brand";
import Group from "@/models/products/Group";
import Subgroup from "@/models/products/Subgroup";

import { generatePlyId } from "@/lib/products/seed/generatePlyId";

// Zod schemas (updated with better optional group/subgroup handling)
const allowedCities = ["Pune", "Mumbai", "Navi Mumbai"] as const;
const cityEnum = z.enum(allowedCities);

const VariantSchema = z.object({
  product_name: z.string().min(3).max(100),
  product_description: z.string().max(500),
  desc: z.object({
    Box_Packing: z.string().max(100),
    Size: z.string().max(50),
    Colour: z.string().max(50),
    Material: z.string().max(100),
  }),
  attributes: z.object({
    var: z.string().max(50),
    color: z.string().max(50),
    images: z.array(z.string().regex(/\.(jpeg|jpg|png|webp)$/i)).min(1),
  }),
  filters: z.array(z.string().max(50)).optional(),
  laborPerFloor: z.number().min(0),
  price: z.number().min(0),
  discounted_price: z.number().min(0),
  discounted_percent: z.number().min(0).max(100).optional(),
});

const ProductSchema = z.object({
  product_name: z.string().min(3).max(100),
  product_description: z.string().max(500),
  desc: z.object({
    Box_Packing: z.string().max(100),
    Size: z.string().max(50),
    Colour: z.string().max(50),
    Material: z.string().max(100),
  }),
  attributes: z.object({
    images: z.array(z.string().regex(/\.(jpeg|jpg|png|webp)$/i)).min(1),
    finish: z.string().max(50).optional(),
  }),
  price: z.number().min(0),
  discounted_price: z.number().min(0),
  discounted_percent: z.number().min(0).max(100).optional(),
  applicability: z.union([z.literal(1), z.literal(2)]),
  laborPerFloor: z.number().min(0).optional(),
  loadingUnloadingPrice: z.number().min(0).optional(),
  category: z.string().min(2),
  subcategory: z.string().min(2),
  group: z.string().min(2).optional().nullable(), // Explicitly marked optional
  subgroup: z.string().min(2).optional().nullable(),
  brand: z.string().min(2),
  vars: z.array(VariantSchema).optional(),
  city: cityEnum,
});

const BulkSchema = z.object({
  items: z.array(ProductSchema).max(100),
});

export async function POST(req: NextRequest) {
  await mongooseConnect();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const body = await req.json();
    const { items } = BulkSchema.parse(body);

    // Pre-fetch all required taxonomies (including optional groups)
    const taxonomyQueries = {
      categories: Category.find({
        name: { $in: [...new Set(items.map(i => i.category))] },
        city: { $in: [...new Set(items.map(i => i.city))] }
      }).session(session),
      
      subcategories: Subcategory.find({
        name: { $in: [...new Set(items.map(i => i.subcategory))] },
        city: { $in: [...new Set(items.map(i => i.city))] }
      }).session(session),
      
      brands: Brand.find({
        Brand_name: { $in: [...new Set(items.map(i => i.brand))] },
        city: { $in: [...new Set(items.map(i => i.city))] }
      }).session(session),
      
      // Only query groups/subgroups if they exist in any product
      groups: items.some(i => i.group) ? 
        Group.find({
          name: { $in: [...new Set(items.filter(i => i.group).map(i => i.group))] },
          city: { $in: [...new Set(items.filter(i => i.group).map(i => i.city))] }
        }).session(session) : Promise.resolve([]),
        
      subgroups: items.some(i => i.subgroup) ? 
        Subgroup.find({
          name: { $in: [...new Set(items.filter(i => i.subgroup).map(i => i.subgroup))] },
          city: { $in: [...new Set(items.filter(i => i.subgroup).map(i => i.city))] }
        }).session(session) : Promise.resolve([])
    };

    const [
      allCategories,
      allSubcategories,
      allBrands,
      allGroups,
      allSubgroups
    ] = await Promise.all(Object.values(taxonomyQueries));

    // Create lookup maps
    const taxonomyMaps = {
      categories: new Map(allCategories.map(c => [`${c.name}:${c.city}`, c])),
      subcategories: new Map(allSubcategories.map(s => [`${s.name}:${s.city}`, s])),
      brands: new Map(allBrands.map(b => [`${b.Brand_name}:${b.city}`, b])),
      groups: new Map(allGroups.map(g => [`${g.name}:${g.city}`, g])),
      subgroups: new Map(allSubgroups.map(sg => [`${sg.name}:${sg.city}`, sg]))
    };

    const payload = await Promise.all(
      items.map(async (p) => {
        // Validate required taxonomies
        const categoryDoc = taxonomyMaps.categories.get(`${p.category}:${p.city}`);
        const subcategoryDoc = taxonomyMaps.subcategories.get(`${p.subcategory}:${p.city}`);
        const brandDoc = taxonomyMaps.brands.get(`${p.brand}:${p.city}`);

        if (!categoryDoc || !subcategoryDoc || !brandDoc) {
          throw new Error(
            `Invalid taxonomy: ${
              !categoryDoc ? "Category" : 
              !subcategoryDoc ? "Subcategory" : 
              "Brand"
            } "${p.category}" not found for city ${p.city}`
          );
        }

        // Validate optional groups/subgroups only if provided
        let groupDoc, subgroupDoc;
        if (p.group) {
          groupDoc = taxonomyMaps.groups.get(`${p.group}:${p.city}`);
          if (!groupDoc) throw new Error(`Group "${p.group}" not found in ${p.city}`);
        }
        if (p.subgroup) {
          subgroupDoc = taxonomyMaps.subgroups.get(`${p.subgroup}:${p.city}`);
          if (!subgroupDoc) throw new Error(`Subgroup "${p.subgroup}" not found in ${p.city}`);
        }

        // Generate unique slug
        let slug = slugify(p.product_name, { lower: true, strict: true });
        const existing = await Product.findOne({ slug }).session(session).select('_id').lean();
        if (existing) slug = `${slug}-${Math.floor(Math.random() * 1000)}`;

        return {
          ...p,
          slug,
          plyid: await generatePlyId(),
          filters: [
            p.desc.Colour, 
            p.desc.Size, 
            ...(p.attributes.finish ? [p.attributes.finish] : [])
          ].filter(Boolean),
          system_rating: {
            rating: +(Math.random() * 2 + 3).toFixed(2), // 3.00-5.00
            count: Math.floor(Math.random() * 500) // 0-500
          },
          discounted_percent: p.discounted_percent ?? 
            Math.round(((p.price - p.discounted_price) / p.price) * 100),
          category: categoryDoc._id,
          subcategory: subcategoryDoc._id,
          brand: brandDoc._id,
          group: groupDoc?._id, // Will be undefined if not provided
          subgroup: subgroupDoc?._id,
          vars: p.vars?.map(v => ({
            ...v,
            filters: [...new Set([v.desc.Colour, v.desc.Size, v.attributes.var])],
            discounted_percent: v.discounted_percent ?? 
              Math.round(((v.price - v.discounted_price) / v.price) * 100)
          })),
        };
      })
    );

    await Product.insertMany(payload, { session });
    await session.commitTransaction();

    return NextResponse.json({ 
      ok: true, 
      count: payload.length,
      insertedIds: payload.map(p => p.plyid) 
    });
  } catch (err) {
    await session.abortTransaction();
    return NextResponse.json(
      { 
        error: err instanceof Error ? err.message : "Bulk upload failed",
        ...(process.env.NODE_ENV === 'development' && { 
          stack: err instanceof Error ? err.stack : undefined 
        })
      },
      { status: 400 }
    );
  } finally {
    session.endSession();
  }
}