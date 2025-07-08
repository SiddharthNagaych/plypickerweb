// app/api/admin/pcash/route.ts

import { NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import PCash from "@/models//PCash"; // Import your PCash model
import { auth } from "../../../../../../auth";

export async function GET(req: Request) {
  await mongooseConnect();

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

 
  const filter: any = {};
  if (userId) filter.userId = userId;

  const pcashEntries = await PCash.find(filter).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ pcash: pcashEntries });
}

export async function POST(req: Request) {
   const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
    await mongooseConnect();
  const body = await req.json();

 

  const { userId, type, amount, reason, productId, expiresAt } = body;

  if (!userId || !type || !amount) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const newEntry = await PCash.create({
    userId,
    type,
    amount,
    reason,
    productId,
    expiresAt,
  });

  return NextResponse.json({ message: "PCash credited", data: newEntry });
}
