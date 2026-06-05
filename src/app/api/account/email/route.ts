import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser, verifyPassword } from "@/lib/auth";
import { changeEmailSchema, parseJson } from "@/lib/validation";
import { sendVerificationEmail } from "@/lib/verification";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const parsed = await parseJson(req, changeEmailSchema);
  if (!parsed.ok) return NextResponse.json({ error: parsed.errors[0] }, { status: 400 });
  const { newEmail, password } = parsed.data;

  if (!user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 403 });
  }
  if (newEmail === user.email) {
    return NextResponse.json({ error: "That is already your email." }, { status: 400 });
  }

  const taken = await db.select({ id: users.id }).from(users).where(eq(users.email, newEmail));
  if (taken.length > 0) {
    return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
  }

  // The new address is unverified until its emailed link is clicked.
  await db
    .update(users)
    .set({ email: newEmail, emailVerifiedAt: null })
    .where(eq(users.id, user.id));

  sendVerificationEmail(user.id, newEmail).catch((err) => {
    console.error("verification email failed:", err);
  });

  return NextResponse.json({ ok: true, email: newEmail });
}
