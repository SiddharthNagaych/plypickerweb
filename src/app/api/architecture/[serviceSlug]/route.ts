// File: /api/architecture-services/[serviceSlug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import ArchitectureService, { IArchitectureService } from "@/models/architecture/ArchitectureService";
import { isValidObjectId } from "mongoose";

const allowedCities = ["Pune", "Mumbai", "Navi Mumbai"] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: { serviceSlug: string } } // Destructure params here
) {
  try {
    const { serviceSlug } = await params; // Now properly awaited
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city") as typeof allowedCities[number];

    await mongooseConnect();

    let service = await ArchitectureService.findOne({
      $or: [
        { _id: serviceSlug },
        { slug: serviceSlug },
        { serviceName: { $regex: new RegExp(serviceSlug.replace(/-/g, ' '), 'i') } }
      ],
      city
    })
    .lean()
    .transform((doc: any) => {
      if (doc) {
        // Ensure variants have proper _id fields
        doc.variants = doc.variants.map((v: any) => ({
          ...v,
          _id: v._id?.toString() // Convert to string for frontend
        }));
      }
      return doc;
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ service });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}