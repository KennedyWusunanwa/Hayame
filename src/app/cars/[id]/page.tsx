import { redirect } from "next/navigation";

export default function CarDetailRedirect({ params }: { params: { id: string } }) {
  redirect(`/vehicle-details/${params.id}`);
}
