# Repurpose 💸

A complete, deployable **micro-SaaS**: paste long-form content → get a polished X thread,
LinkedIn post, newsletter blurb, and TL;DR, powered by Claude. Free tier + **Stripe Pro
subscription** for recurring revenue.

This repo is built so that the only thing standing between it and money in your account is
**your API keys and a deploy**. Everything else — auth, metering, the AI feature, Stripe
checkout + webhook + the customer portal — is done and tested.

---

## What's in the box

| Piece | Status |
|---|---|
| Email/password auth (bcrypt + signed JWT cookie sessions) | ✅ |
| Dashboard with the repurposing tool | ✅ |
| Claude-powered generation (4 formats, concurrent) | ✅ |
| Monthly usage metering with auto-reset | ✅ |
| Free vs Pro plan gating (limits + input length) | ✅ |
| Stripe Checkout (subscription) | ✅ |
| Stripe customer portal (manage/cancel) | ✅ |
| Stripe webhook → flips users to Pro on payment | ✅ |
| Marketing landing page + pricing | ✅ |

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · Prisma 6 ·
SQLite (dev) / Postgres (prod) · Stripe · Anthropic SDK.

---

## Run it locally (2 minutes)

```bash
cp .env.example .env          # then fill in AUTH_SECRET + ANTHROPIC_API_KEY (see below)
npm install
npm run db:push               # creates the SQLite database
npm run dev                   # http://localhost:3000
```

Minimum to see the product working locally:
- `AUTH_SECRET` — run `openssl rand -base64 32` and paste the result.
- `ANTHROPIC_API_KEY` — from https://console.anthropic.com (this powers generation).

You can sign up, log in, and repurpose content with just those two. Stripe is only needed
to take payments (next section).

---

## 💰 Going live (the "money in" checklist)

This is the part only you can do — it connects **your** Stripe account so payouts land in
**your** bank.

### 1. Anthropic
1. Create a key at https://console.anthropic.com → set `ANTHROPIC_API_KEY`.
2. Add a little credit. Each repurpose is a few cents of tokens — keep this below your price.

### 2. Stripe (this is where the money flows)
1. Create a Stripe account and **connect your bank account** for payouts
   (Stripe → Settings → Business → Bank accounts & currencies). *This is the literal
   "money comes to my bank account" step.*
2. Create a **Product** ("Repurpose Pro") with a **recurring Price** (e.g. $19/month).
   Copy the price ID (`price_...`) → set `STRIPE_PRICE_ID`.
3. Copy your secret key from https://dashboard.stripe.com/apikeys → set `STRIPE_SECRET_KEY`.
   (Use **test** keys first to rehearse, then swap to live keys.)
4. Enable the **Customer Portal**: https://dashboard.stripe.com/settings/billing/portal.
5. Create a **webhook** pointing at `https://YOUR_DOMAIN/api/stripe/webhook`, subscribing to:
   `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`.
   Copy the signing secret (`whsec_...`) → set `STRIPE_WEBHOOK_SECRET`.

To test the webhook locally, use the Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# use the whsec_... it prints as STRIPE_WEBHOOK_SECRET
```

### 3. Deploy (recommended: Vercel)

**One-click:** after pushing to GitHub, use this button (replace `YOUR_GH_USER/REPO`) — it
prompts for every required env var on import:

```
https://vercel.com/new/clone?repository-url=https://github.com/YOUR_GH_USER/REPO&env=DATABASE_URL,AUTH_SECRET,ANTHROPIC_API_KEY,STRIPE_SECRET_KEY,STRIPE_WEBHOOK_SECRET,STRIPE_PRICE_ID,NEXT_PUBLIC_APP_URL
```

Or manually:
1. Push this repo to GitHub.
2. Import it into Vercel.
3. Swap the database to Postgres for production: in `prisma/schema.prisma` change
   `provider = "sqlite"` → `provider = "postgresql"`, set `DATABASE_URL` to a Postgres
   connection string (Neon and Supabase have free tiers), then run `npx prisma db push`.
4. Add **all** env vars from `.env.example` in Vercel's project settings.
5. Set `NEXT_PUBLIC_APP_URL` to your real domain.
6. Deploy. `npm run build` runs `prisma generate` automatically.

Once live with real Stripe keys, a customer clicking **Upgrade to Pro** → paying →
Stripe pays out to your connected bank on its normal schedule.

---

## How to actually get to $1,000

The code is the easy part. Revenue needs customers. At **€19/mo**, €1,000 MRR ≈ **53
paying users** (or fewer at a higher price). See `LAUNCH.md` for copy-paste launch posts and
a 14-day plan. Fastest paths:

- **Pick a niche audience** and tailor the copy (e.g. "for indie founders", "for newsletter
  writers", "for B2B marketers"). Niche converts far better than generic.
- **Distribution:** post your own repurposed content (dogfood it), share in relevant
  communities, do a Product Hunt / Reddit / X launch.
- **Raise the price** if your audience is businesses — €29–€49/mo gets you to €1k with
  20–35 customers.
- **Add an annual plan** (create another Stripe Price) for upfront cash.

---

## Project map

```
src/
  app/
    page.tsx                     Landing page + pricing
    (auth)/login, signup         Auth pages (shared auth-form.tsx)
    dashboard/                   The product (server page + client UI)
    api/
      auth/{signup,login,logout} Session auth
      repurpose/                 Core feature + usage metering
      stripe/{checkout,portal,webhook}
  lib/
    auth.ts        Sessions (JWT cookie), password hashing
    prisma.ts      DB client
    plans.ts       Free/Pro limits
    stripe.ts      Stripe client (lazy)
    repurpose.ts   Claude prompts + generation
prisma/schema.prisma
```

## Notes & next steps
- Auth is email/password for zero external dependencies. Swap in OAuth/magic links later if you like.
- Usage resets ~30 days after each user's first use in a window; for strict calendar-month
  billing periods you can key off the Stripe subscription period instead.
- Consider adding rate limiting and an abuse cap before a public launch.
- The Pro price shown on the landing page (€19) is hard-coded in `src/app/page.tsx`; keep it
  in sync with your actual Stripe Price.
