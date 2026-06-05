import "server-only";
import { env, requireEnv } from "@/lib/env";

export function googleConfigured(): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

const AUTH_URL = () => env.GOOGLE_OAUTH_AUTH_URL ?? "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = () => env.GOOGLE_OAUTH_TOKEN_URL ?? "https://oauth2.googleapis.com/token";

export function redirectUri(): string {
  return `${env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;
}

/** Build the Google consent-screen URL for the authorization-code flow. */
export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv("GOOGLE_CLIENT_ID"),
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "openid email",
    state,
    prompt: "select_account",
  });
  return `${AUTH_URL()}?${params}`;
}

export interface GoogleIdentity {
  googleId: string;
  email: string;
  emailVerified: boolean;
}

/** Exchange an authorization code for the user's identity. */
export async function exchangeCode(code: string): Promise<GoogleIdentity> {
  const res = await fetch(TOKEN_URL(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: requireEnv("GOOGLE_CLIENT_ID"),
      client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Google token exchange failed (${res.status}): ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as { id_token?: string };
  if (!data.id_token) throw new Error("Google response had no id_token.");

  // The token arrives over TLS directly from the token endpoint, so decoding
  // the payload without signature verification is safe in the code flow.
  const payloadPart = data.id_token.split(".")[1];
  if (!payloadPart) throw new Error("Malformed id_token.");
  const payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8")) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
  };
  if (!payload.sub || !payload.email) throw new Error("id_token missing sub/email.");

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    emailVerified: payload.email_verified === true,
  };
}
