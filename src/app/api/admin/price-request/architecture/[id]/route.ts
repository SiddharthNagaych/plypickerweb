import { NextRequest, NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import mongoose from "mongoose";
import ServicePriceRequest from "@/models/services/ServicePriceRequest";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await mongooseConnect();

  const { id } = params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const updateData: any = {};

    if (body.status) {
      updateData.status = body.status;
      if (body.status === "completed") {
        updateData.completedAt = new Date();
      }
    }

    if (body.finalPrice !== undefined) {
      updateData.finalPrice = Number(body.finalPrice);
    }

    const updated = await ServicePriceRequest.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, updated });
  } catch (err) {
    console.error("Error updating service price request:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
