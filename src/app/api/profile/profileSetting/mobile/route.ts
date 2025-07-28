// app/api/mobile/profile/route.ts           (Next.js 13+ “app router”)
import { NextResponse }     from "next/server";
import { mongooseConnect }  from "@/lib/mongooseConnect";
import User                 from "@/models/User";

/* helper ---------------------------------------------------------- */
async function connectDB() {
  /* idempotent – does nothing if already connected */
  await mongooseConnect();
}

/* ------------------------------------------------ GET /…/profile */
export async function GET(req: Request) {
  try {
    await connectDB();

    /* userId MUST be in the query string */
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 },
      );
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(user);                    // 200 OK
  } catch (err) {
    console.error("[MOBILE‑PROFILE‑GET]", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------ PUT /…/profile */
export async function PUT(req: Request) {
  try {
    await connectDB();

    const body   = await req.json();
    const userId = body.userId as string | undefined;
    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId in body" },
        { status: 400 },
      );
    }

    const { userId: _ignored, ...changes } = body;     // strip userId
    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: changes },
      { new: true, runValidators: true },
    ).select("-password");

    if (!updated) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(updated);                 // 200 OK
  } catch (err) {
    console.error("[MOBILE‑PROFILE‑PUT]", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 },
    );
  }
}
