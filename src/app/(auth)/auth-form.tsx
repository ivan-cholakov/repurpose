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
  // Email is controlled so it survives the automatic form reset after a
  // failed attempt; the password intentionally clears.
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  // A form *action* (not onSubmit): React 19 queues submissions that happen
  // before hydration and replays them, so fast typers on slow connections —
  // and the e2e suite — never lose a submit on these statically-served pages.
  async function submit(formData: FormData) {
    const submittedEmail = String(formData.get("email") ?? "");
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: submittedEmail,
          password: String(formData.get("password") ?? ""),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmail(submittedEmail); // keep it through the form reset
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setEmail(submittedEmail);
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
      <h1 className="font-display text-4xl font-semibold">
        {isSignup ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        {isSignup ? "Start with 5 free repurposes a month." : "Log in to your dashboard."}
      </p>

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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-(--rule) bg-transparent px-3 py-2.5 outline-none transition-colors focus:border-(--accent)"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="mt-1 w-full border border-(--rule) bg-transparent px-3 py-2.5 outline-none transition-colors focus:border-(--accent)"
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
          className="w-full bg-(--ink) py-3 font-medium text-(--paper) transition-colors hover:bg-(--accent) hover:text-[#fff8f0] disabled:opacity-60"
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
            className="mt-4 block w-full border border-(--rule) py-3 text-center font-medium transition-colors hover:border-(--accent)"
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
