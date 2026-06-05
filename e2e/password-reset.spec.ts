import { expect, test } from "@playwright/test";
import { logout, PASSWORD, registerNewUser, uniqueEmail } from "./helpers";

test.describe("Password reset", () => {
  test("full flow: request link, set new password, old rejected, new works", async ({ page }) => {
    const { email } = await registerNewUser(page);
    await logout(page);

    // Request a reset from the login page.
    await page.goto("/login");
    await page.getByRole("link", { name: /Forgot password/i }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: /Send reset link/i }).click();
    await expect(page.getByText(/reset link is on its way/i)).toBeVisible();

    // No mail provider in dev, so the API hands back the link.
    const devLink = page.getByRole("link", { name: /open reset link/i });
    await expect(devLink).toBeVisible();
    await devLink.click();

    const newPassword = `${PASSWORD}-reset`;
    await page.getByLabel("New password").fill(newPassword);
    await page.getByRole("button", { name: /Set new password/i }).click();
    await expect(page.getByText(/Password updated/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);

    // Old password rejected, new password accepted.
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: /Log in/i }).click();
    await expect(page.getByText(/Invalid email or password/i)).toBeVisible();
    await page.getByLabel("Password").fill(newPassword);
    await page.getByRole("button", { name: /Log in/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("reset links are single-use", async ({ page }) => {
    const { email } = await registerNewUser(page);
    await logout(page);

    const res = await page.request.post("/api/auth/forgot", { data: { email } });
    const { devLink } = await res.json();
    expect(devLink).toBeTruthy();
    const token = new URL(devLink).searchParams.get("token");

    const first = await page.request.post("/api/auth/reset", {
      data: { token, password: "brand-new-password-1" },
    });
    expect(first.ok()).toBeTruthy();

    const second = await page.request.post("/api/auth/reset", {
      data: { token, password: "brand-new-password-2" },
    });
    expect(second.status()).toBe(400);
  });

  test("unknown email gets the same success message (no enumeration)", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill(uniqueEmail("ghost"));
    await page.getByRole("button", { name: /Send reset link/i }).click();
    await expect(page.getByText(/reset link is on its way/i)).toBeVisible();
  });

  test("garbage token is rejected", async ({ page }) => {
    await page.goto("/reset-password?token=not-a-real-token");
    await page.getByLabel("New password").fill("whatever-password-1");
    await page.getByRole("button", { name: /Set new password/i }).click();
    await expect(page.getByText(/invalid or has expired/i)).toBeVisible();
  });
});
