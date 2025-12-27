import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const reviews = [
  { id: "r1", car: "Toyota RAV4", guest: "Adwoa", rating: 5, comment: "Clean car, smooth pickup." },
  { id: "r2", car: "Mercedes C300", guest: "Kojo", rating: 4, comment: "Great ride, flexible timing." },
  { id: "r3", car: "Honda Fit", guest: "Efua", rating: 4, comment: "Perfect for city errands." },
];

export default function ReviewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Reviews</p>
        <h1 className="text-2xl font-semibold text-foreground">Guest feedback</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent reviews</CardTitle>
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
                  <TableCell>{review.car}</TableCell>
                  <TableCell>{review.guest}</TableCell>
                  <TableCell>{review.rating} / 5</TableCell>
                  <TableCell>{review.comment}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
