import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { planFor } from "@/lib/plans";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <SettingsClient
      email={user.email}
      planName={planFor(user.plan).name}
      hasPassword={Boolean(user.passwordHash)}
    />
  );
}
