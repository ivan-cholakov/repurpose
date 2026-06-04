#!/usr/bin/env node
// Preflight: verifies your environment is correctly wired before you launch.
// Usage:
//   node --env-file=.env scripts/preflight.mjs          # presence + format checks
//   node --env-file=.env scripts/preflight.mjs --live   # also pings Anthropic + Stripe

const live = process.argv.includes("--live");
let failures = 0;
let warnings = 0;

const ok = (m) => console.log(`  \x1b[32m[OK]\x1b[0m ${m}`);
const bad = (m) => {
  console.log(`  \x1b[31m[FAIL]\x1b[0m ${m}`);
  failures++;
};
const warn = (m) => {
  console.log(`  \x1b[33m[WARN]\x1b[0m ${m}`);
  warnings++;
};

function check(name, { required = true, pattern = null, note = "" } = {}) {
  const v = process.env[name];
  if (!v) {
    if (required) bad(`${name} is missing${note ? ` — ${note}` : ""}`);
    else warn(`${name} not set${note ? ` — ${note}` : ""}`);
    return null;
  }
  if (pattern && !pattern.test(v)) {
    warn(`${name} is set but doesn't look right (expected ${pattern})`);
    return v;
  }
  ok(`${name} set`);
  return v;
}

console.log("\nRepurpose preflight\n-------------------");

console.log("\nCore:");
const authSecret = check("AUTH_SECRET");
if (authSecret && authSecret.length < 24)
  warn("AUTH_SECRET is short — use `openssl rand -base64 32`");
check("DATABASE_URL");
check("NEXT_PUBLIC_APP_URL");

console.log("\nClaude (generation):");
const anthropicKey = check("ANTHROPIC_API_KEY", { pattern: /^sk-ant-/ });

console.log("\nStripe (billing — the 'money in' path):");
const stripeKey = check("STRIPE_SECRET_KEY", { pattern: /^sk_(test|live)_/ });
check("STRIPE_PRICE_ID", { pattern: /^price_/ });
check("STRIPE_WEBHOOK_SECRET", {
  required: false,
  pattern: /^whsec_/,
  note: "needed for subscriptions to activate",
});
if (stripeKey?.startsWith("sk_test_"))
  warn("Using Stripe TEST keys — switch to live keys to take real money.");

if (live) {
  console.log("\nLive checks:");
  if (anthropicKey) {
    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic({ apiKey: anthropicKey });
      await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 8,
        messages: [{ role: "user", content: "Say OK" }],
      });
      ok("Anthropic API key works");
    } catch (e) {
      bad(`Anthropic call failed: ${e?.message ?? e}`);
    }
  }
  if (stripeKey) {
    try {
      const { default: Stripe } = await import("stripe");
      const stripe = new Stripe(stripeKey);
      const acct = await stripe.accounts.retrieve();
      if (acct?.payouts_enabled) ok(`Stripe key works — payouts enabled (${acct.id})`);
      else
        warn(
          `Stripe key works (${acct.id}) but payouts are NOT enabled — connect your bank in Stripe.`,
        );
      if (process.env.STRIPE_PRICE_ID) {
        try {
          await stripe.prices.retrieve(process.env.STRIPE_PRICE_ID);
          ok("Stripe Price ID is valid");
        } catch {
          bad("STRIPE_PRICE_ID not found in this Stripe account");
        }
      }
    } catch (e) {
      bad(`Stripe call failed: ${e?.message ?? e}`);
    }
  }
}

console.log("\n-------------------");
if (failures > 0) {
  console.log(
    `\x1b[31m${failures} blocker(s)\x1b[0m, ${warnings} warning(s). Fix blockers before launching.`,
  );
  process.exit(1);
} else {
  console.log(
    `\x1b[32mNo blockers.\x1b[0m ${warnings} warning(s).` +
      (live ? "" : " Re-run with --live to verify keys actually work."),
  );
}
