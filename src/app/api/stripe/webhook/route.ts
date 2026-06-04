import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/db";
import { users } from "@/db/schema";
import { env } from "@/lib/env";
import { getStripe } from "@/lib/stripe";

// Stripe needs the raw request body to verify the signature.
export async function POST(req: Request) {
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  const stripe = getStripe();
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature.";
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  // Map a Stripe subscription state onto our user record.
  async function applySubscription(sub: Stripe.Subscription) {
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const active = sub.status === "active" || sub.status === "trialing";
    await db
      .update(users)
      .set({
        plan: active ? "pro" : "free",
        subscriptionStatus: sub.status,
        stripeSubscriptionId: sub.id,
      })
      .where(eq(users.stripeCustomerId, customerId));
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const subId =
          typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const sub = await stripe.subscriptions.retrieve(subId);
        await applySubscription(sub);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await applySubscription(event.data.object as Stripe.Subscription);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
