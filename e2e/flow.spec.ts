import { test, expect } from "@playwright/test";

// Unique email per run so signup always succeeds against the persistent DB.
const email = `e2e-${Date.now()}@example.com`;
const password = "password1234";

test("landing page shows hero and pricing", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Turn one post into ten/i })).toBeVisible();
  await expect(page.getByText("€19", { exact: false })).toBeVisible();
  await expect(page.getByRole("link", { name: /Start free/i }).first()).toBeVisible();
});

test("protected dashboard redirects to login when logged out", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});

test("signup → dashboard → sample + format toggle → generate handles missing key gracefully", async ({
  page,
}) => {
  // Sign up
  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /Create account/i }).click();

  // Lands on dashboard with usage shown
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(/repurposes left this month/i)).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();

  // Load sample populates the textarea
  await page.getByRole("button", { name: /Load sample/i }).click();
  const textarea = page.locator("textarea");
  await expect(textarea).not.toHaveValue("");

  // Toggle a format (newsletter) on
  await page.getByRole("button", { name: "Newsletter blurb" }).click();

  // Click Repurpose. Without an ANTHROPIC_API_KEY the API returns a graceful 502;
  // assert the UI surfaces a result OR a visible error (i.e. it never hangs/crashes).
  await page.getByRole("button", { name: /^Repurpose$/ }).click();
  const result = page.locator("pre").first();
  const error = page.locator("p.text-red-600");
  await expect(result.or(error)).toBeVisible({ timeout: 20_000 });
});

test("logout returns to landing, then login works", async ({ page }) => {
  // Log in with the account created above
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /^Log in$/ }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  // Log out
  await page.getByRole("button", { name: /Log out/i }).click();
  await expect(page).toHaveURL(/\/$|\/$/);
  await expect(page.getByRole("heading", { name: /Turn one post into ten/i })).toBeVisible();
});

test("login with wrong password shows an error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("totally-wrong-pw");
  await page.getByRole("button", { name: /^Log in$/ }).click();
  await expect(page.getByText(/Invalid email or password/i)).toBeVisible();
});
