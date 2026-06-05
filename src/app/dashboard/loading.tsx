// Instant skeleton while the dashboard's server data (user, usage) loads.
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 h-16 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-900" />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="h-72 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-900" />
          <div className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-900" />
        </div>
        <div className="h-48 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-900" />
      </div>
    </div>
  );
}
