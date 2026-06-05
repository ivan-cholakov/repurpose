import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { env } from "@/lib/env";
import { consumeToken } from "@/lib/tokens";

// Landing point of the emailed verification link.
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const appUrl = env.NEXT_PUBLIC_APP_URL;

  const userId = token ? await consumeToken(token, "email_verify") : null;
  if (!userId) {
    return NextResponse.redirect(`${appUrl}/dashboard?verify_error=1`);
  }

  await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, userId));
  return NextResponse.redirect(`${appUrl}/dashboard?verified=1`);
}
