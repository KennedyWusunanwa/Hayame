import { EarningsChart } from "@/components/dashboard/earnings-chart";
import { HostStatTile } from "@/components/dashboard/host-stat-tile";
import { CheckCircle2, Clock3, WalletCards } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { HostPageHeader } from "@/components/dashboard/host-page-header";

const payouts = [
  { month: "Aug", amount: 5200, status: "paid" },
  { month: "Sep", amount: 6100, status: "paid" },
  { month: "Oct", amount: 6800, status: "paid" },
  { month: "Nov", amount: 7600, status: "pending" },
];

const earningsSeries = payouts.map((p) => ({
  month: p.month,
  earnings: p.amount,
}));

export default function EarningsPage() {
  return (
    <div className="space-y-6">
      <HostPageHeader
        eyebrow="Earnings"
        title="Payouts overview"
        description="What you have earned, what is pending and how it trends month to month."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        <HostStatTile label="Total earned" value={formatCurrency(25700)} icon={WalletCards} tone="green" />
        <HostStatTile label="Pending" value={formatCurrency(7600)} icon={Clock3} tone="amber" />
        <HostStatTile label="Completed trips" value="48" icon={CheckCircle2} tone="blue" className="col-span-2 md:col-span-1" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue trend</CardTitle>
        </CardHeader>
        <CardContent>
          <EarningsChart data={earningsSeries} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payout history</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((payout) => (
                <TableRow key={payout.month}>
                  <TableCell>{payout.month}</TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        payout.status === "paid"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {payout.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(payout.amount)}
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
