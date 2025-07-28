// app/api/admin/services/taxonomy/[type]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import mongoose from "mongoose";
import ServiceCategory from "@/models/services/ServiceCategory";
import ServiceSubcategory from "@/models/services/ServiceSubCategory";
import ArchitectureCategory from "@/models/architecture/ArchitectureCategory";
import ArchitectureSubcategory from "@/models/architecture/ArchitectureSubCategory";

const allowedTypes = ["service", "architecture"] as const;
type TaxonomyType = typeof allowedTypes[number];

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await context.params;
    const typeCast = type as TaxonomyType;

    if (!allowedTypes.includes(typeCast)) {
      return NextResponse.json({ error: "Invalid taxonomy type" }, { status: 400 });
    }

    await mongooseConnect();

    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");

    if (!city) {
      return NextResponse.json({ error: "City parameter is required" }, { status: 400 });
    }

    let categories, subcategories;

    if (typeCast === "service") {
      categories = await ServiceCategory.find({ city }).sort({ order: 1 });
      subcategories = await ServiceSubcategory.find({ city })
        .populate("category")
        .sort({ order: 1 });
    } else {
      categories = await ArchitectureCategory.find({ city }).sort({ order: 1 });
      subcategories = await ArchitectureSubcategory.find({ city })
        .populate("category")
        .sort({ order: 1 });
    }

    return NextResponse.json({
      categories: categories.map((c) => ({
        _id: c._id,
        name: c.name,
        image: c.image,
        city: c.city,
      })),
      subcategories: subcategories.map((s) => ({
        _id: s._id,
        name: s.name,
        category: s.category,
        image: s.image,
        city: s.city,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await context.params;
    const typeCast = type as TaxonomyType;

    if (!allowedTypes.includes(typeCast)) {
      return NextResponse.json({ error: "Invalid taxonomy type" }, { status: 400 });
    }

    await mongooseConnect();

    const body = await request.json();
    const { itemType, data } = body;

    if (!itemType || !data || !data.city) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let result;

    if (typeCast === "service") {
      if (itemType === "category") {
        const exists = await ServiceCategory.findOne({
          name: data.name,
          city: data.city,
        });

        if (exists) {
          return NextResponse.json(
            { error: "Category already exists for this city" },
            { status: 400 }
          );
        }

        result = await ServiceCategory.create(data);
      } else {
        const categoryExists = await ServiceCategory.exists({
          _id: data.category,
        });

        if (!categoryExists) {
          return NextResponse.json(
            { error: "Parent category not found" },
            { status: 404 }
          );
        }

        result = await ServiceSubcategory.create({
          ...data,
          category: new mongoose.Types.ObjectId(data.category),
        });
      }
    } else {
      if (itemType === "category") {
        const exists = await ArchitectureCategory.findOne({
          name: data.name,
          city: data.city,
        });

        if (exists) {
          return NextResponse.json(
            { error: "Category already exists for this city" },
            { status: 400 }
          );
        }

        result = await ArchitectureCategory.create(data);
      } else {
        const categoryExists = await ArchitectureCategory.exists({
          _id: data.category,
        });

        if (!categoryExists) {
          return NextResponse.json(
            { error: "Parent category not found" },
            { status: 404 }
          );
        }

        result = await ArchitectureSubcategory.create({
          ...data,
          category: new mongoose.Types.ObjectId(data.category),
        });
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 400 }
    );
  }
}
