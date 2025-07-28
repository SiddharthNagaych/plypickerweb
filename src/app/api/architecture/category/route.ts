// /api/category/architecture/route.ts
import { NextRequest, NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import ArchitectureCategory from "@/models/architecture/ArchitectureCategory";
import ArchitectureSubcategory from "@/models/architecture/ArchitectureSubCategory";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");

  if (!city) return NextResponse.json({ error: "City required" }, { status: 400 });

  await mongooseConnect();

  const categories = await ArchitectureCategory.find({ city }).sort({ order: 1 }).lean();
  const categoryIds = categories.map((cat) => String(cat._id));

  const subcategories = await ArchitectureSubcategory.find({
    category: { $in: categoryIds },
    city,
  })
    .sort({ order: 1 })
    .lean();

  const result = categories.map((cat) => {
    const catId = String(cat._id);
    return {
      id: catId,
      name: cat.name,
      image: cat.image,
      subcategories: subcategories
        .filter((sub) => String(sub.category) === catId)
        .map((sub) => ({
          id: String(sub._id),
          name: sub.name,
          image: sub.image,
        })),
    };
  });

  return NextResponse.json(result);
}
