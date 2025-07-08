// app/api/coupons/user/route.ts
import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import Coupon from "@/models/Coupon";
import { Types } from "mongoose";

interface FormattedCoupon {
  id: string;
  code: string;
  discount: number;
  type: "percentage" | "fixed";
  minOrder: number;
  validUntil?: Date;
  categoryName?: string;
  subcategoryName?: string;
  groupName?: string;
  subgroupName?: string;
}

export async function GET() {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const coupons = await Coupon.find({ assignedTo: session.user.id })
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("group", "name")
      .populate("subgroup", "name")
      .lean();

    const formatted: FormattedCoupon[] = coupons.map(c => ({
      id: c._id.toString(),
      code: c.code,
      discount: c.discount,
      type: c.type,
      minOrder: c.minOrder,
      validUntil: c.validUntil,
      categoryName: (c as any).category?.name,
      subcategoryName: (c as any).subcategory?.name,
      groupName: (c as any).group?.name,
      subgroupName: (c as any).subgroup?.name,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching user coupons:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}