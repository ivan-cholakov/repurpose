import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));

  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: { email: normalizedEmail, passwordHash: await hashPassword(password) },
  });

  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
