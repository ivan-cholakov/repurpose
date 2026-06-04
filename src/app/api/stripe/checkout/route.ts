import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { env, requireEnv } from "@/lib/env";
import { getStripe, stripeConfigured } from "@/lib/stripe";

export async function POST() {
  if (!stripeConfigured()) {
    return NextResponse.json({ error: "Billing is not configured yet." }, { status: 503 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

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
    line_items: [{ price: requireEnv("STRIPE_PRICE_ID"), quantity: 1 }],
    success_url: `${appUrl}/dashboard?upgraded=1`,
    cancel_url: `${appUrl}/dashboard`,
    allow_promotion_codes: true,
    metadata: { userId: user.id },
  });

  return NextResponse.json({ url: session.url });
}
