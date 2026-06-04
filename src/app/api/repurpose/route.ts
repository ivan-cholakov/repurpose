import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { generations, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isUsageWindowExpired, planFor } from "@/lib/plans";
import { repurpose } from "@/lib/repurpose";
import { parseJson, repurposeSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const parsed = await parseJson(req, repurposeSchema);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.errors[0] }, { status: 400 });
  }
  const { source, formats } = parsed.data;

  const plan = planFor(user.plan);

  if (source.length > plan.maxInputChars) {
    return NextResponse.json(
      {
        error: `Input is too long for the ${plan.name} plan (${source.length} / ${plan.maxInputChars} chars). Upgrade for longer inputs.`,
      },
      { status: 413 },
    );
  }

  // Reset the metering window if a month has elapsed.
  let usageCount = user.usageCount;
  if (isUsageWindowExpired(user.usagePeriodStart)) {
    usageCount = 0;
    await db
      .update(users)
      .set({ usageCount: 0, usagePeriodStart: new Date() })
      .where(eq(users.id, user.id));
  }

  if (usageCount >= plan.monthlyLimit) {
    return NextResponse.json(
      {
        error: `You've hit your ${plan.name} limit of ${plan.monthlyLimit} repurposes this month.`,
        limitReached: true,
      },
      { status: 402 },
    );
  }

  let results: Awaited<ReturnType<typeof repurpose>>;
  try {
    results = await repurpose(source, formats);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Count one repurpose per request (regardless of how many formats).
  await db.batch([
    db
      .update(users)
      .set({ usageCount: sql`${users.usageCount} + 1` })
      .where(eq(users.id, user.id)),
    db.insert(generations).values({
      userId: user.id,
      formats: formats.join(","),
      sourceLen: source.length,
    }),
  ]);

  return NextResponse.json({
    results,
    usage: { used: usageCount + 1, limit: plan.monthlyLimit },
  });
}
