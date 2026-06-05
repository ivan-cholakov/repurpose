import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { resolveBillingUser } from "@/lib/billing";
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

  // Team members draw on the owner's plan and usage pool.
  const billing = await resolveBillingUser(user);
  const plan = planFor(billing.plan);
  const used = isUsageWindowExpired(billing.usagePeriodStart) ? 0 : billing.usageCount;

  return (
    <DashboardClient
      planId={billing.plan === "pro" ? "pro" : "free"}
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
