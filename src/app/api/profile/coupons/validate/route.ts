import { NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { mongooseConnect } from "@/lib/mongooseConnect";
import Coupon from "@/models/Coupon";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    await mongooseConnect();
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await req.json();
    if (!code) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const coupon = await Coupon.findOne({ code }).populate("category subcategory group subgroup").lean();

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // Check if coupon is assigned to this user
    const isAssigned = coupon.assignedTo?.some(
      (id: any) => id.toString() === user._id.toString()
    );
    if (!isAssigned) {
      return NextResponse.json({ error: "This coupon is not assigned to you" }, { status: 403 });
    }

    // Check expiry
    if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) {
      return NextResponse.json({ error: "This coupon has expired" }, { status: 410 });
    }

    return NextResponse.json({
      code: coupon.code,
      discount: coupon.discount,
      type: coupon.type,
      minOrder: coupon.minOrder,
      validUntil: coupon.validUntil,
      categoryId: coupon.category?._id,
      subcategoryId: coupon.subcategory?._id,
      groupId: coupon.group?._id,
      subgroupId: coupon.subgroup?._id,
    });
  } catch (err: any) {
    console.error("Coupon validation error:", err);
    return NextResponse.json({ error: "Server error validating coupon" }, { status: 500 });
  }
}
