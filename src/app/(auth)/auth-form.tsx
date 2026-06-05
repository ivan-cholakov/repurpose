"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AuthForm({
  mode,
  googleEnabled = false,
}: {
  mode: "login" | "signup";
  googleEnabled?: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
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
      <h1 className="text-2xl font-bold tracking-tight">
        {isSignup ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        {isSignup ? "Start with 5 free repurposes a month." : "Log in to your dashboard."}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black dark:border-gray-700 dark:bg-transparent dark:focus:border-white"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black dark:border-gray-700 dark:bg-transparent dark:focus:border-white"
            placeholder={isSignup ? "At least 8 characters" : "••••••••"}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {!isSignup && (
          <p className="text-right text-sm">
            <Link
              href="/forgot-password"
              className="text-gray-500 underline hover:text-black dark:hover:text-white"
            >
              Forgot password?
            </Link>
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black py-2.5 font-medium text-white hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          {loading ? "Please wait…" : isSignup ? "Create account" : "Log in"}
        </button>
      </form>

      {googleEnabled && (
        <>
          <div className="mt-6 flex items-center gap-3 text-xs text-gray-400">
            <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
            or
            <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
          </div>
          <a
            href="/api/auth/google"
            className="mt-4 block w-full rounded-lg border border-gray-300 py-2.5 text-center font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
          >
            Continue with Google
          </a>
        </>
      )}

      <p className="mt-6 text-center text-sm text-gray-500">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium underline">
              Log in
            </Link>
          </>
        ) : (
          <>
            No account?{" "}
            <Link href="/signup" className="font-medium underline">
              Sign up free
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
