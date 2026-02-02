import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UserDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Dashboard</p>
        <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
        <p className="text-sm text-gray-600">Manage your bookings, favorites, and profile.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Bookings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>Review upcoming and past trips.</p>
            <Link className="font-semibold text-brand" href="/dashboard/bookings">
              View bookings
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Favorites</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>See the cars you have saved.</p>
            <Link className="font-semibold text-brand" href="/dashboard/favorites">
              View favorites
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>Update your details and contact info.</p>
            <Link className="font-semibold text-brand" href="/dashboard/profile">
              Edit profile
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
