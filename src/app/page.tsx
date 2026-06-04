import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { PLANS } from "@/lib/plans";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex-1">
      {/* Nav */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-lg font-semibold tracking-tight">Repurpose</span>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/login" className="text-gray-600 hover:text-black dark:text-gray-300">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-black px-4 py-2 font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            Start free
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-12 text-center">
        <p className="mb-4 inline-block rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-500 dark:border-gray-700">
          Powered by Claude
        </p>
        <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl">
          Turn one post into ten.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-gray-600 dark:text-gray-300">
          Paste a blog post, transcript, or rough draft. Get a polished X thread, LinkedIn post,
          newsletter blurb, and TL;DR in seconds — in your voice.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-full bg-black px-6 py-3 font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            Start free — no card needed
          </Link>
        </div>
        <p className="mt-3 text-sm text-gray-500">{PLANS.free.monthlyLimit} free repurposes / month</p>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { n: "1", t: "Paste", d: "Drop in any long-form content — an article, a transcript, notes." },
            { n: "2", t: "Pick formats", d: "Choose the channels you want: thread, LinkedIn, newsletter, TL;DR." },
            { n: "3", t: "Ship", d: "Copy polished, on-message output and post it. That's it." },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl border border-gray-200 p-6 dark:border-gray-800">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-black text-sm font-semibold text-white dark:bg-white dark:text-black">
                {s.n}
              </div>
              <h3 className="font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="text-center text-3xl font-bold tracking-tight">Simple pricing</h2>
        <div className="mx-auto mt-10 grid max-w-3xl gap-6 sm:grid-cols-2">
          <div className="rounded-3xl border border-gray-200 p-8 dark:border-gray-800">
            <h3 className="text-lg font-semibold">Free</h3>
            <p className="mt-2 text-4xl font-bold">€0</p>
            <ul className="mt-6 space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>✓ {PLANS.free.monthlyLimit} repurposes / month</li>
              <li>✓ All output formats</li>
              <li>✓ Up to {PLANS.free.maxInputChars.toLocaleString()} characters per input</li>
            </ul>
            <Link
              href="/signup"
              className="mt-8 block rounded-full border border-black py-2.5 text-center font-medium hover:bg-gray-50 dark:border-white dark:hover:bg-gray-900"
            >
              Get started
            </Link>
          </div>
          <div className="rounded-3xl border-2 border-black p-8 dark:border-white">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Pro</h3>
              <span className="rounded-full bg-black px-2.5 py-0.5 text-xs font-medium text-white dark:bg-white dark:text-black">
                Most popular
              </span>
            </div>
            <p className="mt-2 text-4xl font-bold">
              €19<span className="text-base font-normal text-gray-500">/mo</span>
            </p>
            <ul className="mt-6 space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>✓ {PLANS.pro.monthlyLimit} repurposes / month</li>
              <li>✓ All output formats</li>
              <li>✓ Up to {PLANS.pro.maxInputChars.toLocaleString()} characters per input</li>
              <li>✓ Priority generation</li>
            </ul>
            <Link
              href="/signup"
              className="mt-8 block rounded-full bg-black py-2.5 text-center font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              Start free, upgrade anytime
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-5xl px-6 py-10 text-center text-sm text-gray-400">
        © Repurpose. Built with Next.js + Claude.
      </footer>
    </main>
  );
}
