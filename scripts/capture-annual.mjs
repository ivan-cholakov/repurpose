// One-off capture: stills of the annual-plan pricing and upgrade options.
import { chromium } from "@playwright/test";

const BASE = "http://localhost:3100";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });

// Landing pricing section.
await page.goto(BASE);
await page.getByRole("heading", { name: /Simple pricing/i }).scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await page.screenshot({ path: "docs/media/pricing-annual.png" });

// Dashboard upgrade buttons (fresh free account).
await page.goto(`${BASE}/signup`);
await page.getByLabel("Email").fill(`demo-annual-${Date.now()}@example.com`);
await page.getByLabel("Password").fill("demo-password-123");
await page.getByRole("button", { name: /Create account/i }).click();
await page.waitForURL(/dashboard/);
await page.waitForTimeout(600);
await page.screenshot({ path: "docs/media/upgrade-annual.png" });

await browser.close();
console.log("screenshots saved");
