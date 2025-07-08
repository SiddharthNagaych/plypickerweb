// app/api/user/profile/route.ts

import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";

import User from "@/models/User";

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  
  try {
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $set: body },
      { new: true }
    ).select("-password");

    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}