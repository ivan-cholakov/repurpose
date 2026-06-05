import "server-only";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/mail";
import { createToken } from "@/lib/tokens";

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Issue a fresh verification token and email the link. Returns the link so
 * dev-mode callers can surface it when no mail provider is configured.
 */
export async function sendVerificationEmail(
  userId: string,
  email: string,
): Promise<{ delivered: boolean; link: string }> {
  const raw = await createToken(userId, "email_verify", TTL_MS);
  const link = `${env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${raw}`;
  const { delivered } = await sendEmail({
    to: email,
    subject: "Verify your Repurpose email",
    text: `Welcome to Repurpose!\n\nConfirm this email address by opening the link below (valid for 24 hours):\n${link}\n\nIf you didn't sign up, ignore this email.`,
  });
  return { delivered, link };
}
