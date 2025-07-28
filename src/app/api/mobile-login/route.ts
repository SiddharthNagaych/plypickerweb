import { signIn } from "../../../../auth";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { UserService } from "@/lib/userService";

export async function POST(request: Request) {
  try {
    const { phone, otp } = await request.json();
    console.log("[MOBILE LOGIN] Incoming request:", { phone, otp });

    if (!phone || !otp) {
      return NextResponse.json({ error: "Phone and OTP are required" }, { status: 400 });
    }

    const result = await signIn("phone-login", {
      phone,
      otp,
      redirect: false,
      callbackUrl: "/mobile-dummy",
    });

    console.log("[MOBILE LOGIN] signIn result:", result);

    if (!result || result.error) {
      console.error("[MOBILE LOGIN] signIn failed:", result.error);
      return NextResponse.json({ error: "Invalid OTP or login error" }, { status: 401 });
    }

    // 🔍 Fetch the user manually
    const { user } = await UserService.getUserByPhone(phone);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 🔐 Issue your own JWT for mobile
    const token = jwt.sign(
      {
        id: user._id.toString(),
        phone: user.phone,
        role: user.role,
        name: user.name,
        email: user.email,
        profileCompleted: UserService.isProfileComplete(user),
      },
      process.env.AUTH_SECRET!, // Must match NextAuth secret
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      token,
      user: {
        id: user._id.toString(),
        phone: user.phone,
        name: user.name,
        email: user.email,
        role: user.role,
        profileCompleted: UserService.isProfileComplete(user),
      },
    });
  } catch (err: any) {
    console.error("MOBILE LOGIN ERROR:", err);
    return NextResponse.json({ error: err.message || "Login error" }, { status: 500 });
  }
}
