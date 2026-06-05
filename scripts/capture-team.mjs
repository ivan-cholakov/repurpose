// One-off capture: records the team lifecycle from the owner's perspective.
// Needs the e2e dev server on :3100.
import { chromium } from "@playwright/test";

const BASE = "http://localhost:3100";
const outDir = "docs/media/.video";

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1000, height: 720 },
  recordVideo: { dir: outDir, size: { width: 1000, height: 720 } },
});
const page = await context.newPage();
const stamp = Date.now();

// Owner signs up and creates a team.
await page.goto(`${BASE}/signup`);
await page.getByLabel("Email").fill(`owner-${stamp}@example.com`);
await page.getByLabel("Password").fill("demo-password-123");
await page.getByRole("button", { name: /Create account/i }).click();
await page.waitForURL(/dashboard/);
await page.goto(`${BASE}/dashboard/settings`);
await page.waitForTimeout(1000);
await page.getByLabel("Create a team").fill("Acme Content");
await page.waitForTimeout(600);
await page.getByRole("button", { name: /Create team/i }).click();
await page.getByText(/Invite code/).waitFor();
await page.waitForTimeout(1500);

// A member joins via the API (separate context), then the owner refreshes.
const code = (await page.locator("code").first().textContent()) ?? "";
const memberCtx = await browser.newContext();
const member = await memberCtx.newPage();
await member.request.post(`${BASE}/api/auth/signup`, {
  data: { email: `member-${stamp}@example.com`, password: "demo-password-123" },
});
await member.request.post(`${BASE}/api/team/join`, { data: { code } });
await memberCtx.close();

await page.reload();
await page.getByText(`member-${stamp}@example.com`).waitFor();
await page.waitForTimeout(1800);

await context.close();
await browser.close();
console.log("video saved in", outDir);
