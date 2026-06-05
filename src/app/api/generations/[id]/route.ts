import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { generations } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = await ctx.params;
  // Scoped to the current user, so one user can never delete another's rows.
  const deleted = await db
    .delete(generations)
    .where(and(eq(generations.id, id), eq(generations.userId, user.id)))
    .returning({ id: generations.id });

  if (deleted.length === 0) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
