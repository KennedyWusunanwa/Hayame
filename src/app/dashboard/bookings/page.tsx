import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

const bookings = [
  { id: "b1", car: "Toyota RAV4", guest: "Ama K.", start: "2025-12-24", end: "2025-12-27", status: "pending", total: 2400 },
  { id: "b2", car: "Mercedes C300", guest: "Kojo L.", start: "2026-01-03", end: "2026-01-06", status: "confirmed", total: 4050 },
  { id: "b3", car: "Honda Fit", guest: "Efua A.", start: "2026-01-10", end: "2026-01-12", status: "completed", total: 620 },
];

export default function BookingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Bookings</p>
        <h1 className="text-2xl font-semibold text-foreground">Guest bookings</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Car</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>{booking.car}</TableCell>
                  <TableCell>{booking.guest}</TableCell>
                  <TableCell>
                    {booking.start} - {booking.end}
                  </TableCell>
                  <TableCell>
                    <Badge variant={booking.status === "confirmed" ? "default" : "muted"}>
                      {booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(booking.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
