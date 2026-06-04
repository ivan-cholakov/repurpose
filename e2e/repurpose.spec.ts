import { expect, test } from "@playwright/test";
import { mockRepurposeLimit, mockRepurposeSuccess, registerNewUser } from "./helpers";

test.describe("Repurpose flow", () => {
  test("happy path: load sample, generate (mocked), render results", async ({ page }) => {
    await registerNewUser(page);
    await mockRepurposeSuccess(page);

    await page.getByRole("button", { name: /Load sample/i }).click();
    await expect(page.locator("#source-content")).not.toHaveValue("");

    await page.getByRole("button", { name: /^Repurpose$/ }).click();

    // Assert on the (unique) generated content; the labels also appear on the
    // format-toggle buttons, so we check the rendered <pre> bodies instead.
    await expect(page.getByText("1/ Mocked thread tweet.")).toBeVisible();
    await expect(page.getByText("Mocked LinkedIn post body.")).toBeVisible();
    await expect(page.locator("pre")).toHaveCount(2);
  });

  test("happy path: copy button shows confirmation", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await registerNewUser(page);
    await mockRepurposeSuccess(page);

    await page.getByRole("button", { name: /Load sample/i }).click();
    await page.getByRole("button", { name: /^Repurpose$/ }).click();
    await expect(page.getByText("1/ Mocked thread tweet.")).toBeVisible();

    await page
      .getByRole("button", { name: /^Copy$/ })
      .first()
      .click();
    await expect(page.getByText(/Copied!/i).first()).toBeVisible();
  });

  test("edge: too-short source is rejected client-side", async ({ page }) => {
    await registerNewUser(page);
    await page.locator("#source-content").fill("too short");
    await page.getByRole("button", { name: /^Repurpose$/ }).click();
    await expect(page.getByText(/at least 50 characters/i)).toBeVisible();
  });

  test("edge: deselecting all formats blocks generation", async ({ page }) => {
    await registerNewUser(page);
    await page.getByRole("button", { name: /Load sample/i }).click();
    // Default selection is thread + linkedin; turn both off.
    await page.getByRole("button", { name: "X / Twitter thread" }).click();
    await page.getByRole("button", { name: "LinkedIn post" }).click();
    await page.getByRole("button", { name: /^Repurpose$/ }).click();
    await expect(page.getByText(/Select at least one format/i)).toBeVisible();
  });

  test("edge: usage-limit (402) surfaces a clear message", async ({ page }) => {
    await registerNewUser(page);
    await mockRepurposeLimit(page);
    await page.getByRole("button", { name: /Load sample/i }).click();
    await page.getByRole("button", { name: /^Repurpose$/ }).click();
    await expect(page.getByText(/hit your Free limit/i)).toBeVisible();
  });

  test("integration: real endpoint without API key fails gracefully (no crash)", async ({
    page,
  }) => {
    // No mock here: hits the real /api/repurpose, which returns 502 (no key configured).
    await registerNewUser(page);
    await page.getByRole("button", { name: /Load sample/i }).click();
    await page.getByRole("button", { name: /^Repurpose$/ }).click();
    // The UI shows an error rather than hanging or crashing.
    await expect(page.locator("p.text-red-600")).toBeVisible({ timeout: 20_000 });
  });
});
