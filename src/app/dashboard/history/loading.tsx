// Instant skeleton while past generations are fetched.
export default function HistoryLoading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="h-7 w-32 animate-pulse rounded bg-gray-100 dark:bg-gray-900" />
      <div className="mt-6 space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-900" />
        ))}
      </div>
    </div>
  );
}
