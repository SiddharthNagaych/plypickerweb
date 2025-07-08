// lib/userService.ts
import User from "@/models/User";
import OtpVerification from "@/models/OtpVerification";
import { mongooseConnect } from "@/lib/mongooseConnect";

interface UserData {
  phone?: string;
  email?: string;
  name?: string;
  image?: string;
  pincode?: string;
  gender?: string;
  provider?: string;
  providerId?: string;
}

export class UserService {
  static async createOrUpdateUser(userData: UserData) {
    await mongooseConnect();

    try {
      // Check if user exists by phone or email
      let user = null;
      if (userData.phone) {
        user = await User.findOne({ phone: userData.phone });
      } else if (userData.email) {
        user = await User.findOne({ email: userData.email });
      }

      if (user) {
        // Update existing user
        Object.assign(user, userData);
        await user.save();
        return { success: true, user };
      }

      // Create new user
      const newUser = await User.create({
        ...userData,
        role: "USER", // Default role
        profileCompleted: this.isProfileComplete(userData),
      });

      return { success: true, user: newUser };
    } catch (error: any) {
      console.error("User service error:", error);
      return { success: false, error: error.message };
    }
  }

  // Update the verifyPhoneAndCreateUser method to be used only for signup
  static async verifyPhoneAndCreateUser(
    phone: string,
    otp: string,
    additionalData: any = {}
  ): Promise<{ success: boolean; user?: any; error?: string }> {
    await mongooseConnect();

    try {
      // Verify OTP first
      const otpValid = await this.verifyOTP(phone, otp);
      if (!otpValid) {
        return { success: false, error: "Invalid or expired OTP" };
      }

      // Check if user already exists
      const existingUser = await User.findOne({ phone });
      if (existingUser) {
        return {
          success: false,
          error: "User already exists. Please login instead.",
        };
      }

      // Create new user
      const userData = {
        phone,
        phoneVerified: new Date(),
        provider: "phone",
        providerId: phone,
        ...additionalData,
        role: "USER",
        profileCompleted: this.isProfileComplete({ phone, ...additionalData }),
      };

      const newUser = await User.create(userData);
      return { success: true, user: newUser };
    } catch (error: any) {
      console.error("Phone verification error:", error);
      return { success: false, error: error.message };
    }
  }

  static async handleGoogleAuth(profile: any) {
    await mongooseConnect();

    try {
      const userData = {
        email: profile.email,
        name: profile.name,
        image: profile.picture,
        emailVerified: new Date(),
        provider: "google",
        providerId: profile.sub || profile.id,
        profileCompleted: this.isProfileComplete({
          email: profile.email,
          name: profile.name,
        }),
      };

      return await this.createOrUpdateUser(userData);
    } catch (error: any) {
      console.error("Google auth error:", error);
      return { success: false, error: error.message };
    }
  }

  static async updateUserProfile(userId: string, profileData: any) {
    await mongooseConnect();

    try {
      const updatedData = {
        ...profileData,
        profileCompleted: this.isProfileComplete(profileData),
      };

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updatedData },
        { new: true, runValidators: true }
      );

      if (!user) {
        return { success: false, error: "User not found" };
      }

      return { success: true, user };
    } catch (error: any) {
      console.error("Profile update error:", error);
      return { success: false, error: error.message };
    }
  }

  public static isProfileComplete(userData: any): boolean {
    return !!(
      userData.name &&
      (userData.email || userData.phone) &&
      userData.pincode &&
      userData.gender
    );
  }
  static async verifyOTP(phone: string, otp: string): Promise<boolean> {
    await mongooseConnect();
    const otpEntry = await OtpVerification.verifyOTP(phone, otp);
    return !!otpEntry;
  }

  static async getUserByPhone(
    phone: string
  ): Promise<{ user: any; error: string | null }> {
    await mongooseConnect();
    try {
      const user = await User.findOne({ phone });
      if (!user) {
        return { user: null, error: "No account found with this phone number" };
      }
      return { user, error: null };
    } catch (error: any) {
      console.error("Error finding user by phone:", error);
      return { user: null, error: error.message };
    }
  }
}
