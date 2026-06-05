import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isUsageWindowExpired, planFor } from "@/lib/plans";
import { annualConfigured, stripeConfigured } from "@/lib/stripe";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const justUpgraded = sp.upgraded === "1";

  const plan = planFor(user.plan);
  const used = isUsageWindowExpired(user.usagePeriodStart) ? 0 : user.usageCount;

  return (
    <DashboardClient
      planId={user.plan === "pro" ? "pro" : "free"}
      used={used}
      limit={plan.monthlyLimit}
      maxInputChars={plan.maxInputChars}
      billingEnabled={stripeConfigured()}
      annualEnabled={annualConfigured()}
      hasCustomer={Boolean(user.stripeCustomerId)}
      justUpgraded={justUpgraded}
    />
  );
}
