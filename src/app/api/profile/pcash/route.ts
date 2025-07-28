import Product from "@/models/products/Product";
import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import User from "@/models/User";
import PCash from "@/models/PCash";

import { mongooseConnect } from "@/lib/mongooseConnect";

interface CreditEntry {
  amount: number;
  reason: string;
  expiresAt?: Date;
  source?: string;
  status?: string;
  productId?: string;
}

interface ConsumedEntry {
  amount: number;
  productId?: string;
}

export async function POST(req: Request) {
  try {
    await mongooseConnect();
    const body = await req.json();
    const { phoneNumbers, amount, reason, expiresAt } = body;

    if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return NextResponse.json({ error: "No phone numbers provided" }, { status: 400 });
    }

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Invalid credit amount" }, { status: 400 });
    }

    if (!["return_refund", "referral", "promotion", "other"].includes(reason)) {
      return NextResponse.json({ error: "Invalid reason provided" }, { status: 400 });
    }

    const users = await User.find({ phone: { $in: phoneNumbers } });
    if (users.length === 0) {
      return NextResponse.json({ error: "No users found with these phone numbers" }, { status: 404 });
    }

    const results = await Promise.all(
      users.map(async (user) => {
        const creditEntry: CreditEntry = {
          amount,
          reason,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
          source: "admin",
          status: "active",
        };

        const pcashDoc = await PCash.findOneAndUpdate(
          { userId: user._id },
          {
            $push: { credited: creditEntry },
            $inc: { totalCredited: amount, currentBalance: amount },
          },
          { upsert: true, new: true }
        );

        return pcashDoc;
      })
    );

    return NextResponse.json({
      success: true,
      creditedCount: results.length,
      results,
    });
  } catch (error: any) {
    console.error("❌ PCash Credit Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await mongooseConnect();

    // Ensure Product model is registered by referencing it
    // This forces Mongoose to register the model before we use populate
    Product;

    let pcashDoc = await PCash.findOne({ userId: session.user.id })
      .populate("credited.productId", "product_name")
      .populate("consumed.productId", "product_name");

    if (!pcashDoc) {
      return NextResponse.json({
        credited: [],
        consumed: [],
        expiringSoon: [],
        totalCredited: 0,
        totalConsumed: 0,
        currentBalance: 0,
      });
    }

    const totalCredited =
      pcashDoc.totalCredited ?? pcashDoc.credited.reduce((sum: number, item: CreditEntry) => sum + (item.amount || 0), 0);
    const totalConsumed =
      pcashDoc.totalConsumed ?? pcashDoc.consumed.reduce((sum: number, item: ConsumedEntry) => sum + (item.amount || 0), 0);
    const currentBalance =
      pcashDoc.currentBalance ?? totalCredited - totalConsumed;

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const expiringSoon = pcashDoc.credited.filter(
      (item: CreditEntry) => item.expiresAt && new Date(item.expiresAt) <= thirtyDaysFromNow
    );

    return NextResponse.json({
      credited: pcashDoc.credited,
      consumed: pcashDoc.consumed,
      expiringSoon,
      totalCredited,
      totalConsumed,
      currentBalance,
    });
  } catch (error) {
    console.error("❌ PCash GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch PCash data" }, { status: 500 });
  }
}