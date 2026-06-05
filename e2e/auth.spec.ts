import { expect, test } from "@playwright/test";
import { logout, PASSWORD, registerNewUser, uniqueEmail } from "./helpers";

test.describe("Authentication", () => {
  test("happy path: signup lands on dashboard with usage shown", async ({ page }) => {
    const { email } = await registerNewUser(page);
    await expect(page.getByText(/repurposes left this month/i)).toBeVisible();
    // The email appears in both the nav and the verify banner.
    await expect(page.getByText(email).first()).toBeVisible();
    await expect(page.getByText("Free")).toBeVisible();
  });

  test("happy path: logout then login again", async ({ page }) => {
    const { email, password } = await registerNewUser(page);

    await logout(page);
    await expect(page.getByRole("heading", { name: /Turn one post into ten/i })).toBeVisible();

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /^Log in$/ }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("edge: signup rejects short password", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Email").fill(uniqueEmail());
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: /Create account/i }).click();
    // HTML5 minLength keeps us on the page (no navigation to dashboard).
    await expect(page).toHaveURL(/\/signup$/);
  });

  test("edge: signup rejects duplicate email", async ({ page }) => {
    const { email } = await registerNewUser(page);
    await logout(page);

    await page.goto("/signup");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: /Create account/i }).click();
    await expect(page.getByText(/already exists/i)).toBeVisible();
  });

  test("edge: login with wrong password shows error", async ({ page }) => {
    const { email } = await registerNewUser(page);
    await logout(page);

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("totally-wrong-password");
    await page.getByRole("button", { name: /^Log in$/ }).click();
    await expect(page.getByText(/Invalid email or password/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("edge: login with unknown email shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(uniqueEmail("nope"));
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: /^Log in$/ }).click();
    await expect(page.getByText(/Invalid email or password/i)).toBeVisible();
  });

  test("edge: dashboard is protected when logged out", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("edge: visiting /login while authed redirects to dashboard", async ({ page }) => {
    await registerNewUser(page);
    await page.goto("/login");
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
