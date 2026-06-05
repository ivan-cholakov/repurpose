import { expect, test } from "@playwright/test";
import { PASSWORD, uniqueEmail } from "./helpers";

// The proxy splits "/" between two statically prerendered landing designs via
// a sticky ab_landing cookie, and signups carry their variant for the funnel.

async function forceVariant(page: import("@playwright/test").Page, variant: "a" | "b") {
  await page
    .context()
    .addCookies([{ name: "ab_landing", value: variant, domain: "localhost", path: "/" }]);
}

test.describe("Landing A/B test", () => {
  test("cookie a serves the Editorial design", async ({ page }) => {
    await forceVariant(page, "a");
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Turn one post/i })).toBeVisible();
    await expect(page.getByText(/Set in Fraunces/)).toBeVisible(); // editorial colophon
  });

  test("cookie b serves the Darkroom design", async ({ page }) => {
    await forceVariant(page, "b");
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Turn one post/i })).toBeVisible();
    await expect(page.getByText(/stdin → stdout/)).toBeVisible(); // darkroom colophon
  });

  test("first visit assigns a sticky variant cookie", async ({ page }) => {
    await page.goto("/");
    const cookie = (await page.context().cookies()).find((c) => c.name === "ab_landing");
    expect(cookie?.value === "a" || cookie?.value === "b").toBeTruthy();

    // Reloads keep serving the same design.
    const marker = cookie?.value === "a" ? /Set in Fraunces/ : /stdin → stdout/;
    await page.reload();
    await expect(page.getByText(marker)).toBeVisible();
  });

  test("signups are attributed to their variant in the admin funnel", async ({ browser }) => {
    // Sign up a fresh user that saw variant B.
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await forceVariant(page, "b");
    await page.goto("/signup");
    await page.getByLabel("Email").fill(uniqueEmail("ab-b"));
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: /Create account/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await ctx.close();

    // The admin A/B table counts at least that signup for B (monotonic).
    const adminCtx = await browser.newContext();
    const admin = await adminCtx.newPage();
    await admin.request.post("/api/auth/signup", {
      data: { email: "admin-e2e@example.com", password: PASSWORD },
    });
    await admin.request.post("/api/auth/login", {
      data: { email: "admin-e2e@example.com", password: PASSWORD },
    });
    await admin.goto("/admin");
    await expect(admin.getByText("Landing A/B test")).toBeVisible();
    const bRow = admin.getByRole("row", { name: /B — Darkroom/ });
    await expect(bRow).toBeVisible();
    const signups = Number(await bRow.getByRole("cell").nth(1).textContent());
    expect(signups).toBeGreaterThanOrEqual(1);
    await adminCtx.close();
  });
});
