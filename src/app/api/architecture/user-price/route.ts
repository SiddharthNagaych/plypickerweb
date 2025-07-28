import { NextRequest, NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import { auth } from "../../../../../auth"; // adjust path if needed
import UserArchitecturePrice from "@/models/UserArchitecturePrice";

export async function POST(req: NextRequest) {
  await mongooseConnect();
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { serviceId, variant, city } = await req.json();

    // 🔍 Add logging
    console.log("🔍 Checking custom price for:", {
      userId: session.user.id,
      serviceId,
      variant,
      city,
    });

    const customPrice = await UserArchitecturePrice.findOne({
      userId: session.user.id,
      serviceId, // ✅ FIXED: correct field name
      variant,
      city,
    });

    if (!customPrice) {
      console.log("❌ No custom price found.");
      return NextResponse.json({ found: false });
    }

    console.log("✅ Found custom price:", customPrice.finalPrice);
    return NextResponse.json({ found: true, finalPrice: customPrice.finalPrice });
  } catch (err) {
    console.error("❌ Failed to fetch user architecture price", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
