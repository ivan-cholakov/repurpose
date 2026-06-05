import { expect, test } from "@playwright/test";
import { registerNewUser } from "./helpers";

test.describe("Voice & style notes", () => {
  test("save, persist across reload, and clear", async ({ page }) => {
    await registerNewUser(page);
    await page.goto("/dashboard/settings");

    const notes = "Short sentences. First person. No emojis.";
    await page.locator("#voice-notes").fill(notes);
    await page.getByRole("button", { name: /Save voice notes/i }).click();
    await expect(page.getByText("Voice notes saved.")).toBeVisible();

    await page.reload();
    await expect(page.locator("#voice-notes")).toHaveValue(notes);

    // Clearing saves an empty value.
    await page.locator("#voice-notes").fill("");
    await page.getByRole("button", { name: /Save voice notes/i }).click();
    await expect(page.getByText("Voice notes saved.")).toBeVisible();
    await page.reload();
    await expect(page.locator("#voice-notes")).toHaveValue("");
  });

  test("API rejects voice notes over the limit", async ({ page }) => {
    await registerNewUser(page);
    const res = await page.request.post("/api/account/voice", {
      data: { voiceNotes: "x".repeat(2001) },
    });
    expect(res.status()).toBe(400);
  });

  test("voice API requires authentication", async ({ page }) => {
    const res = await page.request.post("/api/account/voice", {
      data: { voiceNotes: "hello" },
    });
    expect(res.status()).toBe(401);
  });
});
