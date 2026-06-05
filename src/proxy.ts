import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "repurpose_session";
const AB_COOKIE = "ab_landing";
const AB_MAX_AGE = 60 * 60 * 24 * 365;

// Pages that only make sense logged out. Verifying the session JWT here (no
// database hit) lets these pages skip the per-request user lookup they used to
// do just to bounce authenticated visitors to the dashboard.
const LOGGED_OUT_ONLY = new Set(["/", "/login", "/signup", "/forgot-password"]);

async function sessionIsValid(req: NextRequest): Promise<"valid" | "invalid" | "none"> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return "none";
  const secret = process.env.AUTH_SECRET;
  if (!secret) return "none";
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return "valid";
  } catch {
    return "invalid";
  }
}

export async function proxy(req: NextRequest) {
  const session = await sessionIsValid(req);

  if (session === "valid" && LOGGED_OUT_ONLY.has(req.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // A/B test: split anonymous landing traffic between the two designs. Both
  // variants are statically prerendered; the rewrite happens at the edge and
  // the sticky cookie also attributes signups (see /api/auth/signup).
  let res: NextResponse;
  if (req.nextUrl.pathname === "/") {
    let variant = req.cookies.get(AB_COOKIE)?.value;
    const needsAssignment = variant !== "a" && variant !== "b";
    if (needsAssignment) variant = Math.random() < 0.5 ? "a" : "b";
    res = NextResponse.rewrite(new URL(`/variant-${variant}`, req.url));
    if (needsAssignment) {
      res.cookies.set(AB_COOKIE, variant as string, {
        maxAge: AB_MAX_AGE,
        path: "/",
        sameSite: "lax",
      });
    }
  } else {
    res = NextResponse.next();
  }

  // Stale or forged session cookie: drop it so it can't cause redirect loops.
  if (session === "invalid") res.cookies.delete(COOKIE_NAME);
  return res;
}

export const config = {
  matcher: ["/", "/login", "/signup", "/forgot-password"],
};
