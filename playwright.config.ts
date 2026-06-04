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
  webServer: {
    command: `PORT=${PORT} pnpm dev`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Dummy values so the billing UI renders as "configured"; the actual Stripe
    // network calls are mocked in tests, so these keys are never used for real.
    env: {
      AUTH_SECRET: "e2e-test-secret-please-change-in-prod-1234567890",
      STRIPE_SECRET_KEY: "sk_test_dummy_for_e2e",
      STRIPE_PRICE_ID: "price_dummy_for_e2e",
    },
  },
});
