// auth.ts
import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import client from "@/lib/dbConnect"; // your MongoDB client

const nextAuth = NextAuth({
  adapter: MongoDBAdapter(client.promise), // ✅ use the promise
  session: { strategy: "jwt" },
  ...authConfig,
});

export const { handlers, auth, signIn, signOut } = nextAuth;
