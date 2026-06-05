import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { teams, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!user.teamId) return NextResponse.json({ error: "You are not in a team." }, { status: 400 });

  const team = await db.select().from(teams).where(eq(teams.id, user.teamId)).limit(1);
  if (team[0]?.ownerId === user.id) {
    return NextResponse.json(
      { error: "Owners can't leave their own team — delete it instead." },
      { status: 400 },
    );
  }

  await db.update(users).set({ teamId: null }).where(eq(users.id, user.id));
  return NextResponse.json({ ok: true });
}
