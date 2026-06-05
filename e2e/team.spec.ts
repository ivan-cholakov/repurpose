import { expect, type Page, test } from "@playwright/test";
import { registerNewUser } from "./helpers";

async function createTeam(page: Page, name: string): Promise<string> {
  await page.goto("/dashboard/settings");
  await page.getByLabel("Create a team").fill(name);
  await page.getByRole("button", { name: /Create team/i }).click();
  await expect(page.getByRole("heading", { name: `Team · ${name}` })).toBeVisible();
  return (await page.locator("code").first().textContent()) ?? "";
}

test.describe("Team seats", () => {
  test("create team, member joins via code, owner sees and removes them", async ({ browser }) => {
    const ownerCtx = await browser.newContext();
    const memberCtx = await browser.newContext();
    const owner = await ownerCtx.newPage();
    const member = await memberCtx.newPage();

    await registerNewUser(owner);
    const inviteCode = await createTeam(owner, "Acme Content");
    expect(inviteCode.length).toBeGreaterThan(8);

    const { email: memberEmail } = await registerNewUser(member);
    await member.goto("/dashboard/settings");
    await member.getByLabel("Join with an invite code").fill(inviteCode);
    await member.getByRole("button", { name: /Join team/i }).click();
    await expect(member.getByRole("heading", { name: /Team · Acme Content/ })).toBeVisible();
    await expect(member.getByRole("button", { name: /Leave team/i })).toBeVisible();

    // Owner sees the member and removes them.
    await owner.reload();
    await expect(owner.getByText(memberEmail)).toBeVisible();
    await owner.getByRole("button", { name: /^Remove$/ }).click();
    await expect(owner.getByText(/No members yet/i)).toBeVisible();

    await ownerCtx.close();
    await memberCtx.close();
  });

  test("member draws on the owner's usage pool", async ({ browser }) => {
    const ownerCtx = await browser.newContext();
    const memberCtx = await browser.newContext();
    const owner = await ownerCtx.newPage();
    const member = await memberCtx.newPage();

    await registerNewUser(owner);
    const code = await createTeam(owner, "Pool Test");

    await registerNewUser(member);
    const join = await member.request.post("/api/team/join", { data: { code } });
    expect(join.ok()).toBeTruthy();

    // The member generates once (real endpoint, mock Anthropic upstream)…
    const source = "This is a long enough piece of source content for the validation to accept.";
    const gen = await member.request.post("/api/repurpose", {
      data: { source, formats: ["tldr"] },
    });
    expect(gen.ok()).toBeTruthy();
    const { usage } = await gen.json();
    expect(usage).toEqual({ used: 1, limit: 5 });

    // …and the consumption shows up for BOTH accounts (owner's pool).
    await member.goto("/dashboard");
    await expect(member.getByText(/4 of 5 repurposes left/i)).toBeVisible();
    await owner.goto("/dashboard");
    await expect(owner.getByText(/4 of 5 repurposes left/i)).toBeVisible();

    await ownerCtx.close();
    await memberCtx.close();
  });

  test("owner cannot leave; member cannot delete", async ({ browser }) => {
    const ownerCtx = await browser.newContext();
    const memberCtx = await browser.newContext();
    const owner = await ownerCtx.newPage();
    const member = await memberCtx.newPage();

    await registerNewUser(owner);
    const code = await createTeam(owner, "Rules Test");
    await registerNewUser(member);
    await member.request.post("/api/team/join", { data: { code } });

    const leave = await owner.request.post("/api/team/leave");
    expect(leave.status()).toBe(400);

    const del = await member.request.delete("/api/team");
    expect(del.status()).toBe(403);

    await ownerCtx.close();
    await memberCtx.close();
  });

  test("joining with a bogus code fails cleanly", async ({ page }) => {
    await registerNewUser(page);
    const res = await page.request.post("/api/team/join", {
      data: { code: "definitely-not-a-real-code" },
    });
    expect(res.status()).toBe(404);
  });
});
