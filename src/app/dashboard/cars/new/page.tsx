import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CarForm } from "@/components/car-form";

export default function NewCarPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">New car</p>
        <h1 className="text-2xl font-semibold text-foreground">Create listing</h1>
        <p className="text-sm text-gray-600">
          Save the car, then upload photos and set availability from the edit screen.
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
