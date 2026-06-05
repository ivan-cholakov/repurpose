"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Client-safe list of formats (must match ids in src/lib/repurpose.ts).
const FORMAT_OPTIONS = [
  { id: "thread", label: "X / Twitter thread" },
  { id: "linkedin", label: "LinkedIn post" },
  { id: "newsletter", label: "Newsletter blurb" },
  { id: "tldr", label: "TL;DR summary" },
  { id: "instagram", label: "Instagram caption" },
  { id: "youtube", label: "YouTube description" },
] as const;

// One-click sample so first-time users see what the tool does before spending credits.
const SAMPLE = `Most people think productivity is about doing more things faster. It isn't. After years of chasing every new app and framework, I realized the real lever is subtraction: ruthlessly cutting the work that doesn't matter so the work that does has room to breathe.

Three shifts changed everything for me. First, I started each day by writing down the single outcome that would make the day a win — not a list of ten tasks, just one. Second, I batched shallow work (email, Slack, admin) into two fixed windows instead of letting it bleed across the whole day. Third, I built a weekly review where I delete commitments, not just add them.

The result wasn't that I did more. It's that I did less, but the few things I shipped actually mattered. Busyness is a form of laziness — it lets you avoid the hard question of what's worth doing at all.`;

interface Result {
  format: string;
  label: string;
  content: string;
}

interface Props {
  email: string;
  planId: "free" | "pro";
  planName: string;
  used: number;
  limit: number;
  maxInputChars: number;
  billingEnabled: boolean;
  hasCustomer: boolean;
  justUpgraded: boolean;
}

export default function DashboardClient(props: Props) {
  const router = useRouter();
  const [source, setSource] = useState("");
  const [selected, setSelected] = useState<string[]>(["thread", "linkedin"]);
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [used, setUsed] = useState(props.used);
  const [busyBilling, setBusyBilling] = useState(false);

  const remaining = Math.max(0, props.limit - used);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function onGenerate() {
    setError(null);
    setResults([]);
    if (source.trim().length < 50) {
      setError("Please paste at least 50 characters.");
      return;
    }
    if (selected.length === 0) {
      setError("Select at least one format.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/repurpose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, formats: selected }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Generation failed.");
        return;
      }
      setResults(data.results);
      if (data.usage) setUsed(data.usage.used);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function startBilling(endpoint: "checkout" | "portal") {
    setBusyBilling(true);
    try {
      const res = await fetch(`/api/stripe/${endpoint}`, { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Could not open billing.");
      }
    } catch {
      setError("Could not reach billing.");
    } finally {
      setBusyBilling(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex-1">
      {/* Top bar */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="font-semibold tracking-tight">Repurpose</span>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">{props.email}</span>
            <span className="rounded-full border border-gray-300 px-2.5 py-0.5 text-xs font-medium dark:border-gray-700">
              {props.planName}
            </span>
            <button
              type="button"
              onClick={logout}
              className="text-gray-500 hover:text-black dark:hover:text-white"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {props.justUpgraded && (
          <div className="mb-6 rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
            You&apos;re on Pro now. Thanks for the support!
          </div>
        )}

        {/* Usage + upgrade */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
          <div className="text-sm">
            <span className="font-medium">{remaining}</span> of {props.limit} repurposes left this
            month
          </div>
          {props.planId === "free" ? (
            <button
              type="button"
              onClick={() => startBilling("checkout")}
              disabled={busyBilling || !props.billingEnabled}
              title={props.billingEnabled ? "" : "Billing not configured yet"}
              className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              {busyBilling ? "…" : "Upgrade to Pro"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => startBilling("portal")}
              disabled={busyBilling || !props.hasCustomer}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-900"
            >
              {busyBilling ? "…" : "Manage billing"}
            </button>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Input */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="source-content" className="block text-sm font-medium">
                Source content
              </label>
              <button
                type="button"
                onClick={() => setSource(SAMPLE)}
                className="text-xs font-medium text-gray-500 underline hover:text-black dark:hover:text-white"
              >
                Load sample
              </button>
            </div>
            <textarea
              id="source-content"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              maxLength={props.maxInputChars}
              rows={14}
              placeholder="Paste your blog post, transcript, or draft here…"
              className="mt-2 w-full resize-y rounded-xl border border-gray-300 p-3 text-sm outline-none focus:border-black dark:border-gray-700 dark:bg-transparent dark:focus:border-white"
            />
            <div className="mt-1 text-right text-xs text-gray-400">
              {source.length.toLocaleString()} / {props.maxInputChars.toLocaleString()}
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium">Output formats</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {FORMAT_OPTIONS.map((f) => {
                  const on = selected.includes(f.id);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggle(f.id)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition ${
                        on
                          ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                          : "border-gray-300 hover:border-gray-500 dark:border-gray-700"
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={onGenerate}
              disabled={loading || remaining === 0}
              className="mt-5 w-full rounded-xl bg-black py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              {loading ? "Repurposing…" : remaining === 0 ? "Monthly limit reached" : "Repurpose"}
            </button>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            {remaining === 0 && props.planId === "free" && (
              <p className="mt-2 text-sm text-gray-500">
                Upgrade to Pro for {props.limit < 500 ? "500" : props.limit} repurposes a month.
              </p>
            )}
          </div>

          {/* Output */}
          <div className="space-y-4">
            {results.length === 0 && !loading && (
              <div className="flex h-full min-h-48 items-center justify-center rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400 dark:border-gray-700">
                Your repurposed content will appear here.
              </div>
            )}
            {loading && (
              <div className="flex h-full min-h-48 items-center justify-center rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-400 dark:border-gray-700">
                Generating {selected.length} format{selected.length > 1 ? "s" : ""}…
              </div>
            )}
            {results.map((r) => (
              <ResultCard key={r.format} result={r} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function ResultCard({ result }: { result: Result }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2 dark:border-gray-800">
        <span className="text-sm font-medium">{result.label}</span>
        <button
          type="button"
          onClick={copy}
          className="text-xs font-medium text-gray-500 hover:text-black dark:hover:text-white"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="whitespace-pre-wrap p-4 text-sm font-sans leading-relaxed">
        {result.content}
      </pre>
    </div>
  );
}
