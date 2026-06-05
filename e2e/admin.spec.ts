import { expect, test } from "@playwright/test";
import { PASSWORD, registerNewUser } from "./helpers";

// Matches ADMIN_EMAILS in playwright.config.ts. Registered once per run; later
// runs just log in (the e2e database persists between runs).
const ADMIN_EMAIL = "admin-e2e@example.com";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  // Create-or-login via the API to dodge the desktop/mobile project race on the
  // shared admin account (signup is atomic; 409 means the other project won).
  const signup = await page.request.post("/api/auth/signup", {
    data: { email: ADMIN_EMAIL, password: PASSWORD },
  });
  if (!signup.ok()) {
    const login = await page.request.post("/api/auth/login", {
      data: { email: ADMIN_EMAIL, password: PASSWORD },
    });
    expect(login.ok()).toBeTruthy();
  }
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);
}

test.describe("Admin funnel metrics", () => {
  test("regular users get a 404", async ({ page }) => {
    await registerNewUser(page);
    const res = await page.goto("/admin");
    expect(res?.status()).toBe(404);
  });

  test("logged-out visitors get a 404", async ({ page }) => {
    const res = await page.goto("/admin");
    expect(res?.status()).toBe(404);
  });

  test("admin sees the funnel and stats", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: /Admin · Funnel/i })).toBeVisible();
    // "Signups" appears in both the funnel and the A/B table; scope to the funnel row.
    await expect(page.getByText("Signups", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Activated \(≥1 repurpose\)/)).toBeVisible();
    await expect(page.getByText(/Paid \(Pro\)/)).toBeVisible();
    await expect(page.getByText(/Repurposes, all time/)).toBeVisible();
  });
});
