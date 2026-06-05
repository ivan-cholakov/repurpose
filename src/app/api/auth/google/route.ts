import { NextResponse } from "next/server";
import { buildAuthUrl, googleConfigured } from "@/lib/google-oauth";

const STATE_COOKIE = "google_oauth_state";

// Kick off the Google sign-in flow.
export async function GET() {
  if (!googleConfigured()) {
    return NextResponse.json({ error: "Google sign-in is not configured." }, { status: 503 });
  }

  const state = crypto.randomUUID();
  const res = NextResponse.redirect(buildAuthUrl(state));
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60, // long enough to pick an account
  });
  return res;
}
