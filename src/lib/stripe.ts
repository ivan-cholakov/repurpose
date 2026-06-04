import Stripe from "stripe";

let _stripe: Stripe | null = null;

// Lazily constructed so the app can build/run without keys until you go live.
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  // Omit apiVersion to use the account default pinned in your Stripe dashboard.
  _stripe = new Stripe(key);
  return _stripe;
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}
