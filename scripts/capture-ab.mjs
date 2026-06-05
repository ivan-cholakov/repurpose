// One-off capture: full-page stills of both landing variants + restyled login.
import { chromium } from "@playwright/test";

const BASE = "http://localhost:3100";
const browser = await chromium.launch();
// reducedMotion skips the entrance transition so stills show the settled page.
const page = await browser.newPage({
  viewport: { width: 1280, height: 800 },
  reducedMotion: "reduce",
});

await page.goto(`${BASE}/variant-a`);
await page.waitForTimeout(1500); // let the reveal finish
await page.screenshot({ path: "docs/media/landing-a-editorial.png", fullPage: true });

await page.goto(`${BASE}/variant-b`);
await page.waitForTimeout(1500);
await page.screenshot({ path: "docs/media/landing-b-darkroom.png", fullPage: true });

await page.goto(`${BASE}/login`);
await page.waitForTimeout(800);
await page.screenshot({ path: "docs/media/auth-editorial.png" });

await browser.close();
console.log("captures saved");
