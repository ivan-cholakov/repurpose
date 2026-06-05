import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { teams, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { planFor } from "@/lib/plans";
import SettingsClient, { type TeamInfo } from "./settings-client";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let team: TeamInfo | null = null;
  if (user.teamId) {
    const rows = await db.select().from(teams).where(eq(teams.id, user.teamId)).limit(1);
    const t = rows[0];
    if (t) {
      const isOwner = t.ownerId === user.id;
      const members = isOwner
        ? await db
            .select({ id: users.id, email: users.email })
            .from(users)
            .where(eq(users.teamId, t.id))
        : [];
      team = {
        name: t.name,
        role: isOwner ? "owner" : "member",
        inviteCode: isOwner ? t.inviteCode : null,
        members: members.filter((m) => m.id !== user.id),
      };
    }
  }

  return (
    <SettingsClient
      email={user.email}
      planName={planFor(user.plan).name}
      hasPassword={Boolean(user.passwordHash)}
      voiceNotes={user.voiceNotes ?? ""}
      team={team}
    />
  );
}
