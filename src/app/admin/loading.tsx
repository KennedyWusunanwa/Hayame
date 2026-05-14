function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-border/70 bg-white/80 ${className}`}
    />
  );
}

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-[#f5f8fc]">
      <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:py-6">
        <aside className="hidden rounded-2xl border border-border/80 bg-white p-4 shadow-sm lg:block">
          <div className="rounded-2xl bg-primary px-4 py-5">
            <div className="h-3 w-16 rounded-full bg-white/30" />
            <div className="mt-3 h-6 w-36 rounded-full bg-white/40" />
            <div className="mt-4 space-y-2">
              <div className="h-2 w-full rounded-full bg-white/20" />
              <div className="h-2 w-3/4 rounded-full bg-white/20" />
            </div>
          </div>
          <div className="mt-5 space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-11 animate-pulse rounded-xl bg-gray-100"
              />
            ))}
          </div>
        </aside>

        <main className="min-w-0 space-y-6">
          <div className="rounded-2xl border border-border/80 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="h-4 w-24 animate-pulse rounded-full bg-primary/20" />
                <div className="mt-3 h-9 w-64 animate-pulse rounded-full bg-gray-100" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-3 py-2 text-sm font-semibold text-brand">
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-brand/30 border-r-brand"
                    aria-hidden="true"
                  />
                  Loading admin workspace...
                </div>
                <div className="h-10 w-28 animate-pulse rounded-full bg-gray-100" />
                <div className="h-10 w-28 animate-pulse rounded-full bg-gray-100" />
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonBlock key={index} className="h-32" />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-white p-2 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="px-2 py-2">
                <div className="h-3 w-28 animate-pulse rounded-full bg-gray-100" />
                <div className="mt-2 h-3 w-40 animate-pulse rounded-full bg-brand/20" />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <div className="h-10 w-full animate-pulse rounded-xl bg-brand/20 sm:w-28" />
                <div className="h-10 w-full animate-pulse rounded-xl bg-gray-100 sm:w-32" />
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <SkeletonBlock className="h-56" />
            <SkeletonBlock className="h-56" />
          </div>
          <SkeletonBlock className="h-96" />
          <SkeletonBlock className="h-96" />
        </main>
      </div>
    </div>
  );
}
