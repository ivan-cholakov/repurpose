// One-off capture: still of the admin funnel page.
import { chromium } from "@playwright/test";

const BASE = "http://localhost:3100";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 760 } });

await page.request.post(`${BASE}/api/auth/signup`, {
  data: { email: "admin-e2e@example.com", password: "password1234" },
});
await page.request.post(`${BASE}/api/auth/login`, {
  data: { email: "admin-e2e@example.com", password: "password1234" },
});
await page.goto(`${BASE}/admin`);
await page.getByRole("heading", { name: /Admin · Funnel/i }).waitFor();
await page.waitForTimeout(400);
await page.screenshot({ path: "docs/media/admin-funnel.png" });

await browser.close();
console.log("screenshot saved");
