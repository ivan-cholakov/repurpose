import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { destroySession, getCurrentUser, verifyPassword } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { deleteAccountSchema, parseJson } from "@/lib/validation";

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const parsed = await parseJson(req, deleteAccountSchema);
  if (!parsed.ok) return NextResponse.json({ error: parsed.errors[0] }, { status: 400 });

  // Users with a password must confirm it; OAuth-only accounts have none.
  if (user.passwordHash) {
    const password = parsed.data.password ?? "";
    if (!(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 403 });
    }
  }

  // Best-effort: stop billing before the account disappears. Account deletion
  // must not fail because Stripe is unreachable.
  if (user.stripeSubscriptionId) {
    try {
      await getStripe().subscriptions.cancel(user.stripeSubscriptionId);
    } catch {
      // Ignore; the subscription can be cleaned up from the Stripe dashboard.
    }
  }

  await db.delete(users).where(eq(users.id, user.id)); // generations cascade
  await destroySession();
  return NextResponse.json({ ok: true });
}
