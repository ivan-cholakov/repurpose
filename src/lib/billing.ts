import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { teams, type User, users } from "@/db/schema";

/**
 * The account whose plan and usage apply to this user: the team owner when the
 * user belongs to a team, otherwise the user themself.
 */
export async function resolveBillingUser(user: User): Promise<User> {
  if (!user.teamId) return user;

  const rows = await db
    .select({ ownerId: teams.ownerId })
    .from(teams)
    .where(eq(teams.id, user.teamId))
    .limit(1);
  const ownerId = rows[0]?.ownerId;
  if (!ownerId || ownerId === user.id) return user;

  const owner = await db.select().from(users).where(eq(users.id, ownerId)).limit(1);
  return owner[0] ?? user;
}
