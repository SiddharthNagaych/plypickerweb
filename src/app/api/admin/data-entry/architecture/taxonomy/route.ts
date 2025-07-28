// app/api/admin/architecture/taxonomy/route.ts
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { mongooseConnect } from "@/lib/mongooseConnect";

import ArchitectureCategory from "@/models/architecture/ArchitectureCategory";
import ArchitectureSubcategory from "@/models/architecture/ArchitectureSubCategory";

const allowedCities = ["Pune", "Mumbai", "Navi Mumbai"] as const;

const BaseWithCity = z.object({
  name: z.string(),
  city: z.enum(allowedCities),
  image: z.string().optional(),
  order: z.number().optional(),
});

const CategorySchema = BaseWithCity;

const SubcategorySchema = BaseWithCity.extend({
  category: z.string(), // parent ArchitectureCategory _id
});

const schemas = {
  category: CategorySchema.array(),
  subcategory: SubcategorySchema.array(),
};

const models = {
  category: ArchitectureCategory,
  subcategory: ArchitectureSubcategory,
};

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

export async function GET(req: NextRequest) {
  await mongooseConnect();

  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city") as typeof allowedCities[number] | null;

  if (!city || !allowedCities.includes(city)) {
    return NextResponse.json(
      { error: "Valid city parameter is required" },
      { status: 400 }
    );
  }

  try {
    const categories = await ArchitectureCategory.find({ city }).sort({ order: 1 });
    const subcategories = await ArchitectureSubcategory.find({ city })
      .populate("category")
      .sort({ order: 1 });

    return NextResponse.json({
      categories,
      subcategories,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}