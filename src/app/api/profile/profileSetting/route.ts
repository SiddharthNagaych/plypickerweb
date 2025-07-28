import { NextResponse } from "next/server";
import { auth }          from "../../../../../auth";          //  <-- adjust if your auth helper lives elsewhere
import { mongooseConnect } from "@/lib/mongooseConnect";
import User               from "@/models/User";

/** Helpers -------------------------------------------------------- */
async function getLoggedInUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTH");
  await mongooseConnect();                       // ensure DB is connected
  return session.user.id as string;
}

/** GET  /api/user/profile  --------------------------------------- */
export async function GET() {
  try {
    const id = await getLoggedInUser();
    const user = await User.findById(id).select("-password");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(user);              // 200
  } catch (err: any) {
    if (err.message === "UNAUTH") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[PROFILE‑GET]", err);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

/** PUT  /api/user/profile  --------------------------------------- */
export async function PUT(req: Request) {
  try {
    const id   = await getLoggedInUser();
    const body = await req.json();

    const updated = await User.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true },
    ).select("-password");

    return NextResponse.json(updated);           // 200
  } catch (err: any) {
    if (err.message === "UNAUTH") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[PROFILE‑PUT]", err);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
