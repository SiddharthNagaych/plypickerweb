// app/api/user/pcash/route.ts
import { NextResponse } from "next/server";

import { auth } from "../../../../../auth";
import User from "@/models/User";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await User.findById(session.user.id)
      .select("pcash credited consumed")
      .populate("credited.productId", "product_name")
      .populate("consumed.productId", "product_name");

    // Calculate totals
    const totalCredited = user.credited.reduce((sum: number, item: any) => sum + item.amount, 0);
    const totalConsumed = user.consumed.reduce((sum: number, item: any) => sum + item.amount, 0);
    const currentBalance = totalCredited - totalConsumed;

    // Get expiring soon credits (within 30 days)
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.setDate(now.getDate() + 30));
    const expiringSoon = user.credited.filter((item: any) => 
      item.expiresAt && new Date(item.expiresAt) <= thirtyDaysFromNow
    );

    return NextResponse.json({
      credited: user.credited,
      consumed: user.consumed,
      expiringSoon,
      totalCredited,
      totalConsumed,
      currentBalance
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch PCash data" },
      { status: 500 }
    );
  }
}