// One-off capture: records the email-verification flow as video for PR media.
// Usage: node scripts/capture-verification.mjs (dev server must run on :3100)
import { chromium } from "@playwright/test";

const BASE = "http://localhost:3100";
const outDir = "docs/media/.video";

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1000, height: 640 },
  recordVideo: { dir: outDir, size: { width: 1000, height: 640 } },
});
const page = await context.newPage();

const email = `demo-${Date.now()}@example.com`;
await page.goto(`${BASE}/signup`);
await page.getByLabel("Email").fill(email);
await page.getByLabel("Password").fill("demo-password-123");
await page.waitForTimeout(600);
await page.getByRole("button", { name: /Create account/i }).click();
await page.waitForURL(/dashboard/);
await page.waitForTimeout(1200); // banner visible
await page.getByRole("button", { name: /Resend link/i }).click();
await page.getByRole("link", { name: /open verify link/i }).waitFor();
await page.waitForTimeout(1200);
await page.getByRole("link", { name: /open verify link/i }).click();
await page.waitForURL(/verified=1/);
await page.waitForTimeout(1500); // banner gone

await context.close();
await browser.close();
console.log("video saved in", outDir);
