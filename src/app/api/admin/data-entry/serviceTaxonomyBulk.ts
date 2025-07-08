import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { mongooseConnect } from "@/lib/mongooseConnect";

// Models for services
import ServiceCategory from "@/models/services/ServiceCategory";
import ServiceSubcategory from "@/models/services/ServiceSubCategory";

// City support
const allowedCities = ["Pune", "Mumbai", "Navi Mumbai"] as const;

// Zod schemas
const BaseWithCity = z.object({
  name: z.string(),
  city: z.enum(allowedCities),
});

const CategorySchema = BaseWithCity;

const SubcategorySchema = BaseWithCity.extend({
  category: z.string(), // parent category ID
});

// Schema maps
const schemas = {
  category: CategorySchema.array(),
  subcategory: SubcategorySchema.array(),
};

const models = {
  category: ServiceCategory,
  subcategory: ServiceSubcategory,
};

// Types
type SchemaTypeMap = {
  category: z.infer<typeof CategorySchema>;
  subcategory: z.infer<typeof SubcategorySchema>;
};

type TypeKey = keyof SchemaTypeMap;

export async function POST(req: NextRequest) {
   await mongooseConnect();

  const body = (await req.json()) as {
    type: TypeKey;
    items: unknown;
  };

  const { type, items } = body;

  if (!schemas[type]) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  try {
    const parsed = schemas[type].parse(items);
    const Model = models[type];

    for (const raw of parsed) {
      const itemWithObjectIds: Record<string, unknown> = { ...raw };

      if (type === "subcategory") {
        const sub = raw as SchemaTypeMap["subcategory"];
        itemWithObjectIds.category = new mongoose.Types.ObjectId(sub.category);
      }

      await Model.findOneAndUpdate(
        {
          name: raw.name,
          city: raw.city,
        },
        itemWithObjectIds,
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 400 }
    );
  }
}
