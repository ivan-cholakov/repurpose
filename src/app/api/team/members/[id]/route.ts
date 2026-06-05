import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { teams, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

// Owner removes a member from the team.
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!user.teamId) return NextResponse.json({ error: "You are not in a team." }, { status: 400 });

  const team = await db.select().from(teams).where(eq(teams.id, user.teamId)).limit(1);
  if (!team[0] || team[0].ownerId !== user.id) {
    return NextResponse.json({ error: "Only the team owner can remove members." }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (id === user.id) {
    return NextResponse.json({ error: "Use delete team to remove yourself." }, { status: 400 });
  }

  const updated = await db
    .update(users)
    .set({ teamId: null })
    .where(and(eq(users.id, id), eq(users.teamId, user.teamId)))
    .returning({ id: users.id });
  if (updated.length === 0) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
