import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getStripe, stripeConfigured } from "@/lib/stripe";

export async function POST() {
  if (!stripeConfigured()) {
    return NextResponse.json({ error: "Billing is not configured yet." }, { status: 503 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Reuse or create a Stripe customer for this user.
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: `${appUrl}/dashboard?upgraded=1`,
    cancel_url: `${appUrl}/dashboard`,
    allow_promotion_codes: true,
    metadata: { userId: user.id },
  });

  return NextResponse.json({ url: session.url });
}
