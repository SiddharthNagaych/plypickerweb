// app/api/admin/price-requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import ServicePriceRequest from "@/models/services/ServicePriceRequest";
import ArchitecturePriceRequest from "@/models/architecture/ArchitecturePriceRequest";
import ArchitectureService from "@/models/architecture/ArchitectureService";
import Service from "@/models/services/Services";
import User from "@/models/User";
import { NextApiRequest, NextApiResponse } from "next";

// Preload models for population
ArchitectureService;
Service;
User;

export async function GET(req: NextApiRequest, res: NextApiResponse) {
  await mongooseConnect();

  try {
    const serviceRequests = await ServicePriceRequest.find()
      .populate("serviceId", "serviceName")
      .populate("userId", "_id name phoneNumber email")
      .sort({ createdAt: -1 });

    const architectureRequests = await ArchitecturePriceRequest.find()
      .populate("serviceId", "serviceName")
      .populate("userId", "_id name phoneNumber email")
      .sort({ createdAt: -1 });

    const combined = [
      ...serviceRequests.map((r: any) => ({
        _id: r._id,
        type: "service",
        serviceId: r.serviceId?._id?.toString(),
        serviceName: r.serviceId?.serviceName || "Unknown",
        variant: r.variant,
        city: r.city,
        status: r.status,
        userName: r.userId?.name || r.userName || "N/A",
        userPhone: r.userId?.phoneNumber || r.userPhone || "N/A",
        userEmail: r.userId?.email || r.userEmail || "N/A",
        userId: r.userId?._id?.toString(),
        requestedAt: r.requestedAt,
        completedAt: r.completedAt,
        finalPrice: r.finalPrice,
        createdAt: r.createdAt,
      })),
      ...architectureRequests.map((r: any) => ({
        _id: r._id,
        type: "architecture",
        serviceId: r.serviceId?._id?.toString(),
        serviceName: r.serviceId?.serviceName || "Unknown",
        variant: r.variant,
        city: r.city,
        status: r.status,
        userName: r.userId?.name || r.userName || "N/A",
        userPhone: r.userId?.phoneNumber || r.userPhone || "N/A",
        userEmail: r.userId?.email || r.userEmail || "N/A",
        userId: r.userId?._id?.toString(),
        requestedAt: r.requestedAt,
        completedAt: r.completedAt,
        finalPrice: r.finalPrice,
        createdAt: r.createdAt,
      })),
    ];

    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ success: true, requests: combined });
  } catch (err) {
    console.error("Failed to fetch price requests", err);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
