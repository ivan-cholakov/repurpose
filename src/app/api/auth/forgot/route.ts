import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/mail";
import { createToken } from "@/lib/tokens";
import { forgotPasswordSchema, parseJson } from "@/lib/validation";

const TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: Request) {
  const parsed = await parseJson(req, forgotPasswordSchema);
  if (!parsed.ok) return NextResponse.json({ error: parsed.errors[0] }, { status: 400 });

  const rows = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  const user = rows[0];

  // Same response whether or not the account exists, to avoid email enumeration.
  if (!user) return NextResponse.json({ ok: true });

  const raw = await createToken(user.id, "password_reset", TTL_MS);
  const link = `${env.NEXT_PUBLIC_APP_URL}/reset-password?token=${raw}`;

  const { delivered } = await sendEmail({
    to: user.email,
    subject: "Reset your Repurpose password",
    text: `Someone (hopefully you) asked to reset the password for this account.\n\nReset it here (link valid for 1 hour):\n${link}\n\nIf this wasn't you, ignore this email.`,
  });

  // Local dev without a mail provider: hand the link back so the flow is usable.
  if (!delivered && process.env.NODE_ENV !== "production") {
    return NextResponse.json({ ok: true, devLink: link });
  }
  return NextResponse.json({ ok: true });
}
