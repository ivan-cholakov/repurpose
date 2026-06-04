import { expect, type Page, type Route } from "@playwright/test";

export const PASSWORD = "password1234";

/** A unique email per call so tests never collide on the persistent DB. */
export function uniqueEmail(prefix = "e2e"): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@example.com`;
}

/** Click Log out and wait until the session is cleared (back on the landing page). */
export async function logout(page: Page): Promise<void> {
  await page.getByRole("button", { name: /Log out/i }).click();
  await expect(page).toHaveURL(/\/$/);
}

/** Register a brand-new user and land on the dashboard. Returns the credentials. */
export async function registerNewUser(page: Page): Promise<{ email: string; password: string }> {
  const email = uniqueEmail();
  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /Create account/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  return { email, password: PASSWORD };
}

/**
 * Mock the /api/repurpose integration so the generation flow is deterministic
 * without a real Anthropic API key.
 */
export async function mockRepurposeSuccess(
  page: Page,
  results: Array<{ format: string; label: string; content: string }> = [
    { format: "thread", label: "X / Twitter thread", content: "1/ Mocked thread tweet." },
    { format: "linkedin", label: "LinkedIn post", content: "Mocked LinkedIn post body." },
  ],
): Promise<void> {
  await page.route("**/api/repurpose", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ results, usage: { used: 1, limit: 5 } }),
    }),
  );
}

/** Mock /api/repurpose returning a usage-limit (402) response. */
export async function mockRepurposeLimit(page: Page): Promise<void> {
  await page.route("**/api/repurpose", (route: Route) =>
    route.fulfill({
      status: 402,
      contentType: "application/json",
      body: JSON.stringify({
        error: "You've hit your Free limit of 5 repurposes this month.",
        limitReached: true,
      }),
    }),
  );
}

/** Mock the Stripe checkout integration to return a redirect URL. */
export async function mockStripeCheckout(page: Page, url = "/dashboard?upgraded=1"): Promise<void> {
  await page.route("**/api/stripe/checkout", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ url }),
    }),
  );
}
