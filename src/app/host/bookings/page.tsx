import { BookingsTable } from "@/components/dashboard/bookings-table";
import { HostPageHeader } from "@/components/dashboard/host-page-header";

export default function BookingsPage() {
  return (
    <div className="space-y-6">
      <HostPageHeader
        eyebrow="Bookings"
        title="Guest bookings"
        description="Approve paid requests, track upcoming trips and review history."
      />
      <BookingsTable mode="host" />
    </div>
  );
}
