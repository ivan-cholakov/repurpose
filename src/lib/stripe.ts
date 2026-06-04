import Stripe from "stripe";
import { env, requireEnv } from "@/lib/env";

let _stripe: Stripe | null = null;

// Lazily constructed so the app can build/run without keys until you go live.
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  // Omit apiVersion to use the account default pinned in your Stripe dashboard.
  _stripe = new Stripe(requireEnv("STRIPE_SECRET_KEY"));
  return _stripe;
}

export function stripeConfigured(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PRICE_ID);
}
