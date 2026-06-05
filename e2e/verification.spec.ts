import { expect, test } from "@playwright/test";
import { registerNewUser } from "./helpers";

test.describe("Email verification", () => {
  test("banner shows for fresh accounts; dev link verifies and clears it", async ({ page }) => {
    await registerNewUser(page);
    await expect(page.getByText(/Please verify/i)).toBeVisible();

    // No mail provider in dev: resend hands back the link.
    await page.getByRole("button", { name: /Resend link/i }).click();
    const devLink = page.getByRole("link", { name: /open verify link/i });
    await expect(devLink).toBeVisible();
    await devLink.click();

    await expect(page).toHaveURL(/\/dashboard\?verified=1$/);
    await expect(page.getByText(/Please verify/i)).not.toBeVisible();
  });

  test("garbage verification token redirects with an error and stays unverified", async ({
    page,
  }) => {
    await registerNewUser(page);
    await page.goto("/api/auth/verify?token=garbage");
    await expect(page).toHaveURL(/\/dashboard\?verify_error=1$/);
    await expect(page.getByText(/Please verify/i)).toBeVisible();
  });

  test("resend is rejected once already verified", async ({ page }) => {
    await registerNewUser(page);
    await page.getByRole("button", { name: /Resend link/i }).click();
    await page.getByRole("link", { name: /open verify link/i }).click();
    await expect(page).toHaveURL(/verified=1/);

    const res = await page.request.post("/api/auth/verify/resend");
    expect(res.status()).toBe(400);
  });
});
