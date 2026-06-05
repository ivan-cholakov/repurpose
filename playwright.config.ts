import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Bounded so concurrent writers don't contend on the single SQLite file behind
  // one dev server. Production uses a libSQL/Turso server that handles concurrency.
  workers: 2,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop-chrome", use: { ...devices["Desktop Chrome"] } },
    // Pixel 5 is chromium-based, so no extra browser download is needed for mobile coverage.
    { name: "mobile-chrome", use: { ...devices["Pixel 5"] } },
  ],
  webServer: [
    {
      // Mock Google OAuth endpoints so the full sign-in flow is testable.
      command: "node scripts/mock-google.mjs",
      url: "http://localhost:4546",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      // Mock Anthropic Messages API so real generations run (and meter usage).
      command: "node scripts/mock-anthropic.mjs",
      url: "http://localhost:4545",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: `PORT=${PORT} pnpm dev`,
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      // Dummy values so the billing UI renders as "configured"; the actual Stripe
      // network calls are mocked in tests, so these keys are never used for real.
      env: {
        AUTH_SECRET: "e2e-test-secret-please-change-in-prod-1234567890",
        // Absolute links built by the app (e.g. password-reset dev links) must
        // point back at the e2e server, not the default :3000.
        NEXT_PUBLIC_APP_URL: baseURL,
        STRIPE_SECRET_KEY: "sk_test_dummy_for_e2e",
        STRIPE_PRICE_ID: "price_dummy_for_e2e",
        STRIPE_PRICE_ID_ANNUAL: "price_dummy_annual_for_e2e",
        // Fixed admin identity for the /admin e2e tests.
        ADMIN_EMAILS: "admin-e2e@example.com",
        // Generation against the mock Anthropic server above.
        ANTHROPIC_API_KEY: "mock-key-for-e2e",
        ANTHROPIC_BASE_URL: "http://localhost:4545",
        // Google sign-in against the mock provider above.
        GOOGLE_CLIENT_ID: "mock-client-id",
        GOOGLE_CLIENT_SECRET: "mock-client-secret",
        GOOGLE_OAUTH_AUTH_URL: "http://localhost:4546/auth",
        GOOGLE_OAUTH_TOKEN_URL: "http://localhost:4546/token",
      },
    },
  ],
});
