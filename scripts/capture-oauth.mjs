// One-off capture: records the Google sign-in flow (mock provider) for PR media.
import { chromium } from "@playwright/test";

const BASE = "http://localhost:3100";
const outDir = "docs/media/.video";

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1000, height: 640 },
  recordVideo: { dir: outDir, size: { width: 1000, height: 640 } },
});
const page = await context.newPage();

await page.goto(`${BASE}/login`);
await page.waitForTimeout(1200);
await page.getByRole("link", { name: /Continue with Google/i }).hover();
await page.waitForTimeout(600);
await page.getByRole("link", { name: /Continue with Google/i }).click();
await page.waitForURL(/dashboard/);
await page.waitForTimeout(1800);

await context.close();
await browser.close();
console.log("video saved in", outDir);
