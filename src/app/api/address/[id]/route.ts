import { NextRequest, NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import Address from "@/models/Address";
import { getLoggedInUser } from "@/lib/getLoggedInUser";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }     // ✅ params is now a Promise
) {
  try {
    /* 0. auth */
    const userId = await getLoggedInUser({ headers: req.headers });

    /* 1. param guard */
    const params = await context.params;  // ✅ await params first
    const id = params?.id;
    if (!id || id === "undefined") {
      return NextResponse.json({ error: "Address id required" }, { status: 400 });
    }

    /* 2. db */
    await mongooseConnect();
    const deleted = await Address.findOneAndDelete({ _id: id, userId });

    if (!deleted) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Address deleted" }, { status: 200 });
  } catch (err: any) {
    if (err?.message === "UNAUTH") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[DELETE /api/address/[id]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}