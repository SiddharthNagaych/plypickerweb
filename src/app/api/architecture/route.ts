import { NextRequest, NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import ArchitectureService from "@/models/architecture/ArchitectureService";

const allowedCities = ["Pune", "Mumbai", "Navi Mumbai"] as const;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city") as typeof allowedCities[number];
    const categoryId = searchParams.get("categoryId");
    const subcategoryId = searchParams.get("subcategoryId");

    if (!city || !allowedCities.includes(city)) {
      return NextResponse.json(
        { error: "Invalid or missing city parameter" },
        { status: 400 }
      );
    }

    await mongooseConnect();

    const filter: any = { city };
    if (categoryId) filter.serviceCategory = categoryId;
    if (subcategoryId) filter.serviceSubcategory = subcategoryId;

    const services = await ArchitectureService.find(filter).lean();
    return NextResponse.json({ services });
  } catch (error) {
    console.error("Architecture API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch architecture services" },
      { status: 500 }
    );
  }
}
