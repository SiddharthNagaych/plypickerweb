import { NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import Address from "@/models/Address";
import mongoose from "mongoose";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
const log = (...msg: unknown[]) => console.log("[mobile‑address]", ...msg);

function bad(msg: string, details?: any) {
  log("400 →", msg, details ?? "");
  return NextResponse.json({ error: msg, details }, { status: 400 });
}

/* ------------------------------------------------------------------ */
/* GET ?userId=xyz → return that user’s addresses                     */
export async function GET(req: Request) {
  await mongooseConnect();

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return bad("Missing userId query param");

  try {
    const list = await Address.find({ userId });
    log(`GET ok (${list.length}) for`, userId);
    return NextResponse.json(list);
  } catch (err) {
    log("500 → fetch failed", err);
    return NextResponse.json(
      { error: "Error fetching addresses" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/* POST – body must include userId + minimal address fields           */
export async function POST(req: Request) {
  await mongooseConnect();

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid JSON");
  }

  /* 1. required fields */
  const required = ["userId", "name", "phone", "addressLine"];
  const missing = required.filter((k) => !body[k]);
  if (missing.length) return bad("Missing required fields", missing);

  /* 2. build doc */
  const data = {
    userId: new mongoose.Types.ObjectId(body.userId),
    name: body.name,
    phone: body.phone,
    type: body.type ?? "HOME",
    addressLine: body.addressLine,
    city: body.city,
    state: body.state,
    pincode: body.pincode,
    country: body.country ?? "India",
    coordinates: body.coordinates, // { latitude, longitude }
    distanceFromCenter: body.distanceFromCenter,
    isActive: body.isActive !== false,
  };

  try {
    const doc = await Address.create(data);
    log("POST ok →", doc._id.toString());
    return NextResponse.json(doc, { status: 201 });
  } catch (err: any) {
    if (err instanceof mongoose.Error.ValidationError) {
      const detail = Object.values(err.errors).map((e) => e.message);
      return bad("Validation failed", detail);
    }
    log("500 → save failed", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
