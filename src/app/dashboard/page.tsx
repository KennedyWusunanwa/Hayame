import { ArrowUpRight, CalendarClock, CarFront, Wallet } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { EarningsChart } from "@/components/dashboard/earnings-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

const bookings = [
  { car: "Toyota RAV4", guest: "Ama K.", dates: "Dec 24 - Dec 27", payout: 2400, status: "Pending" },
  { car: "Mercedes C300", guest: "Kojo L.", dates: "Jan 3 - Jan 6", payout: 4050, status: "Confirmed" },
  { car: "Honda Fit", guest: "Efua A.", dates: "Jan 10 - Jan 12", payout: 620, status: "Pending" },
];

const earningsSeries = [
  { month: "Jul", earnings: 4200 },
  { month: "Aug", earnings: 5800 },
  { month: "Sep", earnings: 6400 },
  { month: "Oct", earnings: 7000 },
  { month: "Nov", earnings: 7600 },
  { month: "Dec", earnings: 8400 },
];

export default function DashboardHome() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Dashboard</p>
          <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
          <p className="text-sm text-gray-600">Track bookings, cars, and payouts in one place.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-emerald-700">
          <ArrowUpRight className="h-4 w-4" /> Paystack integration coming soon
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active cars" value="8" icon={<CarFront className="h-4 w-4 text-primary" />} />
        <StatCard title="Upcoming trips" value="12" icon={<CalendarClock className="h-4 w-4 text-primary" />} />
        <StatCard title="Pending earnings" value={formatCurrency(12400)} icon={<Wallet className="h-4 w-4 text-primary" />} />
        <StatCard title="Avg. rating" value="4.8 / 5" icon={<ArrowUpRight className="h-4 w-4 text-primary" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Earnings (GHS)</CardTitle>
        </CardHeader>
        <CardContent>
          <EarningsChart data={earningsSeries} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Car</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Payout</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.car + booking.guest}>
                  <TableCell>{booking.car}</TableCell>
                  <TableCell>{booking.guest}</TableCell>
                  <TableCell>{booking.dates}</TableCell>
                  <TableCell>
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                      {booking.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(booking.payout)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
