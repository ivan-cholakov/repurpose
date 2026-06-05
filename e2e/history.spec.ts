import { expect, test } from "@playwright/test";
import { registerNewUser } from "./helpers";

test.describe("Generation history", () => {
  test("nav link reaches an empty history for a fresh account", async ({ page }) => {
    await registerNewUser(page);
    await page.getByRole("link", { name: "History" }).click();
    await expect(page).toHaveURL(/\/dashboard\/history$/);
    await expect(page.getByRole("heading", { name: "History" })).toBeVisible();
    await expect(page.getByText(/Nothing here yet/i)).toBeVisible();
  });

  test("empty state links back to the repurpose dashboard", async ({ page }) => {
    await registerNewUser(page);
    await page.goto("/dashboard/history");
    await page.getByRole("link", { name: /Repurpose something/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("history page requires authentication", async ({ page }) => {
    await page.goto("/dashboard/history");
    await expect(page).toHaveURL(/\/login/);
  });

  test("delete API rejects rows that are not yours", async ({ page }) => {
    await registerNewUser(page);
    const res = await page.request.delete("/api/generations/not-a-real-id");
    expect(res.status()).toBe(404);
  });

  test("delete API requires authentication", async ({ page }) => {
    const res = await page.request.delete("/api/generations/whatever");
    expect(res.status()).toBe(401);
  });
});
