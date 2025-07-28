// app/api/coupons/user/route.ts
import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import Coupon from "@/models/Coupon";

import { mongooseConnect } from "@/lib/mongooseConnect";
import User from "@/models/User";

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



export async function POST(req: Request) {
  const session = await auth();
  // Uncomment if admin-only access is required
  // if (!session || session.user.role !== "ADMIN") {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  try {
    await mongooseConnect();
    const body = await req.json();
    const { phoneNumbers, ...rest } = body;

    if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return NextResponse.json({ error: "Phone numbers required" }, { status: 400 });
    }

    // Find users by phone numbers
    const users = await User.find({ phone: { $in: phoneNumbers } }).select("_id");
    if (users.length === 0) {
      return NextResponse.json({ error: "No users found for given phone numbers" }, { status: 404 });
    }

    const assignedTo = users.map((user) => user._id);

    const {
      code,
      type,
      discount,
      minOrder,
      validUntil,
      category,
      subcategory,
      group,
      subgroup,
    } = rest;

    // Sanitize optional fields
    const sanitizedCouponData: any = {
      code,
      type,
      discount,
      minOrder,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      assignedTo,
    };
    if (category) sanitizedCouponData.category = category;
    if (subcategory) sanitizedCouponData.subcategory = subcategory;
    if (group) sanitizedCouponData.group = group;
    if (subgroup) sanitizedCouponData.subgroup = subgroup;

    const coupon = await Coupon.create(sanitizedCouponData);

    return NextResponse.json({ success: true, coupon });
  } catch (err: any) {
    console.error("Coupon Create Error:", err);
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}
