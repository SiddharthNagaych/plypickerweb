// models/OtpVerification.ts
import mongoose, { Schema, model, models } from "mongoose";

interface IOtpVerification extends mongoose.Document {
  phone: string;
  otp: string;
  verified: boolean;
  verifiedAt?: Date;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  ipAddress?: string;
  userAgent?: string;
}

interface IOtpVerificationModel extends mongoose.Model<IOtpVerification> {
  createOTP(phone: string, metadata?: any): Promise<IOtpVerification>;
  verifyOTP(phone: string, otp: string): Promise<IOtpVerification | null>;
}

const otpVerificationSchema = new Schema<IOtpVerification>(
  {
    phone: { type: String, required: true, index: true },
    otp: { type: String, required: true },
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    // FIXED: Remove index: true here since we're adding TTL index separately
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for better performance
otpVerificationSchema.index({ phone: 1, otp: 1, verified: 1 });
// TTL index - this will handle both indexing and auto-deletion
otpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to create OTP
otpVerificationSchema.statics.createOTP = async function(phone: string, metadata: any = {}) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  
  // Invalidate previous OTPs
  await this.updateMany(
    { phone, verified: false },
    { $set: { verified: true, verifiedAt: new Date() } }
  );
  
  return await this.create({
    phone,
    otp,
    expiresAt,
    ...metadata
  });
};

// Static method to verify OTP
otpVerificationSchema.statics.verifyOTP = async function(phone: string, otp: string) {
  const otpEntry = await this.findOne({
    phone,
    otp,
    verified: false,
    expiresAt: { $gt: new Date() }
  });
  
  if (!otpEntry) {
    // Increment attempts for rate limiting
    await this.updateOne(
      { phone, otp },
      { $inc: { attempts: 1 } }
    );
    return null;
  }
  
  // Mark as verified
  otpEntry.verified = true;
  otpEntry.verifiedAt = new Date();
  await otpEntry.save();
  
  return otpEntry;
};

const OtpVerification: IOtpVerificationModel = models.OtpVerification as IOtpVerificationModel || model("OtpVerification", otpVerificationSchema);
export default OtpVerification;