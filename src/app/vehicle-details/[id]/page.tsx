import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function VehicleDetailsRedirect({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/cars/${params.id}`);
}
