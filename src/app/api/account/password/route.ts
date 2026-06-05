import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { changePasswordSchema, parseJson } from "@/lib/validation";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const parsed = await parseJson(req, changePasswordSchema);
  if (!parsed.ok) return NextResponse.json({ error: parsed.errors[0] }, { status: 400 });
  const { currentPassword, newPassword } = parsed.data;

  if (!user.passwordHash || !(await verifyPassword(currentPassword, user.passwordHash))) {
    return NextResponse.json({ error: "Incorrect current password." }, { status: 403 });
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(newPassword) })
    .where(eq(users.id, user.id));
  return NextResponse.json({ ok: true });
}
