import type { Metadata } from "next";
import Link from "next/link";
import { PLANS } from "@/lib/plans";

// Landing variant B — "Darkroom". Ink-black, chartreuse phosphor, the product
// as a pipeline. Served via the A/B rewrite in src/proxy.ts; not indexed.
export const metadata: Metadata = { robots: { index: false } };

const INK = "#0e0d0a";
const PHOSPHOR = "var(--chartreuse)";

const OUTPUTS = [
  "X thread",
  "LinkedIn post",
  "Newsletter blurb",
  "TL;DR",
  "Instagram caption",
  "YouTube description",
];

export default function LandingDarkroom() {
  return (
    <main className="flex-1 overflow-x-clip" style={{ background: INK, color: "#f1ead9" }}>
      {/* Nav */}
      <header className="border-b border-[rgba(241,234,217,0.14)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="font-mono text-sm tracking-widest uppercase">
            Repurpose<span style={{ color: PHOSPHOR }}>_</span>
          </span>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/login" className="opacity-70 transition-opacity hover:opacity-100">
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 font-medium transition-transform hover:-translate-y-0.5"
              style={{ background: PHOSPHOR, color: INK }}
            >
              Start free
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-24 pb-14">
        <p
          className="reveal font-mono text-xs uppercase tracking-[0.3em]"
          style={{ "--i": 0, color: PHOSPHOR } as React.CSSProperties}
        >
          input: 1 — output: 10 · Powered by Claude
        </p>
        <h1
          className="reveal font-display mt-6 max-w-4xl text-6xl leading-[0.95] font-semibold sm:text-8xl"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          Turn one post into <span style={{ color: PHOSPHOR }}>ten.</span>
        </h1>
        <p
          className="reveal mt-8 max-w-xl text-lg leading-relaxed opacity-70"
          style={{ "--i": 2 } as React.CSSProperties}
        >
          You already wrote the thing. Paste it once and ship it everywhere — threads, LinkedIn,
          newsletter, captions — streamed back in seconds, in your voice.
        </p>
        <div
          className="reveal mt-10 flex flex-wrap items-center gap-5"
          style={{ "--i": 3 } as React.CSSProperties}
        >
          <Link
            href="/signup"
            className="px-7 py-3.5 font-semibold transition-all hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(216,255,61,0.35)]"
            style={{ background: PHOSPHOR, color: INK }}
          >
            Start free — no card needed
          </Link>
          <span className="font-mono text-xs uppercase tracking-widest opacity-50">
            5 repurposes / month, free
          </span>
        </div>
      </section>

      {/* Pipeline: one source, six outputs on a ticker */}
      <section className="border-y border-[rgba(241,234,217,0.14)] py-10">
        <div className="mx-auto mb-6 flex max-w-6xl items-center gap-4 px-6">
          <div
            className="border px-4 py-3 font-mono text-xs uppercase tracking-widest"
            style={{ borderColor: PHOSPHOR, color: PHOSPHOR }}
          >
            your_draft.md
          </div>
          <div className="h-px flex-1" style={{ background: "rgba(216,255,61,0.4)" }} aria-hidden />
          <span className="font-mono text-xs uppercase tracking-widest opacity-50">becomes →</span>
        </div>
        <div className="overflow-hidden" aria-hidden>
          <div className="ticker flex w-max gap-4 px-6">
            {/* The list is rendered twice so the marquee loops seamlessly. */}
            {(["first", "second"] as const).flatMap((half) =>
              OUTPUTS.map((o) => (
                <span
                  key={`${half}-${o}`}
                  className="border border-[rgba(241,234,217,0.2)] px-5 py-3 font-mono text-sm whitespace-nowrap transition-colors hover:border-[rgba(216,255,61,0.8)]"
                >
                  {o}
                </span>
              )),
            )}
          </div>
        </div>
        <ul className="sr-only">
          {OUTPUTS.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
      </section>

      {/* Three facts, mono-labelled */}
      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-3">
        {[
          [
            "faithful",
            "No engagement-bait slop. Your facts, your stance, your voice notes applied to every format.",
          ],
          [
            "streamed",
            "Output renders as it generates. The slowest part of repurposing is now watching it type.",
          ],
          [
            "pooled",
            "One Pro plan covers your whole team — invite codes, shared limits, personal history.",
          ],
        ].map(([k, v], i) => (
          <div key={k} className="border-t border-[rgba(241,234,217,0.14)] pt-5">
            <span
              className="font-mono text-xs uppercase tracking-[0.3em]"
              style={{ color: PHOSPHOR }}
            >
              0{i + 1} · {k}
            </span>
            <p className="mt-3 text-sm leading-relaxed opacity-70">{v}</p>
          </div>
        ))}
      </section>

      {/* Pricing — tickets */}
      <section className="border-t border-[rgba(241,234,217,0.14)]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-display text-4xl">Simple pricing</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="border border-[rgba(241,234,217,0.2)] p-8">
              <div className="flex items-baseline justify-between">
                <h3 className="font-mono text-sm uppercase tracking-widest opacity-70">Free</h3>
                <p className="font-display text-5xl">€0</p>
              </div>
              <ul className="mt-6 space-y-3 border-t border-dashed border-[rgba(241,234,217,0.2)] pt-6 text-sm opacity-70">
                <li>{PLANS.free.monthlyLimit} repurposes / month</li>
                <li>All six output formats</li>
                <li>Up to {PLANS.free.maxInputChars.toLocaleString()} characters per input</li>
              </ul>
              <Link
                href="/signup"
                className="mt-8 block border border-[rgba(241,234,217,0.4)] py-3 text-center font-medium transition-colors hover:border-[rgba(216,255,61,0.9)]"
              >
                Get started
              </Link>
            </div>
            <div className="relative border p-8" style={{ borderColor: PHOSPHOR }}>
              <span
                className="absolute -top-3 right-6 px-3 py-1 font-mono text-xs uppercase tracking-widest"
                style={{ background: PHOSPHOR, color: INK }}
              >
                Most popular
              </span>
              <div className="flex items-baseline justify-between">
                <h3
                  className="font-mono text-sm uppercase tracking-widest"
                  style={{ color: PHOSPHOR }}
                >
                  Pro
                </h3>
                <p className="font-display text-5xl">
                  €19<span className="text-lg opacity-50">/mo</span>
                </p>
              </div>
              <p className="mt-1 text-right text-sm opacity-50">or €190/yr — 2 months free</p>
              <ul className="mt-6 space-y-3 border-t border-dashed border-[rgba(216,255,61,0.4)] pt-6 text-sm opacity-80">
                <li>{PLANS.pro.monthlyLimit} repurposes / month</li>
                <li>Voice notes on every generation</li>
                <li>Up to {PLANS.pro.maxInputChars.toLocaleString()} characters per input</li>
                <li>Team seats with a shared pool</li>
              </ul>
              <Link
                href="/signup"
                className="mt-8 block py-3 text-center font-semibold transition-transform hover:-translate-y-0.5"
                style={{ background: PHOSPHOR, color: INK }}
              >
                Start free, upgrade anytime
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[rgba(241,234,217,0.14)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 font-mono text-xs uppercase tracking-widest opacity-50">
          <span>© Repurpose</span>
          <span>stdin → stdout, but for content</span>
        </div>
      </footer>
    </main>
  );
}
