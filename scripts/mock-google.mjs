// Minimal mock of Google's OAuth endpoints for e2e tests and local demos.
// GET  /auth?...redirect_uri&state  → 302 back with a code (no consent screen)
// POST /token                       → id_token whose payload identifies a fake user
// Usage: node scripts/mock-google.mjs   # listens on :4546
import http from "node:http";

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost:4546");

  if (req.method === "GET" && url.pathname === "/auth") {
    const redirect = new URL(url.searchParams.get("redirect_uri"));
    redirect.searchParams.set("code", "mock-code");
    redirect.searchParams.set("state", url.searchParams.get("state") ?? "");
    res.writeHead(302, { Location: redirect.toString() }).end();
    return;
  }

  if (req.method === "POST" && url.pathname === "/token") {
    const idToken = [
      b64url({ alg: "none", typ: "JWT" }),
      b64url({
        sub: "google-user-e2e-1",
        email: "oauth-user@example.com",
        email_verified: true,
      }),
      "",
    ].join(".");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ access_token: "mock", id_token: idToken, token_type: "Bearer" }));
    return;
  }

  // Health check for Playwright's webServer readiness probe.
  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200).end("ok");
    return;
  }
  res.writeHead(404).end();
});

server.listen(4546, () => console.log("mock google on :4546"));
