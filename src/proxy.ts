import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "repurpose_session";

// Pages that only make sense logged out. Verifying the session JWT here (no
// database hit) lets these pages skip the per-request user lookup they used to
// do just to bounce authenticated visitors to the dashboard.
const LOGGED_OUT_ONLY = new Set(["/", "/login", "/signup", "/forgot-password"]);

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.next();

  const secret = process.env.AUTH_SECRET;
  if (!secret) return NextResponse.next();

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
  } catch {
    // Stale or forged cookie: drop it so it can't cause redirect loops.
    const res = NextResponse.next();
    res.cookies.delete(COOKIE_NAME);
    return res;
  }

  if (LOGGED_OUT_ONLY.has(req.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/signup", "/forgot-password"],
};
