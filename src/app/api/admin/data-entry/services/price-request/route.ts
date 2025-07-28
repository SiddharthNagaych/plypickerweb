// app/api/admin/services/price-requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import ServicePriceRequest, { IServicePriceRequest } from "@/models/services/ServicePriceRequest";

interface PriceRequestUpdate {
  requestId: string;
  price: number;
  adminNotes?: string;
}

export async function POST(req: NextRequest) {
  await mongooseConnect();

  try {
    const body = await req.json();
    // Set default expiration (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const priceRequest = new ServicePriceRequest({ ...body, expiresAt });
    await priceRequest.save();

    // TODO: Implement notification
    // await notifyAdmin('service', priceRequest);

    return NextResponse.json(priceRequest);
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  await mongooseConnect();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "pending";

  try {
    const requests = await ServicePriceRequest.find({ status })
      .sort({ createdAt: -1 })
      .populate("serviceId")
      .populate("subcategoryId")
      .populate("processedBy", "name email");

    return NextResponse.json(requests);
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  await mongooseConnect();

  try {
    const { requestId, price, adminNotes }: PriceRequestUpdate = await req.json();
    
    const updatedRequest = await ServicePriceRequest.findByIdAndUpdate(
      requestId,
      {
        quotedPrice: price,
        status: "quoted",
        adminNotes,
        updatedAt: new Date(),
        // In a real app, you'd set processedBy to the admin user's ID
        // processedBy: adminUserId
      },
      { new: true }
    ).populate("serviceId");

    if (!updatedRequest) {
      return NextResponse.json(
        { error: "Price request not found" },
        { status: 404 }
      );
    }

    // TODO: Implement notification
    // await notifyUser(updatedRequest.userId, "Your service price quote is ready");

    return NextResponse.json(updatedRequest);
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error }, { status: 500 });
  }
}