import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { teams, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { parseJson, teamJoinSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.teamId) {
    return NextResponse.json({ error: "You are already in a team." }, { status: 409 });
  }

  const parsed = await parseJson(req, teamJoinSchema);
  if (!parsed.ok) return NextResponse.json({ error: parsed.errors[0] }, { status: 400 });

  const team = await db
    .select({ id: teams.id, name: teams.name })
    .from(teams)
    .where(eq(teams.inviteCode, parsed.data.code))
    .limit(1);
  if (!team[0]) {
    return NextResponse.json({ error: "That invite code is not valid." }, { status: 404 });
  }

  await db.update(users).set({ teamId: team[0].id }).where(eq(users.id, user.id));
  return NextResponse.json({ ok: true, name: team[0].name });
}
