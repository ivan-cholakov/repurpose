import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";
import { sendVerificationEmail } from "@/lib/verification";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.emailVerifiedAt) {
    return NextResponse.json({ error: "Your email is already verified." }, { status: 400 });
  }
  if (!rateLimit(`resend:${clientIp(req)}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json(tooMany, { status: 429 });
  }

  const { delivered, link } = await sendVerificationEmail(user.id, user.email);

  // Local dev without a mail provider: hand the link back so the flow works.
  if (!delivered && process.env.NODE_ENV !== "production") {
    return NextResponse.json({ ok: true, devLink: link });
  }
  return NextResponse.json({ ok: true });
}
