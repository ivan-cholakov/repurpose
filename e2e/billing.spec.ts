import { expect, test } from "@playwright/test";
import { mockStripeCheckout, registerNewUser } from "./helpers";

test.describe("Billing", () => {
  test("free user sees an enabled Upgrade to Pro button", async ({ page }) => {
    await registerNewUser(page);
    const upgrade = page.getByRole("button", { name: /Upgrade to Pro/i });
    await expect(upgrade).toBeVisible();
    await expect(upgrade).toBeEnabled();
  });

  test("integration: clicking upgrade starts checkout and redirects (mocked)", async ({ page }) => {
    await registerNewUser(page);
    await mockStripeCheckout(page, "/dashboard?upgraded=1");

    await page.getByRole("button", { name: /Upgrade to Pro/i }).click();

    // The client redirects to the Stripe-provided URL; here the mock points back
    // to the dashboard with the upgraded flag, which shows the success banner.
    await expect(page).toHaveURL(/\/dashboard\?upgraded=1$/);
    await expect(page.getByText(/You're on Pro now/i)).toBeVisible();
  });

  test("annual checkout sends interval=year to the API", async ({ page }) => {
    await registerNewUser(page);

    let capturedBody: string | null = null;
    await page.route("**/api/stripe/checkout", (route) => {
      capturedBody = route.request().postData();
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ url: "/dashboard?upgraded=1" }),
      });
    });

    const annual = page.getByRole("button", { name: /Annual — €190\/yr/i });
    await expect(annual).toBeVisible();
    await annual.click();
    await expect(page).toHaveURL(/\/dashboard\?upgraded=1$/);
    expect(JSON.parse(capturedBody ?? "{}")).toEqual({ interval: "year" });
  });

  test("edge: checkout error is surfaced, not swallowed", async ({ page }) => {
    await registerNewUser(page);
    await page.route("**/api/stripe/checkout", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Billing is not configured yet." }),
      }),
    );

    await page.getByRole("button", { name: /Upgrade to Pro/i }).click();
    await expect(page.getByText(/Billing is not configured yet/i)).toBeVisible();
  });
});
