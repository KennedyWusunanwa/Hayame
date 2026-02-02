import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string | null;
  cars?: { title?: string | null; owner_id?: string | null } | null;
  guest?: { full_name?: string | null } | null;
};

export default async function ReviewsPage() {
  const supabase = await createSupabaseServerClient();
  const supa = supabase as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-primary">Reviews</p>
          <h1 className="text-2xl font-semibold text-foreground">Guest feedback</h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-sm text-gray-600">
            <Link className="font-semibold text-brand" href="/auth/login">
              Sign in
            </Link>{" "}
            to see reviews for your listings.
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data, error } = await supa
    .from("reviews")
    .select(
      "id,rating,comment,created_at, cars:cars!inner(title,owner_id), guest:profiles!reviews_user_id_fkey(full_name)",
    )
    .eq("cars.owner_id", user.id)
    .order("created_at", { ascending: false });
  const reviews = (data as ReviewRow[] | null) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Reviews</p>
        <h1 className="text-2xl font-semibold text-foreground">Guest feedback</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent reviews</CardTitle>
          {error ? <p className="text-sm text-red-600">Unable to load reviews.</p> : null}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Car</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Comment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>{review.cars?.title ?? "Listing"}</TableCell>
                  <TableCell>{review.guest?.full_name ?? "Guest"}</TableCell>
                  <TableCell>{review.rating} / 5</TableCell>
                  <TableCell>{review.comment ?? "No comment"}</TableCell>
                </TableRow>
              ))}
              {reviews.length === 0 && !error ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-gray-600">
                    No reviews on your listings yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
