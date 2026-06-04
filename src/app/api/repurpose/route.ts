import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { planFor, isUsageWindowExpired } from "@/lib/plans";
import { repurpose, isValidFormat, type FormatId } from "@/lib/repurpose";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const source: unknown = body.source;
  const formatsRaw: unknown = body.formats;

  if (typeof source !== "string" || source.trim().length < 50) {
    return NextResponse.json(
      { error: "Please paste at least 50 characters of source content." },
      { status: 400 }
    );
  }
  if (!Array.isArray(formatsRaw) || formatsRaw.length === 0) {
    return NextResponse.json({ error: "Select at least one output format." }, { status: 400 });
  }
  const formats = formatsRaw.filter((f): f is FormatId => typeof f === "string" && isValidFormat(f));
  if (formats.length === 0) {
    return NextResponse.json({ error: "No valid formats selected." }, { status: 400 });
  }

  const plan = planFor(user.plan);

  if (source.length > plan.maxInputChars) {
    return NextResponse.json(
      {
        error: `Input is too long for the ${plan.name} plan (${source.length} / ${plan.maxInputChars} chars). Upgrade for longer inputs.`,
      },
      { status: 413 }
    );
  }

  // Reset the metering window if a month has elapsed.
  let usageCount = user.usageCount;
  if (isUsageWindowExpired(user.usagePeriodStart)) {
    usageCount = 0;
    await prisma.user.update({
      where: { id: user.id },
      data: { usageCount: 0, usagePeriodStart: new Date() },
    });
  }

  if (usageCount >= plan.monthlyLimit) {
    return NextResponse.json(
      {
        error: `You've hit your ${plan.name} limit of ${plan.monthlyLimit} repurposes this month.`,
        limitReached: true,
      },
      { status: 402 }
    );
  }

  let results;
  try {
    results = await repurpose(source, formats);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Count one repurpose per request (regardless of how many formats).
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { usageCount: { increment: 1 } },
    }),
    prisma.generation.create({
      data: { userId: user.id, formats: formats.join(","), sourceLen: source.length },
    }),
  ]);

  return NextResponse.json({
    results,
    usage: { used: usageCount + 1, limit: plan.monthlyLimit },
  });
}
