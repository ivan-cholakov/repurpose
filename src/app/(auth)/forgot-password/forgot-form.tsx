"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form action (not onSubmit): React 19 replays pre-hydration submissions,
  // so this statically-served page never swallows a fast submit.
  async function submit(formData: FormData) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: String(formData.get("email") ?? "") }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setSent(true);
      if (data.devLink) setDevLink(data.devLink);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-sm flex-col justify-center px-6">
      <Link href="/" className="font-display mb-8 text-center text-2xl font-semibold">
        Repurpose
      </Link>
      <h1 className="font-display text-4xl font-semibold">Reset your password</h1>
      <p className="mt-1 text-sm text-gray-500">
        Enter your account email and we&apos;ll send you a reset link.
      </p>

      {sent ? (
        <div className="mt-6 rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
          If an account exists for that email, a reset link is on its way. Check your inbox.
          {devLink && (
            <p className="mt-2">
              Dev mode:{" "}
              <a href={devLink} className="font-medium underline">
                open reset link
              </a>
            </p>
          )}
        </div>
      ) : (
        <form action={submit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 w-full border border-(--rule) bg-transparent px-3 py-2.5 outline-none transition-colors focus:border-(--accent)"
              placeholder="you@example.com"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-(--ink) py-3 font-medium text-(--paper) transition-colors hover:bg-(--accent) hover:text-[#fff8f0] disabled:opacity-60"
          >
            {loading ? "Please wait…" : "Send reset link"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-gray-500">
        Remembered it?{" "}
        <Link href="/login" className="font-medium underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
