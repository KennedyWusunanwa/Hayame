import { CheckCircle2, CreditCard, Shield } from "lucide-react";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function HomeMetrics() {
  const metrics = await loadMetrics();

  if (!metrics) {
    return (
      <section className="mx-auto hidden max-w-6xl px-6 md:block">
        <div className="grid gap-3 rounded-2xl border border-border bg-white p-4 shadow-soft sm:grid-cols-3">
          <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-3 text-sm font-semibold text-foreground">
            <CreditCard className="h-4 w-4 text-brand" />
            Secure MoMo &amp; Card payments
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-3 text-sm font-semibold text-foreground">
            <Shield className="h-4 w-4 text-brand" />
            Transparent pricing
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-3 text-sm font-semibold text-foreground">
            <CheckCircle2 className="h-4 w-4 text-brand" />
            Host approval workflow
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto hidden max-w-6xl px-6 md:block">
      <div className="grid gap-3 rounded-2xl border border-border bg-white p-4 shadow-soft sm:grid-cols-3">
        <MetricItem
          label="Cars listed"
          value={metrics.carsCount.toLocaleString()}
        />
        <MetricItem
          label="Bookings recorded"
          value={metrics.bookingsCount.toLocaleString()}
        />
        <MetricItem
          label="Approved hosts"
          value={metrics.hostsCount.toLocaleString()}
        />
      </div>
    </section>
  );
}

function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

async function loadMetrics() {
  try {
    const admin = createSupabaseAdminClient() as any;
    const [
      { count: carsCount },
      { count: bookingsCount },
      { count: hostsCount },
    ] = await Promise.all([
      admin.from("cars").select("id", { count: "exact", head: true }),
      admin.from("bookings").select("id", { count: "exact", head: true }),
      admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("is_host", true),
    ]);

    if (
      typeof carsCount !== "number" ||
      typeof bookingsCount !== "number" ||
      typeof hostsCount !== "number"
    ) {
      return null;
    }
    return { carsCount, bookingsCount, hostsCount };
  } catch {
    return null;
  }
}
