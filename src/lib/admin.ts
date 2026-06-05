import "server-only";
import { env } from "@/lib/env";

/** True when the email is in the comma-separated ADMIN_EMAILS allowlist. */
export function isAdminEmail(email: string): boolean {
  if (!env.ADMIN_EMAILS) return false;
  return env.ADMIN_EMAILS.split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}
