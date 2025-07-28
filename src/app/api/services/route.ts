import { NextRequest, NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import Service from "@/models/services/Services";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");
    const categoryId = searchParams.get("categoryId");
    const subcategoryId = searchParams.get("subcategoryId");

    if (!city) {
      return NextResponse.json({ error: "City is required" }, { status: 400 });
    }

    await mongooseConnect();

    const filter: any = { city };

    if (categoryId) filter.serviceCategory = categoryId;
    if (subcategoryId) filter.serviceSubcategory = subcategoryId;

    const services = await Service.find(filter).lean();
    return NextResponse.json({ services });
  } catch (error) {
    console.error("Service API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}
