import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  show: boolean;
  label?: string;
  className?: string;
};

export function VerifiedHostIndicator({
  show,
  label = "Verified Host",
  className,
}: Props) {
  if (!show) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold text-brand",
        className,
      )}
      aria-label="Verified host"
      title="Verified host"
    >
      <BadgeCheck className="h-4 w-4 text-brand" />
      {label}
    </span>
  );
}
