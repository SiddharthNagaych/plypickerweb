// lib/getLoggedInUser.ts
import { cookies, headers } from "next/headers";
import { auth } from "../../auth";
import jwt from "jsonwebtoken";

/**
 * Try JWT (mobile) first, then NextAuth session (web).
 * Pass `req` if you already have it – otherwise it uses
 * next/headers() & cookies() which are scoped per‑request.
 */
export async function getLoggedInUser(req?: { headers: Headers }) {
  /* ---- 1. JWT sent by the mobile app ---- */
  let authHeader = "";
  
  if (req) {
    // If request object is provided, use its headers directly
    authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  } else {
    // Otherwise, await the headers() promise from next/headers
    const hdr = await headers();
    authHeader = hdr.get("authorization") || hdr.get("Authorization") || "";
  }

  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);

    try {
      const payload = jwt.verify(token, process.env.AUTH_SECRET!) as {
        id: string;
      };
      return payload.id; // ✅ mobile user-id
    } catch {
      throw new Error("UNAUTH"); // token invalid / expired
    }
  }

  /* ---- 2. Browser – NextAuth cookie ---- */
  const session = await auth();

  if (session?.user?.id) return session.user.id;

  throw new Error("UNAUTH"); // neither header nor session found
}