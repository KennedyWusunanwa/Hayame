import { cn } from "@/lib/utils";

type Props = {
  label?: string;
  className?: string;
};

export function HostVerificationSeal({
  label = "Verified Host",
  className,
}: Props) {
  return (
    <span
      className={cn(
        "relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-50 ring-1 ring-sky-100 shadow-[0_7px_18px_rgba(14,134,212,0.22)]",
        className,
      )}
      aria-label={label}
      title={label}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-8 w-8 drop-shadow-[0_2px_3px_rgba(7,89,133,0.25)]"
      >
        <path
          d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
          fill="#0e86d4"
        />
        <circle cx="12" cy="12" r="6.15" fill="#0877bd" />
        <path
          d="m8.55 12.15 2.15 2.15 4.85-5"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
