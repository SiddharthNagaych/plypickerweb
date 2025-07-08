import { NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import CategoryModel from "@/models/products/Category";
import ServiceModel from "@/models/services/Services";
import ServiceCategoryModel from "@/models/services/ServiceCategory";
import ArchitectureModel from "@/models/architecture/ArchitectureService";
import ArchitectureCategoryModel from "@/models/architecture/ArchitectureCategory";

export async function GET(req: Request) {
  try {
    await mongooseConnect();

    const url = new URL(req.url);
    const city = url.searchParams.get("city") || "Pune";
    const tab = url.searchParams.get("tab") || "product";

    let responseData = {};

    switch (tab) {
      case "product":
        const categories = await CategoryModel.find({ city })
          .select("name category_image")
          .lean();
        
        responseData = {
          categories: categories.map((cat: any) => ({
            id: cat._id.toString(),
            name: cat.name,
            category_image: cat.category_image,
          })),
        };
        break;

      case "services":
        const serviceCategories = await ServiceCategoryModel.find({ city })
          .select("name image slug order")
          .sort({ order: 1 })
          .lean();
        
        responseData = {
          services: serviceCategories.map((service: any) => ({
            id: service._id.toString(),
            name: service.name,
            image: service.image,
            slug: service.slug,
          })),
        };
        break;

      case "architecture":
        const architectureCategories = await ArchitectureCategoryModel.find({ city })
          .select("name image slug order")
          .sort({ order: 1 })
          .lean();
        
        responseData = {
          architecture: architectureCategories.map((arch: any) => ({
            id: arch._id.toString(),
            name: arch.name,
            image: arch.image,
            slug: arch.slug,
          })),
        };
        break;

      default:
        return NextResponse.json(
          { error: "Invalid tab parameter" },
          { status: 400 }
        );
    }

    return NextResponse.json(responseData);
  } catch (err) {
    console.error("Hero API Error:", err);
    return NextResponse.json(
      { error: "Failed to load hero data" },
      { status: 500 }
    );
  }
}