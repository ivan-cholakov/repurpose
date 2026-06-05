"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Read from the form itself (not controlled state) so input typed before
    // React hydrates is never lost.
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-sm flex-col justify-center px-6">
      <Link href="/" className="mb-8 text-center text-lg font-semibold tracking-tight">
        Repurpose
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">Choose a new password</h1>

      {done ? (
        <div className="mt-6 rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
          Password updated. Taking you to the login page…
        </div>
      ) : !token ? (
        <div className="mt-6 text-sm text-gray-500">
          This page needs a reset link.{" "}
          <Link href="/forgot-password" className="font-medium underline">
            Request one here.
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium" htmlFor="password">
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black dark:border-gray-700 dark:bg-transparent dark:focus:border-white"
              placeholder="At least 8 characters"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black py-2.5 font-medium text-white hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            {loading ? "Please wait…" : "Set new password"}
          </button>
        </form>
      )}
    </div>
  );
}
