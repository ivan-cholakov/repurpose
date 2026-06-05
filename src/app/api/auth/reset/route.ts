import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { consumeToken } from "@/lib/tokens";
import { parseJson, resetPasswordSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const parsed = await parseJson(req, resetPasswordSchema);
  if (!parsed.ok) return NextResponse.json({ error: parsed.errors[0] }, { status: 400 });

  const userId = await consumeToken(parsed.data.token, "password_reset");
  if (!userId) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Request a new one." },
      { status: 400 },
    );
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(parsed.data.password) })
    .where(eq(users.id, userId));

  return NextResponse.json({ ok: true });
}
