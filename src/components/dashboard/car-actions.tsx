"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  carId: string;
};

export function CarActions({ carId }: Props) {
  const router = useRouter();
  const remove = async () => {
    const confirmed = window.confirm("Delete this car? This cannot be undone.");
    if (!confirmed) return;
    const res = await fetch(`/api/cars/${carId}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      alert("Unable to delete car. Please try again.");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/dashboard/cars/${carId}/edit`}>
          <Pencil className="h-4 w-4" />
        </Link>
      </Button>
      <Button variant="ghost" size="sm" onClick={remove}>
        <Trash className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  );
}
