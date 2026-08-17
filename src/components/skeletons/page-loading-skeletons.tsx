type SkeletonProps = {
  className?: string;
};

function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`} />
  );
}

function LineStack({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={
            index === lines - 1 ? "h-3 w-2/3 max-w-sm" : "h-3 w-full max-w-lg"
          }
        />
      ))}
    </div>
  );
}

function ListingCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-white p-3 shadow-sm">
      <Skeleton className="aspect-[4/3] w-full rounded-xl" />
      <div className="mt-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
    </div>
  );
}

export function ListingGridSkeleton({
  count = 6,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={`grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3 ${className}`}
    >
      {Array.from({ length: count }).map((_, index) => (
        <ListingCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function MarketingPageSkeleton() {
  return (
    <div className="bg-[#f6f7fb]" aria-busy="true" aria-label="Loading page">
      <section className="bg-slate-950 px-6 py-10 sm:py-12 lg:py-14">
        <div className="mx-auto max-w-6xl space-y-5">
          <Skeleton className="h-3 w-40 bg-white/20" />
          <Skeleton className="h-9 w-full max-w-2xl bg-white/25 sm:h-11" />
          <Skeleton className="h-9 w-4/5 max-w-xl bg-white/20 sm:h-10" />
          <Skeleton className="h-11 w-32 rounded-full bg-sky-300/40" />
        </div>
      </section>

      <div className="mx-auto -mt-5 max-w-6xl px-6">
        <div className="rounded-2xl border border-white/20 bg-[#0a2137] p-4 shadow-xl">
          <div className="grid gap-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-12 rounded-full bg-white/15" />
            ))}
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-[1fr,160px]">
            <Skeleton className="h-12 rounded-full bg-white/15" />
            <Skeleton className="h-12 rounded-full bg-sky-300/35" />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-border bg-white p-5 shadow-sm"
            >
              <Skeleton className="h-7 w-20" />
              <Skeleton className="mt-3 h-3 w-32" />
            </div>
          ))}
        </div>
        <div className="mt-10">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-3 h-8 w-72 max-w-full" />
          <ListingGridSkeleton count={4} className="mt-6 xl:grid-cols-4" />
        </div>
      </section>
    </div>
  );
}

export function DownloadPageSkeleton() {
  return (
    <div
      className="overflow-hidden bg-[#f6f9fc]"
      aria-busy="true"
      aria-label="Loading download page"
    >
      <section className="bg-[#06223a] px-6 py-14 sm:py-20 lg:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.04fr_0.96fr] lg:gap-16">
          <div className="space-y-5">
            <Skeleton className="h-7 w-64 rounded-full bg-white/15" />
            <Skeleton className="h-10 w-full max-w-lg bg-white/25" />
            <Skeleton className="h-10 w-4/5 max-w-md bg-white/20" />
            <Skeleton className="h-4 w-full max-w-md bg-white/15" />
            <Skeleton className="h-4 w-3/4 max-w-sm bg-white/15" />
            <div className="flex flex-col gap-3 pt-4 min-[460px]:flex-row">
              <Skeleton className="h-12 w-40 rounded-2xl bg-white/15" />
              <Skeleton className="h-14 w-52 rounded-2xl bg-white/15" />
            </div>
          </div>
          <div className="mx-auto flex w-full max-w-[420px] items-end justify-center gap-4">
            <Skeleton className="aspect-[9/19.5] w-[44%] rounded-[1.75rem] bg-white/10" />
            <Skeleton className="aspect-[9/19.5] w-[44%] translate-y-6 rounded-[1.75rem] bg-white/10" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <Skeleton className="mx-auto h-3 w-48" />
          <Skeleton className="mx-auto h-8 w-full max-w-md" />
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm"
            >
              <Skeleton className="h-11 w-11 rounded-xl" />
              <Skeleton className="mt-5 h-4 w-2/3" />
              <Skeleton className="mt-2 h-3 w-full" />
              <Skeleton className="mt-1 h-3 w-4/5" />
            </div>
          ))}
        </div>
      </section>

      {Array.from({ length: 2 }).map((_, index) => (
        <section key={index} className="mx-auto max-w-6xl px-6 pb-7 sm:pb-10">
          <div className="rounded-[2rem] border border-sky-100 bg-white p-5 shadow-sm sm:p-8">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="mt-3 h-7 w-2/3 max-w-md" />
            <Skeleton className="mt-3 h-4 w-full max-w-lg" />
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, screenIndex) => (
                <Skeleton
                  key={screenIndex}
                  className="aspect-[258/560] w-full rounded-[2rem]"
                />
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="mx-auto max-w-6xl px-6 pb-16 sm:pb-24">
        <div className="grid overflow-hidden rounded-[2rem] bg-[#06223a] lg:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-4 p-6 sm:p-10">
            <Skeleton className="h-12 w-12 rounded-2xl bg-white/15" />
            <Skeleton className="h-7 w-2/3 bg-white/20" />
            <Skeleton className="h-4 w-full bg-white/15" />
            <Skeleton className="h-4 w-4/5 bg-white/15" />
          </div>
          <div className="space-y-5 p-6 sm:p-10">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex gap-4">
                <Skeleton className="h-7 w-7 shrink-0 rounded-full bg-white/20" />
                <Skeleton className="h-4 w-full bg-white/15" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-sky-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-7 px-6 py-14 sm:py-16 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-7 w-64 max-w-full" />
          </div>
          <Skeleton className="h-14 w-52 rounded-2xl" />
        </div>
      </section>
    </div>
  );
}

export function ExplorePageSkeleton() {
  return (
    <div
      className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8"
      aria-busy="true"
      aria-label="Loading explore"
    >
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-12 w-full rounded-full md:hidden" />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[320px,1fr]">
        <aside className="hidden rounded-2xl border border-border bg-white p-5 shadow-sm lg:block">
          <Skeleton className="h-5 w-32" />
          <div className="mt-5 space-y-5">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </aside>

        <div className="grid content-start gap-5">
          <Skeleton className="hidden h-14 rounded-2xl md:block" />
          <Skeleton className="h-44 rounded-2xl sm:h-56 lg:h-64" />
          <ListingGridSkeleton />
        </div>
      </div>
    </div>
  );
}

export function CarDetailPageSkeleton() {
  return (
    <div
      className="mx-auto max-w-6xl px-6 py-10"
      aria-busy="true"
      aria-label="Loading car details"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-full max-w-xl" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="w-full rounded-xl border border-border bg-white p-4 shadow-sm lg:w-44">
          <Skeleton className="ml-auto h-3 w-20" />
          <Skeleton className="ml-auto mt-3 h-8 w-28" />
        </div>
      </div>

      <div className="mt-8 grid gap-x-8 gap-y-6 lg:grid-cols-[1fr,360px]">
        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-[22rem] w-full rounded-xl sm:h-[28rem] lg:h-[34rem]" />
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-20 rounded-lg" />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <Skeleton className="h-6 w-28" />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <Skeleton className="h-6 w-32" />
            <div className="mt-5">
              <LineStack lines={4} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <Skeleton className="h-6 w-28" />
            <div className="mt-5 flex flex-wrap gap-2">
              {Array.from({ length: 10 }).map((_, index) => (
                <Skeleton key={index} className="h-9 w-28 rounded-full" />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <Skeleton className="h-6 w-36" />
            <div className="mt-5 space-y-4">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="flex gap-3">
                  <Skeleton className="h-11 w-11 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <Skeleton className="h-6 w-32" />
            <div className="mt-5 space-y-3">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-11 w-36 rounded-full bg-sky-200" />
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-3 h-4 w-48" />
            <Skeleton className="mt-4 h-8 w-full rounded-full bg-sky-100" />
          </div>

          <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
            <Skeleton className="h-5 w-36" />
            <div className="mt-4 grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, index) => (
                <Skeleton key={index} className="aspect-square rounded-md" />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <Skeleton className="h-6 w-36" />
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
              </div>
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-10 rounded-full" />
                <Skeleton className="h-10 rounded-full" />
              </div>
              <div className="space-y-2 border-t border-border pt-4">
                <div className="flex justify-between gap-4">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="flex justify-between gap-4">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex justify-between gap-4">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
              <Skeleton className="h-12 w-full rounded-full bg-sky-200" />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-4 h-10 w-full rounded-full bg-sky-100" />
          </div>
        </aside>
      </div>
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-border bg-white p-5"
          >
            <Skeleton className="h-5 w-28" />
            <Skeleton className="mt-4 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-2/3" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-white p-5">
        <Skeleton className="h-5 w-36" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AuthPageSkeleton() {
  return (
    <div
      className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center px-6 py-12"
      aria-busy="true"
      aria-label="Loading form"
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-sm">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-3 h-4 w-56" />
        <div className="mt-8 space-y-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
          <Skeleton className="h-11 w-full rounded-xl bg-sky-200" />
        </div>
      </div>
    </div>
  );
}

export function FormPageSkeleton() {
  return (
    <div
      className="mx-auto max-w-3xl px-6 py-10"
      aria-busy="true"
      aria-label="Loading application form"
    >
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-3 h-9 w-72 max-w-full" />
      <Skeleton className="mt-3 h-4 w-full max-w-xl" />
      <div className="mt-6 rounded-xl border border-border bg-white p-6 shadow-sm">
        <Skeleton className="h-6 w-40" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-5 h-28 w-full rounded-xl" />
        <Skeleton className="mt-5 h-11 w-40 rounded-full bg-sky-200" />
      </div>
    </div>
  );
}

export function MessagesPageSkeleton() {
  return (
    <div
      className="mx-auto max-w-6xl px-4 py-8"
      aria-busy="true"
      aria-label="Loading messages"
    >
      <div className="grid gap-6 lg:grid-cols-[340px,1fr]">
        <div className="h-[70vh] rounded-2xl border border-border bg-white shadow-sm">
          <div className="border-b border-border p-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="mt-4 h-11 w-full rounded-xl" />
            <div className="mt-3 flex gap-2">
              <Skeleton className="h-7 w-16 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
          </div>
          <div className="space-y-0">
            {Array.from({ length: 7 }).map((_, index) => (
              <div
                key={index}
                className="flex gap-3 border-b border-border p-4"
              >
                <Skeleton className="h-11 w-11 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="hidden h-[70vh] rounded-2xl border border-border bg-white p-6 shadow-sm lg:block">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <Skeleton className="h-11 w-11 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="mt-6 space-y-4">
            <Skeleton className="h-14 w-2/3 rounded-2xl" />
            <Skeleton className="ml-auto h-14 w-1/2 rounded-2xl bg-sky-100" />
            <Skeleton className="h-20 w-3/4 rounded-2xl" />
          </div>
          <Skeleton className="mt-8 h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function ContentPageSkeleton() {
  return (
    <div
      className="mx-auto max-w-4xl px-6 py-10"
      aria-busy="true"
      aria-label="Loading content"
    >
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-3 h-10 w-full max-w-xl" />
      <Skeleton className="mt-4 h-4 w-full max-w-2xl" />
      <div className="mt-8 space-y-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-border bg-white p-6"
          >
            <Skeleton className="h-6 w-48 max-w-full" />
            <LineStack lines={4} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HostProfilePageSkeleton() {
  return (
    <div
      className="mx-auto max-w-6xl px-6 py-10"
      aria-busy="true"
      aria-label="Loading host profile"
    >
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-56 max-w-full" />
            <Skeleton className="h-4 w-72 max-w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-28 rounded-full" />
            </div>
          </div>
        </div>
      </div>
      <ListingGridSkeleton count={6} className="mt-8" />
    </div>
  );
}

export function AdminWorkspaceSkeleton() {
  return (
    <div
      className="min-h-screen bg-[#f5f8fc]"
      aria-busy="true"
      aria-label="Loading admin"
    >
      <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:py-6">
        <aside className="hidden rounded-2xl border border-border bg-white p-4 shadow-sm lg:block">
          <Skeleton className="h-28 w-full rounded-2xl bg-sky-100" />
          <div className="mt-5 space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-11 w-full rounded-xl" />
            ))}
          </div>
        </aside>
        <main className="min-w-0 space-y-6">
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="space-y-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-9 w-72 max-w-full" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-10 w-28 rounded-full" />
                <Skeleton className="h-10 w-32 rounded-full" />
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-32 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </main>
      </div>
    </div>
  );
}

function navigationSkeletonForPath(path?: string | null) {
  if (!path) return <MarketingPageSkeleton />;
  if (path.startsWith("/explore")) return <ExplorePageSkeleton />;
  if (path.startsWith("/cars/") || path.startsWith("/vehicle-details/")) {
    return <CarDetailPageSkeleton />;
  }
  if (path.startsWith("/dashboard") || path.startsWith("/host")) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <DashboardPageSkeleton />
      </div>
    );
  }
  if (path.startsWith("/admin")) return <AdminWorkspaceSkeleton />;
  if (path.startsWith("/auth")) return <AuthPageSkeleton />;
  if (path.startsWith("/become-host")) return <FormPageSkeleton />;
  if (path.startsWith("/messages")) return <MessagesPageSkeleton />;
  if (path.startsWith("/hosts/")) return <HostProfilePageSkeleton />;
  if (path.startsWith("/download")) return <DownloadPageSkeleton />;
  if (
    path.startsWith("/privacy") ||
    path.startsWith("/protection") ||
    path.startsWith("/cancellation") ||
    path.startsWith("/rent-a-car-accra") ||
    path.startsWith("/airport-car-rental-accra") ||
    path.startsWith("/cheap-car-rental-ghana") ||
    path.startsWith("/list-your-car-ghana") ||
    path.startsWith("/peer-to-peer-car-rental-ghana") ||
    path.startsWith("/suv-rental-ghana")
  ) {
    return <ContentPageSkeleton />;
  }
  return <MarketingPageSkeleton />;
}

export function NavigationSkeletonOverlay({
  path,
  dismissing = false,
}: {
  path?: string | null;
  dismissing?: boolean;
}) {
  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto bg-white/95 backdrop-blur-sm transition-opacity duration-200 ease-out ${
        dismissing ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Skeleton className="h-12 w-36" />
          <div className="hidden items-center gap-4 md:flex">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-28 rounded-full" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full md:hidden" />
        </div>
      </div>
      {navigationSkeletonForPath(path)}
    </div>
  );
}
