export default function AdminUserLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-10">
      <div className="flex items-center gap-3 text-sm font-semibold text-gray-600">
        <span
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand/30 border-r-transparent"
          aria-hidden="true"
        />
        Opening user profile...
      </div>

      <div className="h-44 animate-pulse rounded-2xl border border-border bg-white" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-96 animate-pulse rounded-2xl border border-border bg-white" />
        <div className="h-96 animate-pulse rounded-2xl border border-border bg-white" />
      </div>
    </div>
  );
}
