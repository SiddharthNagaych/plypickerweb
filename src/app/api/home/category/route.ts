import { NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import CategoryModel from "@/models/products/Category";
import SubcategoryModel from "@/models/products/Subcategory";
import GroupModel from "@/models/products/Group";
import SubgroupModel from "@/models/products/Subgroup";
import BrandModel from "@/models/products/Brand";

export async function GET(req: Request) {
  try {
    await mongooseConnect();

    const city = new URL(req.url).searchParams.get("city") || "Pune";

    // Fetch all categories for the city
    const categories = await CategoryModel.find({ city });

    const result = [];

    for (const category of categories) {
      // Use category._id instead of category.name for ObjectId fields
      const subcategories = await SubcategoryModel.find({ 
        category: category._id, // Changed from category.name to category._id
        city 
      });

      const subcatsWithChildren = [];

      for (const sub of subcategories) {
        const groups = await GroupModel.find({ 
          category: category._id, // Changed from category.name to category._id
          subcategory: sub._id, // Changed from sub.name to sub._id
          city 
        });

        const groupsWithChildren = [];

        for (const group of groups) {
          const subgroups = await SubgroupModel.find({ 
            category: category._id, // Changed from category.name to category._id
            subcategory: sub._id, // Changed from sub.name to sub._id
            group: group._id, // Changed from group.name to group._id
            city 
          });

          const subgroupsWithBrands = [];

          for (const subgroup of subgroups) {
            const brands = await BrandModel.find({ 
              category: category._id, // Changed from category.name to category._id
              subcategory: sub._id, // Changed from sub.name to sub._id
              group: group._id, // Changed from group.name to group._id
              subgroup: subgroup._id, // Changed from subgroup.name to subgroup._id
              city 
            });

            subgroupsWithBrands.push({
              id: subgroup._id.toString(),
              name: subgroup.name,
              brands: brands.map((b) => ({ id: b._id.toString(), name: b.name })),
            });
          }

          groupsWithChildren.push({
            id: group._id.toString(),
            name: group.name,
            subgroups: subgroupsWithBrands,
          });
        }

        subcatsWithChildren.push({
          id: sub._id.toString(),
          name: sub.name,
          groups: groupsWithChildren,
        });
      }

      result.push({
        id: category._id.toString(),
        name: category.name,
        subcategories: subcatsWithChildren,
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("API Error: ", err);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}