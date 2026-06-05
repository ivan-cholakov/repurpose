"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface TeamInfo {
  name: string;
  role: "owner" | "member";
  inviteCode: string | null;
  members: Array<{ id: string; email: string }>;
}

interface Props {
  email: string;
  planName: string;
  hasPassword: boolean;
  voiceNotes: string;
  team: TeamInfo | null;
}

export default function SettingsClient(props: Props) {
  return (
    <div className="mx-auto max-w-2xl space-y-10 px-6 py-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Signed in as {props.email} · {props.planName} plan
        </p>
      </div>

      <VoiceNotes initial={props.voiceNotes} />
      <TeamSection team={props.team} />
      <ChangeEmail current={props.email} />
      {props.hasPassword && <ChangePassword />}
      <DeleteAccount hasPassword={props.hasPassword} />
    </div>
  );
}

function Section(props: { title: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <section
      className={`rounded-2xl border p-5 ${
        props.danger ? "border-red-300 dark:border-red-900" : "border-gray-200 dark:border-gray-800"
      }`}
    >
      <h2 className={`text-sm font-semibold ${props.danger ? "text-red-600" : ""}`}>
        {props.title}
      </h2>
      {props.children}
    </section>
  );
}

const inputCls =
  "mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black dark:border-gray-700 dark:bg-transparent dark:focus:border-white";
const buttonCls =
  "rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200";

