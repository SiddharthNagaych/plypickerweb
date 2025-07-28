import { NextRequest, NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import UserServicePrice from "@/models/UserServicePrice";
import UserArchitecturePrice from "@/models/UserArchitecturePrice";

export async function POST(req: NextRequest) {
  await mongooseConnect();

  try {
    const body = await req.json();
    const { type, userId, serviceId, variant, city, finalPrice } = body;

    if (!type || !userId || !serviceId || !variant || finalPrice == null || !city) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let record;

    if (type === "service") {
      record = await UserServicePrice.findOneAndUpdate(
        { userId, serviceId, variant, city },
        { userId, serviceId, variant, city, finalPrice },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else if (type === "architecture") {
      record = await UserArchitecturePrice.findOneAndUpdate(
        { userId, serviceId, variant, city },
        { userId, serviceId, variant, city, finalPrice },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else {
      return NextResponse.json({ error: "Invalid type. Must be 'service' or 'architecture'" }, { status: 400 });
    }

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error("Error saving user price:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}