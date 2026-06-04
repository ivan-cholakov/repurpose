# Repurpose

Repurpose turns one piece of long-form content into many. Paste a blog post, transcript, or
draft and get a polished X/Twitter thread, LinkedIn post, newsletter blurb, and TL;DR in
seconds. It is a full-stack Next.js application with accounts, usage metering, and
subscription billing.

## Features

- Email and password authentication with signed, HTTP-only session cookies
- Content repurposing into four formats, each with a purpose-tuned prompt (powered by Claude)
- Per-account monthly usage metering with automatic rollover
- Free and Pro plans, with plan-based limits on volume and input length
- Subscription billing via Stripe Checkout, the customer portal, and webhooks
- Marketing landing page with pricing and a dynamic Open Graph image

## Tech stack

| Area        | Choice                                            |
| ----------- | ------------------------------------------------- |
| Framework   | Next.js 16 (App Router), React 19, TypeScript     |
| Styling     | Tailwind CSS 4                                     |
| Database    | SQLite via libSQL (local file or Turso in prod)   |
| ORM         | Drizzle ORM + Drizzle Kit migrations              |
| Validation  | Zod (request bodies and environment)              |
| Auth        | bcryptjs + jose (JWT) session cookies             |
| AI          | Anthropic SDK (Claude)                            |
| Payments    | Stripe                                            |
| Tooling     | pnpm, Biome, Husky, Playwright, GitHub Actions    |

## Getting started

Prerequisites: Node.js 20+ and pnpm (the repo pins a version via `packageManager`; Corepack
will use it automatically).

```bash
pnpm install
cp .env.example .env          # then set AUTH_SECRET and ANTHROPIC_API_KEY (see below)
pnpm db:migrate               # create the SQLite database from migrations
pnpm dev                      # http://localhost:3000
```

The minimum needed to run the app locally:

- `AUTH_SECRET` — a long random string. Generate one with `openssl rand -base64 32`.
- `ANTHROPIC_API_KEY` — from the Anthropic Console; required for content generation.

Stripe variables are only needed to enable billing.

## Environment variables

| Variable                | Required        | Description                                          |
| ----------------------- | --------------- | ---------------------------------------------------- |
| `DATABASE_URL`          | yes             | libSQL URL. `file:./dev.db` locally; Turso in prod.  |
| `DATABASE_AUTH_TOKEN`   | prod (Turso)    | Auth token for a remote libSQL/Turso database.       |
| `AUTH_SECRET`           | yes             | Secret used to sign session JWTs.                    |
| `ANTHROPIC_API_KEY`     | for generation  | Claude API key.                                      |
| `STRIPE_SECRET_KEY`     | for billing     | Stripe secret key.                                   |
| `STRIPE_WEBHOOK_SECRET` | for billing     | Signing secret for the Stripe webhook endpoint.      |
| `STRIPE_PRICE_ID`       | for billing     | Recurring Price ID for the Pro plan.                 |
| `NEXT_PUBLIC_APP_URL`   | yes             | Public base URL, used for Stripe redirect URLs.      |

Environment variables are validated at startup with Zod (`src/lib/env.ts`). Missing optional
secrets degrade the related feature gracefully rather than crashing the app.

## Scripts

| Script             | Description                                       |
| ------------------ | ------------------------------------------------- |
| `pnpm dev`         | Start the dev server.                             |
| `pnpm build`       | Production build.                                 |
| `pnpm start`       | Run the production build.                         |
| `pnpm typecheck`   | TypeScript, no emit.                              |
| `pnpm check`       | Biome lint + format, with autofix.                |
| `pnpm check:ci`    | Biome in CI mode (no writes).                     |
| `pnpm db:generate` | Generate a migration from schema changes.         |
| `pnpm db:migrate`  | Apply pending migrations.                         |
| `pnpm db:push`     | Push the schema directly (prototyping).           |
| `pnpm db:studio`   | Open Drizzle Studio.                              |
| `pnpm test:e2e`    | Run the Playwright suite (desktop + mobile).      |
| `pnpm preflight`   | Check environment configuration.                  |

## Database and migrations

The schema lives in `src/db/schema.ts`. After changing it:

```bash
pnpm db:generate   # writes a new SQL migration into ./drizzle
pnpm db:migrate    # applies it
```

Migrations are committed to source control so every environment converges on the same schema.

## Testing

End-to-end tests use Playwright and run against a real browser across two projects, a desktop
Chrome viewport and a Pixel 5 mobile viewport. They cover the happy paths, edge cases
(validation, auth errors, usage limits), and the Anthropic and Stripe integrations (mocked at
the network boundary so the suite is deterministic without live keys).

```bash
pnpm test:e2e
```

## Code quality

- **Biome** handles linting and formatting.
- **Husky** runs a pre-commit hook: Biome check, TypeScript typecheck, and a dependency audit.
- **GitHub Actions** runs the same checks plus the full e2e suite on every pull request to
  `main`, and these must pass before a change is merged.
- **release-please** opens and maintains release pull requests from Conventional Commits.

## Deployment

Repurpose is a server-rendered application: it needs a host that runs a Node.js server (for
example Vercel, Fly.io, Render, or a VPS). For the database, point `DATABASE_URL` at a hosted
libSQL/Turso database and set `DATABASE_AUTH_TOKEN`. Provide the remaining environment
variables, run `pnpm db:migrate`, and deploy.

To enable billing, create a recurring Price in Stripe, configure a webhook to
`/api/stripe/webhook` for the `checkout.session.completed` and `customer.subscription.*`
events, and set the Stripe environment variables.

## Project structure

```
src/
  app/
    page.tsx                     Landing page and pricing
    (auth)/login, signup         Auth pages (shared auth-form.tsx)
    dashboard/                   Authenticated app (server page + client UI)
    api/
      auth/{signup,login,logout} Session auth
      repurpose/                 Core generation endpoint + usage metering
      stripe/{checkout,portal,webhook}
    opengraph-image.tsx          Dynamic OG image
  db/
    schema.ts                    Drizzle schema
    index.ts                     Drizzle client (libSQL)
  lib/
    auth.ts                      Sessions and password hashing
    env.ts                       Zod-validated environment
    validation.ts                Zod request schemas
    plans.ts                     Plan limits
    repurpose.ts                 Claude prompts and generation
    stripe.ts                    Stripe client
drizzle/                         Generated SQL migrations
e2e/                             Playwright tests
```

## License

Private and unpublished.
