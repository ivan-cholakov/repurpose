// One-off capture: loading skeletons during throttled dashboard navigation.
import { chromium } from "@playwright/test";

const BASE = "http://localhost:3100";
const outDir = "docs/media/.video";

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1000, height: 640 },
  recordVideo: { dir: outDir, size: { width: 1000, height: 640 } },
});
const page = await context.newPage();

// Pre-warm dev-mode compilation so throttling shows data latency, not builds.
for (const p of ["/signup", "/dashboard", "/dashboard/history", "/dashboard/settings"]) {
  await page.request.get(`${BASE}${p}`).catch(() => {});
}

// Slow the server data down so the skeletons are visible.
const cdp = await context.newCDPSession(page);
await cdp.send("Network.enable");
// High bandwidth, high latency: dev bundles stay fast while each server
// roundtrip (the thing the skeletons cover) is visibly delayed.
await cdp.send("Network.emulateNetworkConditions", {
  offline: false,
  latency: 400,
  downloadThroughput: (50 * 1024 * 1024) / 8,
  uploadThroughput: (20 * 1024 * 1024) / 8,
});

await page.goto(`${BASE}/signup`);
await page.getByLabel("Email").fill(`perf-${Date.now()}@example.com`);
await page.getByLabel("Password").fill("demo-password-123");
await page.getByRole("button", { name: /Create account/i }).click();
await page.waitForURL(/dashboard/);
await page.waitForTimeout(1000);
await page.getByRole("link", { name: "History" }).click();
await page.waitForURL(/history/);
await page.waitForTimeout(1000);
await page.getByRole("link", { name: "Settings" }).click();
await page.waitForURL(/settings/);
await page.waitForTimeout(1500);

await context.close();
await browser.close();
console.log("video saved");
