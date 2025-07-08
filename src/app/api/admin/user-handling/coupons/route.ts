// File: /app/api/admin/coupons/route.ts

import { NextRequest, NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import Coupon from "@/models/Coupon";
import { auth } from "../../../../../../auth";

export async function GET(req: NextRequest) {
  await mongooseConnect();
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");

  const filter = userId ? { userIds: userId } : {};
  const coupons = await Coupon.find(filter).lean();
  return NextResponse.json({ coupons });
}

export async function POST(req: NextRequest) {
  await mongooseConnect();
  const body = await req.json();

  const newCoupon = await Coupon.create(body);
  return NextResponse.json({ coupon: newCoupon });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return new Response("Unauthorized", { status: 401 });
  }

  await mongooseConnect();
  const body = await req.json();

  const { id, ...updateData } = body;
  const updatedCoupon = await Coupon.findByIdAndUpdate(id, updateData, {
    new: true,
  });
  return NextResponse.json({ coupon: updatedCoupon });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return new Response("Unauthorized", { status: 401 });
  }

  await mongooseConnect();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  await Coupon.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
