"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function VerifyBanner({ email }: { email: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");
  const [devLink, setDevLink] = useState<string | null>(null);

  async function resend() {
    setState("busy");
    try {
      const res = await fetch("/api/auth/verify/resend", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setState("error");
        return;
      }
      setState("sent");
      if (data.devLink) setDevLink(data.devLink);
    } catch {
      setState("error");
    }
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-6 py-2.5 text-sm text-amber-900 dark:text-amber-200">
        <span>
          Please verify <span className="font-medium">{email}</span> — check your inbox for the
          link.
        </span>
        <span className="flex items-center gap-3">
          {devLink && (
            <a href={devLink} className="font-medium underline">
              Dev: open verify link
            </a>
          )}
          {state === "sent" && !devLink && <span>Sent!</span>}
          {state === "error" && <span>Could not send. Try again.</span>}
          <button
            type="button"
            onClick={resend}
            disabled={state === "busy"}
            className="font-medium underline disabled:opacity-50"
          >
            {state === "busy" ? "Sending…" : "Resend link"}
          </button>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="text-amber-700 underline dark:text-amber-400"
            title="Already clicked the link? Refresh."
          >
            I&apos;ve verified
          </button>
        </span>
      </div>
    </div>
  );
}
