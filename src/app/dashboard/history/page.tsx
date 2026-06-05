import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { generations } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import HistoryClient, { type HistoryItem } from "./history-client";

const PAGE_SIZE = 50;

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const rows = await db
    .select()
    .from(generations)
    .where(eq(generations.userId, user.id))
    .orderBy(desc(generations.createdAt))
    .limit(PAGE_SIZE);

  const items: HistoryItem[] = rows.map((row) => {
    let results: HistoryItem["results"] = [];
    try {
      const parsed = JSON.parse(row.results);
      if (Array.isArray(parsed)) results = parsed;
    } catch {
      // Rows from before content was persisted have no results; render metadata only.
    }
    return {
      id: row.id,
      createdAt: row.createdAt.getTime(),
      formats: row.formats.split(",").filter(Boolean),
      sourceLen: row.sourceLen,
      source: row.source,
      results,
    };
  });

  return <HistoryClient items={items} />;
}
