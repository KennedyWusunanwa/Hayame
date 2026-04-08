import { BookingsTable } from "@/components/dashboard/bookings-table";

export default function BookingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Bookings</p>
        <h1 className="text-2xl font-semibold text-foreground">
          Guest bookings
        </h1>
      </div>
      <BookingsTable mode="host" />
    </div>
  );
}
