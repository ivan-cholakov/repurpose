import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { annualConfigured, getStripe, priceFor, stripeConfigured } from "@/lib/stripe";

export async function POST(req: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json({ error: "Billing is not configured yet." }, { status: 503 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  // Body is optional; older clients send none and get monthly billing.
  let interval: "month" | "year" = "month";
  const raw = await req.text();
  if (raw) {
    try {
      const body = JSON.parse(raw);
      if (body?.interval === "year") interval = "year";
    } catch {
      // Malformed body — fall through to monthly rather than failing checkout.
    }
  }
  if (interval === "year" && !annualConfigured()) {
    return NextResponse.json({ error: "Annual billing is not configured." }, { status: 400 });
  }

  const stripe = getStripe();
  const appUrl = env.NEXT_PUBLIC_APP_URL;

  // Reuse or create a Stripe customer for this user.
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, user.id));
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceFor(interval), quantity: 1 }],
    success_url: `${appUrl}/dashboard?upgraded=1`,
    cancel_url: `${appUrl}/dashboard`,
    allow_promotion_codes: true,
    metadata: { userId: user.id },
  });

  return NextResponse.json({ url: session.url });
}
