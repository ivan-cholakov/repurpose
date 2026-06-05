import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser, verifyPassword } from "@/lib/auth";
import { changeEmailSchema, parseJson } from "@/lib/validation";

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

  await db.update(users).set({ email: newEmail }).where(eq(users.id, user.id));
  return NextResponse.json({ ok: true, email: newEmail });
}
