import { expect, test } from "@playwright/test";

test.describe("Landing page", () => {
  test("shows hero, value prop, and pricing", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Turn one post into ten/i })).toBeVisible();
    await expect(page.getByText(/Powered by Claude/i).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Simple pricing/i })).toBeVisible();
    await expect(page.getByText("€0")).toBeVisible();
    await expect(page.getByText("€19")).toBeVisible();
  });

  test("primary CTA navigates to signup", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("link", { name: /Start free/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByRole("heading", { name: /Create your account/i })).toBeVisible();
  });

  test("nav login link navigates to login", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /^Log in$/i }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
