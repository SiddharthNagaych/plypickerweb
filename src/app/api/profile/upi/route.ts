// app/api/user/upi/route.ts
import { NextResponse } from "next/server";

import User from "@/models/User";
import {auth} from "../../../../../auth"

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await User.findById(session.user.id).select("savedUPIs");
    return NextResponse.json(user.savedUPIs || []);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch UPI IDs" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  
  try {
    const user = await User.findById(session.user.id);
    const newUPI = {
      id: Date.now().toString(),
      ...body,
      isDefault: user.savedUPIs.length === 0
    };
    
    user.savedUPIs.push(newUPI);
    await user.save();
    
    return NextResponse.json(newUPI);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to add UPI ID" },
      { status: 500 }
    );
  }
}