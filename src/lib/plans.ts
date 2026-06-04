// Plan limits. Free users get a small monthly allowance; Pro is the paid tier.
export const PLANS = {
  free: {
    name: "Free",
    monthlyLimit: 5,
    maxInputChars: 6000,
  },
  pro: {
    name: "Pro",
    monthlyLimit: 500,
    maxInputChars: 50000,
  },
} as const;

export type PlanId = keyof typeof PLANS;

export function planFor(id: string | null | undefined): (typeof PLANS)[PlanId] {
  return id === "pro" ? PLANS.pro : PLANS.free;
}

// True if the user's metered usage window has rolled past a calendar month.
export function isUsageWindowExpired(periodStart: Date): boolean {
  const now = new Date();
  const diffDays = (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 30;
}
