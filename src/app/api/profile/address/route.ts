// app/api/user/addresses/route.ts

import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { mongooseConnect } from "@/lib/mongooseConnect";
import User from "@/models/User";

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await mongooseConnect();
    const user = await User.findById(session.user.id).select("addresses");
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user.addresses || []);
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json(
      { error: "Failed to fetch addresses" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    await mongooseConnect();
    
    // If setting as default, first unset any existing default
    if (body.isDefault) {
      await User.updateOne(
        { _id: session.user.id, "addresses.isDefault": true },
        { $set: { "addresses.$.isDefault": false } }
      );
    }

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $push: { addresses: body } },
      { new: true }
    ).select("addresses");

    return NextResponse.json(user?.addresses || []);
  } catch (error) {
    console.error("Error creating address:", error);
    return NextResponse.json(
      { error: "Failed to create address" },
      { status: 500 }
    );
  }
}