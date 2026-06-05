import { countDistinct, gte, isNotNull, sql } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { generations, users } from "@/db/schema";
import { isAdminEmail } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  // 404 (not 403) so the page's existence isn't revealed to non-admins.
  if (!user || !isAdminEmail(user.email)) notFound();

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totals] = await db
    .select({
      signups: sql<number>`count(*)`,
      verified: sql<number>`sum(case when ${isNotNull(users.emailVerifiedAt)} then 1 else 0 end)`,
      paid: sql<number>`sum(case when ${users.plan} = 'pro' then 1 else 0 end)`,
      signups7d: sql<number>`sum(case when ${gte(users.createdAt, weekAgo)} then 1 else 0 end)`,
    })
    .from(users);

  const [gen] = await db
    .select({
      total: sql<number>`count(*)`,
      activatedUsers: countDistinct(generations.userId),
      last7d: sql<number>`sum(case when ${gte(generations.createdAt, weekAgo)} then 1 else 0 end)`,
    })
    .from(generations);

  const signups = totals.signups ?? 0;
  const activated = gen.activatedUsers ?? 0;
  const paid = totals.paid ?? 0;
  const pct = (n: number, of: number) => (of > 0 ? `${((n / of) * 100).toFixed(1)}%` : "—");

  const funnel = [
    { label: "Signups", value: signups, rate: null as string | null },
    { label: "Activated (≥1 repurpose)", value: activated, rate: pct(activated, signups) },
    { label: "Paid (Pro)", value: paid, rate: pct(paid, signups) },
  ];

  const stats = [
    { label: "Verified emails", value: totals.verified ?? 0 },
    { label: "Signups, last 7 days", value: totals.signups7d ?? 0 },
    { label: "Repurposes, all time", value: gen.total ?? 0 },
    { label: "Repurposes, last 7 days", value: gen.last7d ?? 0 },
  ];

  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Admin · Funnel</h1>
        <Link href="/dashboard" className="text-sm text-gray-500 underline">
          Back to dashboard
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-gray-500">Signups → activated → paid</h2>
        <div className="mt-3 space-y-2">
          {funnel.map((step) => (
            <div
              key={step.label}
              className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-800"
            >
              <span className="text-sm">{step.label}</span>
              <span className="flex items-baseline gap-3">
                <span className="text-lg font-semibold">{step.value}</span>
                {step.rate && <span className="text-xs text-gray-400">{step.rate} of signups</span>}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold">{s.value}</p>
          </div>
        ))}
      </section>

      <p className="mt-8 text-xs text-gray-400">
        Track one number: signups → activated → paid. Low activation? Fix onboarding. High
        activation, low paid? Revisit the free limit or price.
      </p>
    </main>
  );
}
