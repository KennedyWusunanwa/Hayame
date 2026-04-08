export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-10">
      <div className="flex items-center gap-3 text-sm font-semibold text-gray-600">
        <span
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand/30 border-r-transparent"
          aria-hidden="true"
        />
        Loading admin workspace...
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl border border-border bg-white"
          />
        ))}
      </div>

      <div className="h-80 animate-pulse rounded-2xl border border-border bg-white" />
      <div className="h-80 animate-pulse rounded-2xl border border-border bg-white" />
    </div>
  );
}
