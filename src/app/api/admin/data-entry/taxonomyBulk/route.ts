import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { mongooseConnect } from "@/lib/mongooseConnect";
import Category from "@/models/products/Category";
import Subcategory from "@/models/products/Subcategory";
import Group from "@/models/products/Group";
import Subgroup from "@/models/products/Subgroup";
import Brand from "@/models/products/Brand";

// ----------------- Zod Schemas -----------------
const allowedCities = ["Pune", "Mumbai", "Navi Mumbai"] as const;
const BaseWithCity = z.object({
  name: z.string(),
  city: z.enum(allowedCities),
});

const CategorySchema = BaseWithCity.extend({
  category_image: z.string().optional(),
});

const SubcategorySchema = BaseWithCity.extend({
  category: z.string(),
});

const GroupSchema = BaseWithCity.extend({
  category: z.string(),
  subcategory: z.string(),
});

const SubgroupSchema = BaseWithCity.extend({
  category: z.string(),
  subcategory: z.string(),
  group: z.string().optional(),
});

const BrandSchema = z.object({
  Brand_name: z.string(),
  Category: z.string(),
  city: z.enum(allowedCities),
});

// ----------------- Type Maps -----------------
const schemas = {
  category: CategorySchema.array(),
  subcategory: SubcategorySchema.array(),
  group: GroupSchema.array(),
  subgroup: SubgroupSchema.array(),
  brand: BrandSchema.array(),
};

const models = {
  category: Category,
  subcategory: Subcategory,
  group: Group,
  subgroup: Subgroup,
  brand: Brand,
};

// ----------------- Type Helpers -----------------
type SchemaTypeMap = {
  category: z.infer<typeof CategorySchema>;
  subcategory: z.infer<typeof SubcategorySchema>;
  group: z.infer<typeof GroupSchema>;
  subgroup: z.infer<typeof SubgroupSchema>;
  brand: z.infer<typeof BrandSchema>;
};

type TypeKey = keyof SchemaTypeMap;



// ----------------- API Handler -----------------
export async function POST(req: NextRequest) {
  await mongooseConnect();

  const body = await req.json();

  const type = body.type as TypeKey;

  if (!schemas[type]) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  try {
    const parsed = schemas[type].parse(body.items);
    const Model = models[type];

    for (const raw of parsed) {
      const itemWithObjectIds: Record<string, unknown> = { ...raw };

      if (type === "subcategory") {
        const sub = raw as SchemaTypeMap["subcategory"];
        itemWithObjectIds.category = new mongoose.Types.ObjectId(sub.category);
      }

      if (type === "group") {
        const group = raw as SchemaTypeMap["group"];
        itemWithObjectIds.category = new mongoose.Types.ObjectId(group.category);
        itemWithObjectIds.subcategory = new mongoose.Types.ObjectId(group.subcategory);
      }

      if (type === "subgroup") {
        const subgroup = raw as SchemaTypeMap["subgroup"];
        itemWithObjectIds.category = new mongoose.Types.ObjectId(subgroup.category);
        itemWithObjectIds.subcategory = new mongoose.Types.ObjectId(subgroup.subcategory);
        itemWithObjectIds.group = subgroup.group
          ? new mongoose.Types.ObjectId(subgroup.group)
          : undefined;
      }

      if (type === "brand") {
        const brand = raw as SchemaTypeMap["brand"];
        itemWithObjectIds.Category = new mongoose.Types.ObjectId(brand.Category);
      }

      await Model.findOneAndUpdate(
        type === "brand"
          ? {
              Brand_name: (raw as SchemaTypeMap["brand"]).Brand_name,
              city: (raw as SchemaTypeMap["brand"]).city,
            }
          : {
              name: (raw as SchemaTypeMap["category"] | SchemaTypeMap["subcategory"]).name,
              city: (raw as SchemaTypeMap["category"] | SchemaTypeMap["subcategory"]).city,
            },
        itemWithObjectIds,
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}