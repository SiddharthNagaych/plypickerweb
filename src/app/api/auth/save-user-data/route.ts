// app/api/auth/save-user/route.ts
import { NextResponse } from "next/server";
import {mongooseConnect} from "@/lib/mongooseConnect";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const userData = await req.json();
    
    if (!userData.phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    await mongooseConnect();

    // Update or create user
    const user = await User.findOneAndUpdate(
      { phone: userData.phone },
      { 
        $set: {
          name: userData.name,
          email: userData.email,
          pincode: userData.pincode,
          gender: userData.gender,
          phoneVerified: new Date() 
        }
      },
      { 
        upsert: true,
        new: true,
        runValidators: true 
      }
    );

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("Save user error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save user data" },
      { status: 500 }
    );
  }
}