import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/auth";
import { env } from "@/lib/env";
import { exchangeCode, googleConfigured } from "@/lib/google-oauth";

const STATE_COOKIE = "google_oauth_state";

export async function GET(req: Request) {
  const appUrl = env.NEXT_PUBLIC_APP_URL;
  if (!googleConfigured()) {
    return NextResponse.redirect(`${appUrl}/login?oauth_error=1`);
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const jar = await cookies();
  const expectedState = jar.get(STATE_COOKIE)?.value;
  jar.delete(STATE_COOKIE);

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${appUrl}/login?oauth_error=1`);
  }

  let identity: Awaited<ReturnType<typeof exchangeCode>>;
  try {
    identity = await exchangeCode(code);
  } catch (err) {
    console.error("google oauth:", err);
    return NextResponse.redirect(`${appUrl}/login?oauth_error=1`);
  }

  // Match by Google ID first, then link by email, else create a new account.
  let userId: string;
  const byGoogle = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.googleId, identity.googleId))
    .limit(1);

  if (byGoogle[0]) {
    userId = byGoogle[0].id;
  } else {
    const byEmail = await db
      .select({ id: users.id, emailVerifiedAt: users.emailVerifiedAt })
      .from(users)
      .where(eq(users.email, identity.email))
      .limit(1);

    if (byEmail[0]) {
      userId = byEmail[0].id;
      await db
        .update(users)
        .set({
          googleId: identity.googleId,
          // Google vouching for the address verifies it for us too.
          ...(identity.emailVerified && !byEmail[0].emailVerifiedAt
            ? { emailVerifiedAt: new Date() }
            : {}),
        })
        .where(eq(users.id, userId));
    } else {
      const inserted = await db
        .insert(users)
        .values({
          email: identity.email,
          passwordHash: null,
          googleId: identity.googleId,
          emailVerifiedAt: identity.emailVerified ? new Date() : null,
        })
        .returning({ id: users.id });
      userId = inserted[0].id;
    }
  }

  await createSession(userId);
  return NextResponse.redirect(`${appUrl}/dashboard`);
}
