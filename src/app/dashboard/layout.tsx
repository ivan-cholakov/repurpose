import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { planFor } from "@/lib/plans";
import DashboardNav from "./nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="flex-1">
      <DashboardNav email={user.email} planName={planFor(user.plan).name} />
      {children}
    </main>
  );
}