function VoiceNotes({ initial }: { initial: string }) {
  const [notes, setNotes] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch("/api/account/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceNotes: notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.error ?? "Could not save voice notes." });
        return;
      }
      setMsg({ ok: true, text: "Voice notes saved." });
    } catch {
      setMsg({ ok: false, text: "Network error. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title="Voice & style">
      <p className="mt-2 text-sm text-gray-500">
        Describe how you write — tone, quirks, phrases you use or avoid. Every repurpose is steered
        by these notes so the output sounds like you.
      </p>
      <form onSubmit={submit} className="mt-3 space-y-3">
        <div>
          <label htmlFor="voice-notes" className="sr-only">
            Voice notes
          </label>
          <textarea
            id="voice-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="e.g. Direct and a little contrarian. Short sentences. First person. No emojis, no corporate buzzwords. I sign off threads with a question."
            className={`${inputCls} resize-y`}
          />
          <div className="mt-1 text-right text-xs text-gray-400">{notes.length} / 2,000</div>
        </div>
        <button type="submit" disabled={busy} className={buttonCls}>
          {busy ? "…" : "Save voice notes"}
        </button>
        {msg && (
          <p className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>
        )}
      </form>
    </Section>
  );
}

function TeamSection({ team }: { team: TeamInfo | null }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function call(path: string, init?: RequestInit) {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(path, init);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const post = (path: string, body?: unknown) =>
    call(path, {
      method: "POST",
      ...(body !== undefined
        ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
        : {}),
    });

  if (!team) {
    return (
      <Section title="Team">
        <p className="mt-2 text-sm text-gray-500">
          Pool one Pro subscription across your whole team: members repurpose against the
          owner&apos;s plan and limits.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              post("/api/team", { name });
            }}
            className="space-y-2"
          >
            <label htmlFor="team-name" className="text-sm font-medium">
              Create a team
            </label>
            <input
              id="team-name"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Content"
              className={inputCls}
            />
            <button type="submit" disabled={busy} className={buttonCls}>
              {busy ? "…" : "Create team"}
            </button>
          </form>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              post("/api/team/join", { code });
            }}
            className="space-y-2"
          >
            <label htmlFor="team-code" className="text-sm font-medium">
              Join with an invite code
            </label>
            <input
              id="team-code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste invite code"
              className={inputCls}
            />
            <button type="submit" disabled={busy} className={buttonCls}>
              {busy ? "…" : "Join team"}
            </button>
          </form>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </Section>
    );
  }

  return (
    <Section title={`Team · ${team.name}`}>
      <p className="mt-2 text-sm text-gray-500">
        {team.role === "owner"
          ? "Members repurpose against your plan and monthly limit."
          : "You repurpose against this team's shared plan and limit."}
      </p>

      {team.role === "owner" && team.inviteCode && (
        <div className="mt-3">
          <p className="text-sm font-medium">Invite code</p>
          <div className="mt-1 flex items-center gap-2">
            <code className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-800">
              {team.inviteCode}
            </code>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(team.inviteCode ?? "");
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="text-xs font-medium text-gray-500 hover:text-black dark:hover:text-white"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {team.role === "owner" && (
        <div className="mt-4">
          <p className="text-sm font-medium">Members</p>
          {team.members.length === 0 ? (
            <p className="mt-1 text-sm text-gray-400">
              No members yet — share the invite code above.
            </p>
          ) : (
            <ul className="mt-1 space-y-1">
              {team.members.map((m) => (
                <li key={m.id} className="flex items-center justify-between text-sm">
                  <span>{m.email}</span>
                  <button
                    type="button"
                    onClick={() => call(`/api/team/members/${m.id}`, { method: "DELETE" })}
                    className="text-xs font-medium text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-4">
        {team.role === "owner" ? (
          <button
            type="button"
            onClick={() => call("/api/team", { method: "DELETE" })}
            disabled={busy}
            className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            Delete team
          </button>
        ) : (
          <button
            type="button"
            onClick={() => post("/api/team/leave")}
            disabled={busy}
            className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            Leave team
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </Section>
  );
}

function ChangeEmail({ current }: { current: string }) {
  const router = useRouter();
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch("/api/account/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.error ?? "Could not update email." });
        return;
      }
      setMsg({ ok: true, text: "Email updated." });
      setNewEmail("");
      setPassword("");
      router.refresh();
    } catch {
      setMsg({ ok: false, text: "Network error. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title="Email address">
      <form onSubmit={submit} className="mt-3 space-y-3">
        <div>
          <label htmlFor="new-email" className="text-sm">
            New email
          </label>
          <input
            id="new-email"
            type="email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder={current}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="email-password" className="text-sm">
            Current password
          </label>
          <input
            id="email-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
          />
        </div>
        <button type="submit" disabled={busy} className={buttonCls}>
          {busy ? "…" : "Update email"}
        </button>
        {msg && (
          <p className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>
        )}
      </form>
    </Section>
  );
}

function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.error ?? "Could not update password." });
        return;
      }
      setMsg({ ok: true, text: "Password updated." });
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      setMsg({ ok: false, text: "Network error. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title="Password">
      <form onSubmit={submit} className="mt-3 space-y-3">
        <div>
          <label htmlFor="current-password" className="text-sm">
            Current password
          </label>
          <input
            id="current-password"
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="new-password" className="text-sm">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            className={inputCls}
          />
        </div>
        <button type="submit" disabled={busy} className={buttonCls}>
          {busy ? "…" : "Update password"}
        </button>
        {msg && (
          <p className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>
        )}
      </form>
    </Section>
  );
}

function DeleteAccount({ hasPassword }: { hasPassword: boolean }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm, ...(hasPassword ? { password } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not delete account.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title="Delete account" danger>
      <p className="mt-2 text-sm text-gray-500">
        Permanently deletes your account, your generation history, and cancels any active
        subscription. This cannot be undone.
      </p>
      <form onSubmit={submit} className="mt-3 space-y-3">
        {hasPassword && (
          <div>
            <label htmlFor="delete-password" className="text-sm">
              Password
            </label>
            <input
              id="delete-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
          </div>
        )}
        <div>
          <label htmlFor="delete-confirm" className="text-sm">
            Type <span className="font-mono font-semibold">DELETE</span> to confirm
          </label>
          <input
            id="delete-confirm"
            type="text"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputCls}
          />
        </div>
        <button
          type="submit"
          disabled={busy || confirm !== "DELETE"}
          className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {busy ? "…" : "Delete my account"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </Section>
  );
}
