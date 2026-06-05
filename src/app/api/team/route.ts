import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { teams, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { parseJson, teamNameSchema } from "@/lib/validation";

// Create a team owned by the current user.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.teamId) {
    return NextResponse.json({ error: "You are already in a team." }, { status: 409 });
  }

  const parsed = await parseJson(req, teamNameSchema);
  if (!parsed.ok) return NextResponse.json({ error: parsed.errors[0] }, { status: 400 });

  const inserted = await db
    .insert(teams)
    .values({ name: parsed.data.name, ownerId: user.id })
    .returning({ id: teams.id });
  await db.update(users).set({ teamId: inserted[0].id }).where(eq(users.id, user.id));

  return NextResponse.json({ ok: true });
}

// Owner deletes the team; members are detached via the FK's SET NULL.
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!user.teamId) return NextResponse.json({ error: "You are not in a team." }, { status: 400 });

  const team = await db.select().from(teams).where(eq(teams.id, user.teamId)).limit(1);
  if (!team[0] || team[0].ownerId !== user.id) {
    return NextResponse.json({ error: "Only the team owner can delete it." }, { status: 403 });
  }

  await db.delete(teams).where(eq(teams.id, user.teamId));
  return NextResponse.json({ ok: true });
}
