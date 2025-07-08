// app/api/auth/request-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "crypto";
import { mongooseConnect } from "@/lib/mongooseConnect";
import OtpVerification from "@/models/OtpVerification";

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    // Validate phone number
    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = randomInt(100000, 999999).toString();
    await mongooseConnect();

    // Get client IP and user agent for security
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Save OTP to database
    const otpEntry = await OtpVerification.createOTP(phone, {
      ipAddress,
      userAgent,
      otp // Pass the generated OTP
    });

    // Send OTP via Fast2SMS
    const smsResponse = await sendOtpViaFast2SMS(phone, otp);
    
    if (!smsResponse.success) {
      console.error("SMS sending failed:", smsResponse.error);
      return NextResponse.json(
        { error: smsResponse.error || "Failed to send OTP via SMS" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "OTP sent successfully",
      // For development only - remove in production
      debug: process.env.NODE_ENV === 'development' ? { otp } : undefined
    });

  } catch (error: any) {
    console.error("OTP request error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

async function sendOtpViaFast2SMS(phone: string, otp: string) {
  try {
    // Skip SMS in development
    // if (process.env.NODE_ENV === 'development') {
    //   console.log(`[DEV] OTP for ${phone}: ${otp}`);
    //   return { success: true };
    // }

    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        Authorization: process.env.FAST2SMS_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender_id: "PLYPKR",
        message: "154650", // Your Fast2SMS template ID
        variables_values: otp,
        route: "dlt",
        numbers: phone,
        DLT_TE_ID: "1207168300706444380", // Your DLT Template ID
      }),
    });

    const result = await response.json();

    if (!result.return) {
      console.error("Fast2SMS Error:", result);
      return { 
        success: false, 
        error: result.message || "Failed to send OTP via SMS" 
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error("SMS sending error:", error);
    return { 
      success: false, 
      error: error.message || "Failed to connect to SMS service" 
    };
  }
}