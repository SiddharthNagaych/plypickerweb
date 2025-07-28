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
  image: z.string().optional(),
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

// ----------------- Type Helpers -----------------
type SchemaTypeMap = {
  category: z.infer<typeof CategorySchema>;
  subcategory: z.infer<typeof SubcategorySchema>;
  group: z.infer<typeof GroupSchema>;
  subgroup: z.infer<typeof SubgroupSchema>;
  brand: z.infer<typeof BrandSchema>;
};

type TypeKey = keyof SchemaTypeMap;

// ----------------- Helper Functions -----------------
async function processCategory(item: SchemaTypeMap["category"]) {
  await Category.findOneAndUpdate(
    { name: item.name, city: item.city },
    item,
    { upsert: true, new: true }
  );
}

async function processSubcategory(item: SchemaTypeMap["subcategory"]) {
  const processedItem = {
    ...item,
    category: new mongoose.Types.ObjectId(item.category),
  };
  
  await Subcategory.findOneAndUpdate(
    { name: item.name, city: item.city },
    processedItem,
    { upsert: true, new: true }
  );
}

async function processGroup(item: SchemaTypeMap["group"]) {
  const processedItem = {
    ...item,
    category: new mongoose.Types.ObjectId(item.category),
    subcategory: new mongoose.Types.ObjectId(item.subcategory),
  };
  
  await Group.findOneAndUpdate(
    { name: item.name, city: item.city },
    processedItem,
    { upsert: true, new: true }
  );
}

async function processSubgroup(item: SchemaTypeMap["subgroup"]) {
  const processedItem = {
    ...item,
    category: new mongoose.Types.ObjectId(item.category),
    subcategory: new mongoose.Types.ObjectId(item.subcategory),
    group: item.group ? new mongoose.Types.ObjectId(item.group) : undefined,
  };
  
  await Subgroup.findOneAndUpdate(
    { name: item.name, city: item.city },
    processedItem,
    { upsert: true, new: true }
  );
}

async function processBrand(item: SchemaTypeMap["brand"]) {
  const processedItem = {
    ...item,
    Category: new mongoose.Types.ObjectId(item.Category),
  };
  
  await Brand.findOneAndUpdate(
    { Brand_name: item.Brand_name, city: item.city },
    processedItem,
    { upsert: true, new: true }
  );
}

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

    // Process each item based on type
    for (const item of parsed) {
      switch (type) {
        case "category":
          await processCategory(item as SchemaTypeMap["category"]);
          break;
        case "subcategory":
          await processSubcategory(item as SchemaTypeMap["subcategory"]);
          break;
        case "group":
          await processGroup(item as SchemaTypeMap["group"]);
          break;
        case "subgroup":
          await processSubgroup(item as SchemaTypeMap["subgroup"]);
          break;
        case "brand":
          await processBrand(item as SchemaTypeMap["brand"]);
          break;
        default:
          throw new Error(`Unsupported type: ${type}`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}