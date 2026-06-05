// Instant skeleton while account + team data is fetched.
export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-10 px-6 py-8">
      <div className="h-7 w-40 animate-pulse rounded bg-gray-100 dark:bg-gray-900" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-900" />
      ))}
    </div>
  );
}
