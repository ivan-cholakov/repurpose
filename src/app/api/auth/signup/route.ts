import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, hashPassword } from "@/lib/auth";
import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";
import { parseJson, signupSchema } from "@/lib/validation";
import { sendVerificationEmail } from "@/lib/verification";

export async function POST(req: Request) {
  if (!rateLimit(`signup:${clientIp(req)}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json(tooMany, { status: 429 });
  }

  const parsed = await parseJson(req, signupSchema);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.errors[0] }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing.length > 0) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 },
    );
  }

  const inserted = await db
    .insert(users)
    .values({ email, passwordHash: await hashPassword(password) })
    .returning({ id: users.id });

  await createSession(inserted[0].id);

  // Fire-and-forget; signup must not fail because the mail provider is down.
  sendVerificationEmail(inserted[0].id, email).catch((err) => {
    console.error("verification email failed:", err);
  });

  return NextResponse.json({ ok: true });
}
