"use client";

import Link from "next/link";
import { useState } from "react";

export interface HistoryItem {
  id: string;
  createdAt: number;
  formats: string[];
  sourceLen: number;
  source: string;
  results: Array<{ format: string; label: string; content: string }>;
}

export default function HistoryClient({ items }: { items: HistoryItem[] }) {
  const [list, setList] = useState(items);
  const [error, setError] = useState<string | null>(null);

  async function remove(id: string) {
    setError(null);
    const res = await fetch(`/api/generations/${id}`, { method: "DELETE" });
    if (res.ok) {
      setList((prev) => prev.filter((g) => g.id !== id));
    } else {
      setError("Could not delete. Please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-xl font-semibold tracking-tight">History</h1>
      <p className="mt-1 text-sm text-gray-500">
        Your past repurposes, newest first. Content is stored so you can come back to it any time.
      </p>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {list.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-400 dark:border-gray-700">
          Nothing here yet.{" "}
          <Link href="/dashboard" className="underline hover:text-black dark:hover:text-white">
            Repurpose something
          </Link>{" "}
          and it will show up here.
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {list.map((item) => (
            <HistoryCard key={item.id} item={item} onDelete={() => remove(item.id)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function HistoryCard({ item, onDelete }: { item: HistoryItem; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const date = new Date(item.createdAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const preview = item.source ? item.source.slice(0, 160) : `(${item.sourceLen} characters)`;

  return (
    <li className="rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-2 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span>{date}</span>
          {item.formats.map((f) => (
            <span
              key={f}
              className="rounded-full border border-gray-300 px-2 py-0.5 dark:border-gray-700"
            >
              {f}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs font-medium">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-gray-500 hover:text-black dark:hover:text-white"
          >
            {open ? "Hide" : "View"}
          </button>
          <button type="button" onClick={onDelete} className="text-red-600 hover:text-red-700">
            Delete
          </button>
        </div>
      </div>

      <p className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
        {preview}
        {item.source.length > 160 ? "…" : ""}
      </p>

      {open && (
        <div className="space-y-3 border-t border-gray-100 p-4 dark:border-gray-800">
          {item.results.length === 0 ? (
            <p className="text-sm text-gray-400">
              Output wasn&apos;t stored for this one (it predates history).
            </p>
          ) : (
            item.results.map((r) => <OutputBlock key={r.format} result={r} />)
          )}
        </div>
      )}
    </li>
  );
}

function OutputBlock({ result }: { result: { format: string; label: string; content: string } }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-1.5 dark:border-gray-800">
        <span className="text-xs font-medium">{result.label}</span>
        <button
          type="button"
          onClick={copy}
          className="text-xs font-medium text-gray-500 hover:text-black dark:hover:text-white"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="whitespace-pre-wrap p-3 text-sm font-sans leading-relaxed">
        {result.content}
      </pre>
    </div>
  );
}
