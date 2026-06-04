import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, verifyPassword } from "@/lib/auth";
import { loginSchema, parseJson } from "@/lib/validation";

export async function POST(req: Request) {
  const parsed = await parseJson(req, loginSchema);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.errors[0] }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
