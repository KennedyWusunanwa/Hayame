import { cn } from "@/lib/utils";

type Props = {
  status?: string;
  startDate?: string;
  endDate?: string;
};

const steps = ["Pending", "Confirmed", "Ongoing", "Completed"];

export function TripStatusTracker({ status, startDate, endDate }: Props) {
  const normalized = (status ?? "").toLowerCase();

  if (["cancelled", "rejected", "refunded"].includes(normalized)) {
    return (
      <div className="mt-1 flex items-center gap-2 text-[10px]">
        <span className="rounded-full bg-red-50 px-2 py-1 font-semibold text-red-700">Cancelled</span>
      </div>
    );
  }

  const activeIndex = getActiveIndex(normalized, startDate, endDate);

  return (
    <div className="mt-1 grid grid-cols-4 gap-1 text-[10px]">
      {steps.map((step, index) => (
        <span
          key={step}
          className={cn(
            "rounded-full px-2 py-1 text-center font-semibold",
            index < activeIndex && "bg-emerald-50 text-emerald-700",
            index === activeIndex && "bg-brand/10 text-brand",
            index > activeIndex && "bg-gray-100 text-gray-500",
          )}
        >
          {step}
        </span>
      ))}
    </div>
  );
}

function getActiveIndex(status: string, startDate?: string, endDate?: string) {
  if (status === "completed") return 3;
  if (status === "confirmed") {
    const now = new Date();
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    const validStart = !!start && !Number.isNaN(start.getTime());
    const validEnd = !!end && !Number.isNaN(end.getTime());
    if (validStart && validEnd && now >= start! && now < end!) {
      return 2;
    }
    return 1;
  }
  if (status === "awaiting_host") return 0;
  if (status === "pending") return 0;
  return 0;
}
