// Loading shapes for the admin portal. They render inside the shell (the sidebar
// stays put), so they only draw the page area. Server-safe: no hooks.
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("admin-skel", className)} />;
}

function Shell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite" aria-label={label}>
      {children}
    </div>
  );
}

function Header({ actions = false }: { actions?: boolean }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="space-y-3">
        <Bone className="h-3 w-24" />
        <Bone className="h-8 w-64 max-w-full" />
        <Bone className="h-3.5 w-80 max-w-full" />
      </div>
      {actions ? <Bone className="hidden h-10 w-32 sm:block" /> : null}
    </div>
  );
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border/80 bg-white p-5 shadow-[0_1px_2px_rgba(10,43,84,0.04)] sm:p-6", className)}>
      {children}
    </div>
  );
}

function StatRow() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Panel key={i}>
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <Bone className="h-3.5 w-16" />
              <Bone className="h-8 w-14" />
              <Bone className="h-3 w-28" />
            </div>
            <Bone className="h-10 w-10 rounded-xl" />
          </div>
        </Panel>
      ))}
    </div>
  );
}

function Rows({ count = 6 }: { count?: number }) {
  return (
    <div className="divide-y divide-border/60">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-3.5">
          <div className="flex items-center gap-3">
            <Bone className="h-9 w-9 rounded-full" />
            <div className="space-y-2">
              <Bone className="h-3.5 w-44 max-w-[40vw]" />
              <Bone className="h-3 w-28" />
            </div>
          </div>
          <Bone className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <Shell label="Loading dashboard">
      <Header />
      <StatRow />
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel><Bone className="h-5 w-32" /><div className="mt-4 grid gap-3 sm:grid-cols-3"><Bone className="h-24" /><Bone className="h-24" /><Bone className="h-24" /></div></Panel>
        <Panel><Bone className="h-5 w-36" /><div className="mt-4 space-y-2.5"><Bone className="h-9" /><Bone className="h-9" /><Bone className="h-9" /></div></Panel>
      </div>
      <Panel><Bone className="h-5 w-44" /><Rows count={4} /></Panel>
    </Shell>
  );
}

export function AdminTableSkeleton() {
  return (
    <Shell label="Loading">
      <Header actions />
      <Panel>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Bone className="h-10 lg:col-span-2" /><Bone className="h-10" /><Bone className="h-10" /><Bone className="h-10" /><Bone className="h-10" />
        </div>
      </Panel>
      <Panel className="!p-0 overflow-hidden">
        <div className="border-b border-border/60 bg-gray-50 px-5 py-3"><Bone className="h-3 w-full max-w-md" /></div>
        <div className="px-5"><Rows count={8} /></div>
      </Panel>
    </Shell>
  );
}

export function AdminFormSkeleton() {
  return (
    <Shell label="Loading">
      <Header />
      <Panel>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Bone className="h-3.5 w-20" /><Bone className="h-10" /></div>
          <div className="space-y-2"><Bone className="h-3.5 w-24" /><Bone className="h-10" /></div>
        </div>
        <div className="mt-4 space-y-2"><Bone className="h-3.5 w-12" /><Bone className="h-10" /></div>
        <Bone className="mt-5 h-10 w-44" />
      </Panel>
      <Panel><Bone className="h-5 w-48" /><Rows count={3} /></Panel>
    </Shell>
  );
}

export function AdminCardsSkeleton() {
  return (
    <Shell label="Loading">
      <Header />
      {Array.from({ length: 3 }).map((_, i) => (
        <Panel key={i}>
          <Bone className="h-5 w-40" />
          <div className="mt-4 space-y-3"><Bone className="h-12" /><Bone className="h-12" /><Bone className="h-12 w-4/5" /></div>
        </Panel>
      ))}
    </Shell>
  );
}

export function AdminDesignerSkeleton() {
  return (
    <Shell label="Loading">
      <Header />
      <Bone className="h-16" />
      <Panel>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          <div className="space-y-3"><Bone className="h-14" /><Bone className="h-14" /><Bone className="h-14" /><Bone className="h-10" /><Bone className="h-10" /><Bone className="h-24" /></div>
          <Bone className="h-[560px] rounded-2xl" />
        </div>
      </Panel>
    </Shell>
  );
}

export function AdminDetailSkeleton() {
  return (
    <Shell label="Loading">
      <Header actions />
      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Panel><div className="flex flex-col items-center gap-3"><Bone className="h-24 w-24 rounded-full" /><Bone className="h-5 w-40" /><Bone className="h-3.5 w-52" /></div></Panel>
        <div className="space-y-4"><Panel><Bone className="h-5 w-40" /><div className="mt-4 grid gap-3 sm:grid-cols-2"><Bone className="h-10" /><Bone className="h-10" /><Bone className="h-10" /><Bone className="h-10" /></div></Panel><Panel><Bone className="h-5 w-32" /><Rows count={3} /></Panel></div>
      </div>
    </Shell>
  );
}
