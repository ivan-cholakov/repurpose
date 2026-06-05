import type { Metadata } from "next";
import Link from "next/link";
import { PLANS } from "@/lib/plans";

// Landing variant A — "Editorial". Ink on paper, hairline rules, marginalia.
// Served via the A/B rewrite in src/proxy.ts; not indexed directly.
export const metadata: Metadata = { robots: { index: false } };

const FORMATS = [
  { n: "I", name: "X thread", note: "hooks in tweet one" },
  { n: "II", name: "LinkedIn post", note: "line breaks that breathe" },
  { n: "III", name: "Newsletter blurb", note: "subject line included" },
  { n: "IV", name: "TL;DR", note: "the gist, honestly" },
  { n: "V", name: "Instagram caption", note: "scroll-stopper first line" },
  { n: "VI", name: "YouTube description", note: "chapters & CTA" },
];

const STEPS = [
  {
    n: "01",
    title: "Paste once",
    body: "A blog post, a transcript, a rough draft — anything long-form you already wrote.",
  },
  {
    n: "02",
    title: "Pick formats",
    body: "Six purpose-tuned prompts, one per format. A thread reads like a thread, not a chopped-up essay.",
  },
  {
    n: "03",
    title: "Publish everywhere",
    body: "Streamed back in seconds, in your voice. Copy, post, done.",
  },
];

export default function LandingEditorial() {
  return (
    <main className="grain flex-1 overflow-x-clip">
      {/* Masthead */}
      <header className="rule-b">
        <div className="mx-auto flex max-w-6xl items-baseline justify-between px-6 py-5">
          <span className="font-display text-2xl font-semibold">Repurpose</span>
          <nav className="flex items-baseline gap-6 text-sm">
            <span className="hidden font-mono text-xs uppercase tracking-widest text-(--ink-soft) sm:inline">
              Powered by Claude
            </span>
            <Link
              href="/login"
              className="underline decoration-(--rule) underline-offset-4 hover:decoration-(--accent)"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="bg-(--ink) px-4 py-2 font-medium text-(--paper) transition-transform hover:-translate-y-0.5"
            >
              Start free
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero — oversized serif, ruled columns, marginalia */}
      <section className="mx-auto grid max-w-6xl gap-10 px-6 pt-20 pb-16 md:grid-cols-[1fr_minmax(0,2.2fr)]">
        <div className="reveal hidden md:block" style={{ "--i": 0 } as React.CSSProperties}>
          <p className="font-mono text-xs uppercase tracking-widest text-(--ink-soft)">
            Vol. 1 — For people
            <br />
            who publish
          </p>
          <div className="rule-t mt-6 pt-4 text-sm leading-relaxed text-(--ink-soft)">
            You already did the hard part. The writing. Repurposing it shouldn't be a second job.
          </div>
        </div>
        <div>
          <h1
            className="reveal font-display text-6xl leading-[0.98] font-semibold sm:text-8xl"
            style={{ "--i": 1 } as React.CSSProperties}
          >
            Turn one post
            <br />
            into <em className="ink-underline not-italic">ten.</em>
          </h1>
          <p
            className="reveal mt-8 max-w-xl text-lg leading-relaxed text-(--ink-soft)"
            style={{ "--i": 2 } as React.CSSProperties}
          >
            Paste a blog post, transcript, or rough draft. Get a polished X thread, LinkedIn post,
            newsletter blurb, and TL;DR in seconds — in your voice, faithful to what you actually
            said.
          </p>
          <div
            className="reveal mt-10 flex flex-wrap items-center gap-5"
            style={{ "--i": 3 } as React.CSSProperties}
          >
            <Link
              href="/signup"
              className="bg-(--accent) px-7 py-3.5 font-medium text-[#fff8f0] shadow-[4px_4px_0_var(--ink)] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_var(--ink)]"
            >
              Start free — no card needed
            </Link>
            <span className="font-mono text-xs uppercase tracking-widest text-(--ink-soft)">
              5 repurposes / month, free
            </span>
          </div>
        </div>
      </section>

      {/* Formats — clippings desk */}
      <section className="rule-t">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <p className="font-mono text-xs uppercase tracking-widest text-(--ink-soft)">
            Six formats, each with its own tuned prompt
          </p>
          <div className="mt-8 grid gap-px bg-(--rule) sm:grid-cols-2 lg:grid-cols-3">
            {FORMATS.map((f, i) => (
              <article
                key={f.name}
                className="group bg-(--paper) p-6 transition-colors hover:bg-(--accent-soft)"
              >
                <span className="font-display text-sm italic text-(--accent)">{f.n}</span>
                <h3 className="font-display mt-2 text-2xl">{f.name}</h3>
                <p className="mt-1 text-sm text-(--ink-soft)">{f.note}</p>
                <div
                  className="mt-4 h-px w-8 bg-(--accent) transition-all duration-300 group-hover:w-full"
                  aria-hidden
                />
                <span className="sr-only">{`format ${i + 1}`}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — numbered marginalia */}
      <section className="rule-t">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-10 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="relative pt-10">
                <span className="font-display absolute -top-2 left-0 text-6xl italic text-(--rule)">
                  {s.n}
                </span>
                <h3 className="font-display relative text-2xl">{s.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-(--ink-soft)">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing — rate card */}
      <section className="rule-t">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-display text-4xl">Simple pricing</h2>
          <div className="mt-10 grid gap-px bg-(--rule) md:grid-cols-2">
            <div className="bg-(--paper) p-8">
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-2xl">Free</h3>
                <p className="font-display text-5xl">€0</p>
              </div>
              <ul className="rule-t mt-6 space-y-3 pt-6 text-sm text-(--ink-soft)">
                <li>{PLANS.free.monthlyLimit} repurposes / month</li>
                <li>All six output formats</li>
                <li>Up to {PLANS.free.maxInputChars.toLocaleString()} characters per input</li>
              </ul>
              <Link
                href="/signup"
                className="mt-8 block border border-(--ink) py-3 text-center font-medium transition-colors hover:bg-(--ink) hover:text-(--paper)"
              >
                Get started
              </Link>
            </div>
            <div className="relative bg-(--ink) p-8 text-(--paper)">
              <span className="absolute -top-3 right-6 bg-(--accent) px-3 py-1 font-mono text-xs uppercase tracking-widest text-[#fff8f0]">
                Most popular
              </span>
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-2xl">Pro</h3>
                <p className="font-display text-5xl">
                  €19<span className="text-lg opacity-60">/mo</span>
                </p>
              </div>
              <p className="mt-1 text-right text-sm opacity-60">or €190/yr — 2 months free</p>
              <ul className="mt-6 space-y-3 border-t border-[rgba(246,241,231,0.2)] pt-6 text-sm opacity-80">
                <li>{PLANS.pro.monthlyLimit} repurposes / month</li>
                <li>All six output formats + your voice notes</li>
                <li>Up to {PLANS.pro.maxInputChars.toLocaleString()} characters per input</li>
                <li>Team seats with a shared pool</li>
              </ul>
              <Link
                href="/signup"
                className="mt-8 block bg-(--accent) py-3 text-center font-medium text-[#fff8f0] transition-transform hover:-translate-y-0.5"
              >
                Start free, upgrade anytime
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Colophon */}
      <footer className="rule-t">
        <div className="mx-auto flex max-w-6xl items-baseline justify-between px-6 py-8 font-mono text-xs uppercase tracking-widest text-(--ink-soft)">
          <span>© Repurpose</span>
          <span>Set in Fraunces & Schibsted Grotesk · Powered by Claude</span>
        </div>
      </footer>
    </main>
  );
}
