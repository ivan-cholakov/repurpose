import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { generations, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { mailConfigured } from "@/lib/mail";
import { isUsageWindowExpired, planFor } from "@/lib/plans";
import { type RepurposeStreamEvent, repurpose, repurposeStreaming } from "@/lib/repurpose";
import { parseJson, repurposeSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // Only enforce verification when emails can actually be delivered.
  if (mailConfigured() && !user.emailVerifiedAt) {
    return NextResponse.json(
      { error: "Please verify your email before repurposing. Check your inbox for the link." },
      { status: 403 },
    );
  }

  const parsed = await parseJson(req, repurposeSchema);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.errors[0] }, { status: 400 });
  }
  const { source, formats, stream } = parsed.data;

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

  // Count one repurpose per request (regardless of how many formats).
  // (TS can't narrow `user` inside a closure, so capture the id here.)
  const userId = user.id;
  async function persist(results: Awaited<ReturnType<typeof repurpose>>) {
    await db.batch([
      db
        .update(users)
        .set({ usageCount: sql`${users.usageCount} + 1` })
        .where(eq(users.id, userId)),
      db.insert(generations).values({
        userId,
        formats: formats.join(","),
        sourceLen: source.length,
        source,
        results: JSON.stringify(results),
      }),
    ]);
  }

  const usage = { used: usageCount + 1, limit: plan.monthlyLimit };

  // Streaming path: NDJSON progress events while all formats generate.
  if (stream) {
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      async start(controller) {
        const emit = (event: RepurposeStreamEvent) =>
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        try {
          const results = await repurposeStreaming(source, formats, user.voiceNotes, emit);
          await persist(results);
          emit({ type: "complete", usage });
        } catch (err) {
          emit({ type: "error", error: err instanceof Error ? err.message : "Generation failed." });
        } finally {
          controller.close();
        }
      },
    });
    return new Response(body, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  }

  let results: Awaited<ReturnType<typeof repurpose>>;
  try {
    results = await repurpose(source, formats, user.voiceNotes);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  await persist(results);
  return NextResponse.json({ results, usage });
}
