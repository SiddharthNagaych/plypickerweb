//api/admin/taxonomy
import { mongooseConnect } from "@/lib/mongooseConnect";
import Category from "@/models/products/Category";
import Subcategory from "@/models/products/Subcategory";
import Group from "@/models/products/Group";
import Subgroup from "@/models/products/Subgroup";
import Brand from "@/models/products/Brand";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  await mongooseConnect();

  const city = req.nextUrl.searchParams.get("city");

  if (!city || !["Pune", "Mumbai", "Navi Mumbai"].includes(city)) {
    return NextResponse.json(
      { error: "Missing or invalid city. Allowed values: Pune, Mumbai, Navi Mumbai" },
      { status: 400 }
    );
  }

  const [categories, subcategories, groups, subgroups, brands] = await Promise.all([
    Category.find({ city }),
    Subcategory.find({ city }),
    Group.find({ city }),
    Subgroup.find({ city }),
    Brand.find({ city }),
  ]);

  return NextResponse.json({ categories, subcategories, groups, subgroups, brands });
}
