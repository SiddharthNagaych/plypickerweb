// src/app/api/admin/saved-methods/route.ts

import { NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import SavedCard from "@/models/payments/SavedCard";
import SavedUPI from "@/models/payments/SavedUPI";
import SavedBankAccount from "@/models/payments/SavedBankAccount";

export async function GET(req: Request) {
  await mongooseConnect();

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const [cards, upis, banks] = await Promise.all([
    SavedCard.find({ userId }).lean(),
    SavedUPI.find({ userId }).lean(),
    SavedBankAccount.find({ userId }).lean(),
  ]);

  return NextResponse.json({ cards, upis, banks });
}

export async function DELETE(req: Request) {
  await mongooseConnect();

  const { methodType, id } = await req.json();

  if (!methodType || !id) {
    return NextResponse.json({ error: "Missing methodType or id" }, { status: 400 });
  }

  try {
    switch (methodType) {
      case "card":
        await SavedCard.findByIdAndDelete(id);
        break;
      case "upi":
        await SavedUPI.findByIdAndDelete(id);
        break;
      case "bank":
        await SavedBankAccount.findByIdAndDelete(id);
        break;
      default:
        return NextResponse.json({ error: "Invalid methodType" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
