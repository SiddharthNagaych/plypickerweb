// auth.config.ts
import { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { UserService } from "@/lib/userService";

const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      async profile(profile) {
        const { error, user } = await UserService.handleGoogleAuth(profile);
        if (error) throw new Error(error);
        
        const profileCompleted = UserService.isProfileComplete({
          name: user.name,
          email: user.email,
          phone: user.phone,
          pincode: user.pincode,
          gender: user.gender
        });
        
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
          phone: user.phone,
          role: user.role,
          profileCompleted
        };
      }
    }),

    Credentials({
      id: "phone-login",
      name: "Phone Login",
      credentials: {
        phone: { label: "Phone", type: "text" },
        otp: { label: "OTP", type: "text" }
      },
      async authorize(credentials) {
        const { phone, otp } = credentials as { phone: string; otp: string };
        
        // 1. First verify OTP is valid using UserService
        const otpValid = await UserService.verifyOTP(phone, otp);
        if (!otpValid) {
          throw new Error("Invalid or expired OTP");
        }
        
        // 2. Check if user exists using UserService
        const { user: existingUser, error: userError } = await UserService.getUserByPhone(phone);
        if (userError || !existingUser) {
          throw new Error("No account found with this phone number. Please sign up first.");
        }
        
        // 3. Update phone verification status
        const updateResult = await UserService.updateUserProfile(existingUser._id.toString(), {
          phoneVerified: new Date()
        });
        
        if (!updateResult.success) {
          throw new Error("Failed to update user verification status");
        }
        
        const profileCompleted = UserService.isProfileComplete({
          name: existingUser.name,
          phone: existingUser.phone,
          pincode: existingUser.pincode,
          gender: existingUser.gender
        });
        
        return {
          id: existingUser._id.toString(),
          phone: existingUser.phone,
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role,
          profileCompleted
        };
      }
    })
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.phone = user.phone;
        token.role = user.role;
        token.profileCompleted = user.profileCompleted;
        if (user.email) token.email = user.email;
        if (user.name) token.name = user.name;
      }
      
      if (trigger === "update" && session?.user) {
        token.profileCompleted = session.user.profileCompleted;
      }
      
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.phone = token.phone;
        session.user.role = token.role;
        session.user.profileCompleted = token.profileCompleted;
        if (token.email) session.user.email = token.email;
        if (token.name) session.user.name = token.name;
      }
      return session;
    }
  }
};

export default authConfig;