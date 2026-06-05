import { expect, test } from "@playwright/test";
import { PASSWORD } from "./helpers";

// The dev server points at scripts/mock-google.mjs, which always identifies
// the same fake user: oauth-user@example.com / google-user-e2e-1.

test.describe("Google OAuth", () => {
  test("full flow: Continue with Google lands on the dashboard, verified", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /Continue with Google/i }).click();

    // Mock provider redirects straight back; callback creates the session.
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText("oauth-user@example.com").first()).toBeVisible();
    // Google-verified email ⇒ no verification banner.
    await expect(page.getByText(/Please verify/i)).not.toBeVisible();
  });

  test("OAuth account cannot log in with a password", async ({ page }) => {
    // Ensure the OAuth user exists (idempotent thanks to the fixed mock identity).
    await page.goto("/api/auth/google");
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.request.post("/api/auth/logout");

    await page.goto("/login");
    await page.getByLabel("Email").fill("oauth-user@example.com");
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: /^Log in$/ }).click();
    await expect(page.getByText(/uses Google sign-in/i)).toBeVisible();
  });

  test("OAuth user sees no password section in settings", async ({ page }) => {
    await page.goto("/api/auth/google");
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/dashboard/settings");
    await expect(page.getByRole("heading", { name: "Voice & style" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Password", exact: true })).not.toBeVisible();
  });

  test("callback rejects a forged state", async ({ page }) => {
    const res = await page.goto("/api/auth/google/callback?code=x&state=forged");
    await expect(page).toHaveURL(/\/login\?oauth_error=1/);
    expect(res?.status()).toBeLessThan(500);
  });
});
