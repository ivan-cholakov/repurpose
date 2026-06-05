import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { parseJson, voiceNotesSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const parsed = await parseJson(req, voiceNotesSchema);
  if (!parsed.ok) return NextResponse.json({ error: parsed.errors[0] }, { status: 400 });

  const voiceNotes = parsed.data.voiceNotes || null;
  await db.update(users).set({ voiceNotes }).where(eq(users.id, user.id));
  return NextResponse.json({ ok: true });
}
