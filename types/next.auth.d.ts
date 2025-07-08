// types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      phone?: string;
      role?: string;
      profileCompleted?: boolean;
      // Add any other custom fields you need
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    phone?: string;
    role?: string;
    profileCompleted?: boolean;
    pincode?: string;
    gender?: string;
    phoneVerified?: Date;
    emailVerified?: Date;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    phone?: string;
    role?: string;
    profileCompleted?: boolean;
  }
}