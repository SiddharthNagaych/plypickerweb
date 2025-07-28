
import { NextRequest, NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import Service, { IService } from "@/models/services/Services";
import { isValidObjectId } from "mongoose";

const allowedCities = ["Pune", "Mumbai", "Navi Mumbai"] as const;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ serviceSlug: string }> }
) {
  try {
    const { serviceSlug } = await context.params;
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city") as typeof allowedCities[number];

    console.log("API Request Received:", { serviceSlug, city });

    if (!city || !allowedCities.includes(city)) {
      console.error("Invalid city parameter:", city);
      return NextResponse.json(
        { error: "Invalid or missing city parameter" },
        { status: 400 }
      );
    }

    await mongooseConnect();

    let service: IService | null = null;

    if (isValidObjectId(serviceSlug)) {
      service = await Service.findOne({ _id: serviceSlug, city }).lean() as IService | null;
    }

    if (!service) {
      service = await Service.findOne({ slug: serviceSlug, city }).lean() as IService | null;
    }

    if (!service) {
      service = await Service.findOne({
        serviceName: { $regex: new RegExp(serviceSlug.replace(/-/g, ' '), 'i') },
        city,
      }).lean() as IService | null;
    }

    if (!service) {
      console.error("Service not found for:", { serviceSlug, city });
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    console.log("Service found:", {
      id: service._id,
      name: service.serviceName,
      city: service.city
    });

    return NextResponse.json({ service });
  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
