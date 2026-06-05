import "server-only";
import { env } from "@/lib/env";

export function mailConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY);
}

/**
 * Send a transactional email via Resend. Without RESEND_API_KEY the message is
 * logged to the server console instead (local dev), and `delivered` is false so
 * callers can degrade gracefully.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
}): Promise<{ delivered: boolean }> {
  if (!env.RESEND_API_KEY) {
    console.log(`[mail] (not configured) To: ${opts.to}\nSubject: ${opts.subject}\n${opts.text}`);
    return { delivered: false };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM ?? "Repurpose <onboarding@resend.dev>",
      to: [opts.to],
      subject: opts.subject,
      text: opts.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Email send failed (${res.status}): ${body.slice(0, 200)}`);
  }
  return { delivered: true };
}
