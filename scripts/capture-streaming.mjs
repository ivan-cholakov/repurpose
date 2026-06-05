// One-off capture: records the streaming generation flow for PR media.
// Needs: mock-anthropic.mjs on :4545 and a dev server on :3100 started with
// ANTHROPIC_BASE_URL=http://localhost:4545 ANTHROPIC_API_KEY=mock.
import { chromium } from "@playwright/test";

const BASE = "http://localhost:3100";
const outDir = "docs/media/.video";

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1100, height: 720 },
  recordVideo: { dir: outDir, size: { width: 1100, height: 720 } },
});
const page = await context.newPage();

const email = `demo-stream-${Date.now()}@example.com`;
await page.goto(`${BASE}/signup`);
await page.getByLabel("Email").fill(email);
await page.getByLabel("Password").fill("demo-password-123");
await page.getByRole("button", { name: /Create account/i }).click();
await page.waitForURL(/dashboard/);

await page.getByRole("button", { name: /Load sample/i }).click();
await page.waitForTimeout(800);
await page.getByRole("button", { name: /^Repurpose$/ }).click();
// Let the streamed text finish rendering, then hold the final frame.
await page.getByText(/Busyness is a form of laziness. Do less/).waitFor({ timeout: 30_000 });
await page.waitForTimeout(2000);

await context.close();
await browser.close();
console.log("video saved in", outDir);
