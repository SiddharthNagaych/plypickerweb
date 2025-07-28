// File: /api/admin/user-price/route.ts
import { NextRequest, NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import UserServicePrice from "@/models/UserServicePrice";
import UserArchitecturePrice from "@/models/UserArchitecturePrice";

export async function POST(req: NextRequest) {
  await mongooseConnect();

  const body = await req.json();
  console.log("POST /api/admin/user-price body:", body);

  const { 
    type, 
    userId, 
    serviceId, 
    variant, 
    variantId,  // Add variantId
    variantName, // Add variantName
    city, 
    finalPrice,
    priceRequestId 
  } = body;

  if (!type || !userId || !serviceId || !variant || !city || !finalPrice) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const priceData = {
      userId,
      serviceId,
      variant,
      variantId: variantId || null, // Include variantId
      variantName: variantName || variant, // Use variantName if provided, fallback to variant
      city,
      finalPrice,
      priceRequestId: priceRequestId || null
    };

    if (type === "service") {
      await UserServicePrice.create(priceData);
    } else if (type === "architecture") {
      await UserArchitecturePrice.create(priceData);
    } else {
      return NextResponse.json({ error: "Invalid service type" }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      message: "User price record created successfully"
    });
  } catch (err) {
    console.error("Error saving user price:", err);
    return NextResponse.json(
      { error: "Internal Server Error"},
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  await mongooseConnect();

  const body = await req.json();
  console.log("PATCH /api/admin/user-price body:", body);

  const { 
    type,
    userId,
    serviceId,
    variantId,
    finalPrice
  } = body;

  if (!type || !userId || !serviceId || !variantId || !finalPrice) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const updateData = {
      finalPrice,
      updatedAt: new Date()
    };

    let result;
    if (type === "service") {
      result = await UserServicePrice.findOneAndUpdate(
        { userId, serviceId, variantId },
        updateData,
        { new: true }
      );
    } else if (type === "architecture") {
      result = await UserArchitecturePrice.findOneAndUpdate(
        { userId, serviceId, variantId },
        updateData,
        { new: true }
      );
    } else {
      return NextResponse.json({ error: "Invalid service type" }, { status: 400 });
    }

    if (!result) {
      return NextResponse.json({ error: "Price record not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      updatedPrice: result
    });
  } catch (err) {
    console.error("Error updating user price:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}