// Full product walkthrough, recorded. Drives every major flow against the
// mock Anthropic + Google servers so it runs without real keys.
//
// Usage (servers expected):
//   node scripts/mock-anthropic.mjs &   # :4545
//   node scripts/mock-google.mjs &      # :4546
//   PORT=3100 ANTHROPIC_API_KEY=mock ANTHROPIC_BASE_URL=http://localhost:4545 \
//     GOOGLE_CLIENT_ID=mock GOOGLE_CLIENT_SECRET=mock \
//     GOOGLE_OAUTH_AUTH_URL=http://localhost:4546/auth \
//     GOOGLE_OAUTH_TOKEN_URL=http://localhost:4546/token \
//     ADMIN_EMAILS=admin-demo@example.com pnpm dev
//   node scripts/demo.mjs
import { chromium } from "@playwright/test";

const BASE = "http://localhost:3100";
const outDir = "docs/media/.video";
const stamp = Date.now();
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: outDir, size: { width: 1280, height: 800 } },
});
const page = await context.newPage();

// ---- 1. Landing: hero + pricing -------------------------------------------
await page.goto(BASE);
await pause(1800);
await page.getByRole("heading", { name: /Simple pricing/i }).scrollIntoViewIfNeeded();
await pause(1800);

// ---- 2. Signup --------------------------------------------------------------
await page
  .getByRole("link", { name: /Start free/i })
  .first()
  .click();
await page.waitForURL(/signup/);
await page.getByLabel("Email").fill(`demo-${stamp}@example.com`);
await pause(400);
await page.getByLabel("Password").fill("demo-password-123");
await pause(600);
await page.getByRole("button", { name: /Create account/i }).click();
await page.waitForURL(/dashboard/);
await pause(1500);

// ---- 3. Email verification --------------------------------------------------
await page.getByRole("button", { name: /Resend link/i }).click();
await page.getByRole("link", { name: /open verify link/i }).waitFor();
await pause(1000);
await page.getByRole("link", { name: /open verify link/i }).click();
await page.waitForURL(/verified=1/);
await pause(1500);

// ---- 4. Voice notes ----------------------------------------------------------
await page.getByRole("link", { name: "Settings" }).click();
await page.waitForURL(/settings/);
await pause(800);
await page
  .locator("#voice-notes")
  .fill("Direct, a little contrarian. Short sentences. First person. No emojis.");
await pause(600);
await page.getByRole("button", { name: /Save voice notes/i }).click();
await page.getByText("Voice notes saved.").waitFor();
await pause(1200);

// ---- 5. Streaming generation -------------------------------------------------
await page.getByRole("link", { name: "Repurpose" }).click();
await page.waitForURL(/dashboard$/);
await page.getByRole("button", { name: /Load sample/i }).click();
await pause(800);
await page.getByRole("button", { name: /^Repurpose$/ }).click();
await page.getByText(/Busyness is a form of laziness. Do less/).waitFor({ timeout: 30_000 });
await pause(2000);

// ---- 6. History ---------------------------------------------------------------
await page.getByRole("link", { name: "History" }).click();
await page.waitForURL(/history/);
await pause(800);
await page
  .getByRole("button", { name: /^View$/ })
  .first()
  .click();
await pause(2000);

// ---- 7. Team: create + member joins -------------------------------------------
await page.getByRole("link", { name: "Settings" }).click();
await page.waitForURL(/settings/);
await page.getByLabel("Create a team").fill("Acme Content");
await pause(500);
await page.getByRole("button", { name: /Create team/i }).click();
await page.getByText(/Invite code/).waitFor();
await pause(1200);
const code = (await page.locator("code").first().textContent()) ?? "";
const memberCtx = await browser.newContext();
const m = await memberCtx.newPage();
await m.request.post(`${BASE}/api/auth/signup`, {
  data: { email: `demo-member-${stamp}@example.com`, password: "demo-password-123" },
});
await m.request.post(`${BASE}/api/team/join`, { data: { code } });
await memberCtx.close();
await page.reload();
await page.getByText(`demo-member-${stamp}@example.com`).waitFor();
await pause(1800);

// ---- 8. Billing: monthly + annual upgrade options -----------------------------
await page.getByRole("link", { name: "Repurpose" }).click();
await page.waitForURL(/dashboard$/);
await page.route("**/api/stripe/checkout", (route) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ url: "/dashboard?upgraded=1" }),
  }),
);
await pause(1200);
await page.getByRole("button", { name: /Annual — €190\/yr/i }).click();
await page.waitForURL(/upgraded=1/);
await page.getByText(/You're on Pro now/i).waitFor();
await pause(1800);

// ---- 9. Google sign-in ---------------------------------------------------------
await page.getByRole("button", { name: /Log out/i }).click();
await page.waitForURL(/\/$/);
await pause(800);
await page.goto(`${BASE}/login`);
await pause(800);
await page.getByRole("link", { name: /Continue with Google/i }).click();
await page.waitForURL(/dashboard/);
await pause(1500);

// ---- 10. Admin funnel -----------------------------------------------------------
await page.request.post(`${BASE}/api/auth/logout`);
await page.request.post(`${BASE}/api/auth/signup`, {
  data: { email: "admin-demo@example.com", password: "demo-password-123" },
});
await page.request.post(`${BASE}/api/auth/login`, {
  data: { email: "admin-demo@example.com", password: "demo-password-123" },
});
await page.goto(`${BASE}/admin`);
await page.getByRole("heading", { name: /Admin · Funnel/i }).waitFor();
await pause(2500);

await context.close();
await browser.close();
console.log("demo video saved in", outDir);
