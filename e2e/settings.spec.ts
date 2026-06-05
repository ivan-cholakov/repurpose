import { expect, test } from "@playwright/test";
import { logout, PASSWORD, registerNewUser, uniqueEmail } from "./helpers";

test.describe("Account settings", () => {
  test("settings page requires authentication", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await expect(page).toHaveURL(/\/login/);
  });

  test("change password: old stops working, new logs in", async ({ page }) => {
    const { email } = await registerNewUser(page);
    await page.goto("/dashboard/settings");

    const newPassword = `${PASSWORD}-rotated`;
    // Two sections have a "Current password" field; target the password form's.
    await page.locator("#current-password").fill(PASSWORD);
    await page.getByLabel("New password").fill(newPassword);
    await page.getByRole("button", { name: /Update password/i }).click();
    await expect(page.getByText("Password updated.")).toBeVisible();

    await logout(page);

    // Old password rejected.
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: /Log in/i }).click();
    await expect(page.getByText(/Invalid email or password/i)).toBeVisible();

    // New password accepted.
    await page.getByLabel("Password").fill(newPassword);
    await page.getByRole("button", { name: /Log in/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("change email: wrong password rejected, correct one updates", async ({ page }) => {
    await registerNewUser(page);
    await page.goto("/dashboard/settings");

    const newEmail = uniqueEmail("renamed");
    await page.getByLabel("New email").fill(newEmail);
    await page.getByLabel("Current password").first().fill("wrong-password-123");
    await page.getByRole("button", { name: /Update email/i }).click();
    await expect(page.getByText(/Incorrect password/i)).toBeVisible();

    await page.getByLabel("Current password").first().fill(PASSWORD);
    await page.getByRole("button", { name: /Update email/i }).click();
    await expect(page.getByText("Email updated.")).toBeVisible();
    await expect(page.getByText(newEmail).first()).toBeVisible();
  });

  test("delete account: removes the user and ends the session", async ({ page }) => {
    const { email } = await registerNewUser(page);
    await page.goto("/dashboard/settings");

    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByLabel(/Type/).fill("DELETE");
    await page.getByRole("button", { name: /Delete my account/i }).click();
    await expect(page).toHaveURL(/\/$/);

    // The account is gone: logging in again fails.
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: /Log in/i }).click();
    await expect(page.getByText(/Invalid email or password/i)).toBeVisible();
  });
});
