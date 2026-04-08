import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CarForm } from "@/components/car-form";

export default function NewCarPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">New car</p>
        <h1 className="text-2xl font-semibold text-foreground">
          Create listing
        </h1>
        <p className="text-sm text-gray-600">
          Add up to 7 photos (5+ recommended for faster approval) and complete
          key details before saving. New listings go to admin approval before
          they appear publicly.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Car details</CardTitle>
        </CardHeader>
        <CardContent>
          <CarForm />
        </CardContent>
      </Card>
    </div>
  );
}
