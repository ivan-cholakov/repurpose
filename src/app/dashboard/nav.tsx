"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Repurpose" },
  { href: "/dashboard/history", label: "History" },
  { href: "/dashboard/settings", label: "Settings" },
] as const;

export default function DashboardNav({ email, planName }: { email: string; planName: string }) {
  const router = useRouter();
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div className="flex items-center gap-6">
          <span className="font-semibold tracking-tight">Repurpose</span>
          <nav className="flex items-center gap-4 text-sm">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={
                  pathname === l.href
                    ? "font-medium text-black dark:text-white"
                    : "text-gray-500 hover:text-black dark:hover:text-white"
                }
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">{email}</span>
          <span className="rounded-full border border-gray-300 px-2.5 py-0.5 text-xs font-medium dark:border-gray-700">
            {planName}
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
  );
}
