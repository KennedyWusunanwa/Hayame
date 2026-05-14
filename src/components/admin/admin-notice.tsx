import { cn } from "@/lib/utils";

type AdminNoticeProps = {
  tone: "success" | "error" | "info";
  title: string;
  description?: string | null;
  className?: string;
};

const toneStyles: Record<AdminNoticeProps["tone"], string> = {
  success: "border-brand/25 bg-brand/10 text-foreground",
  error: "border-red-200 bg-red-50 text-red-900",
  info: "border-sky-200 bg-sky-50 text-sky-900",
};

export function AdminNotice({
  tone,
  title,
  description,
  className,
}: AdminNoticeProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded-xl border px-4 py-3", toneStyles[tone], className)}
    >
      <p className="text-sm font-semibold">{title}</p>
      {description ? (
        <p className="mt-1 text-sm opacity-90">{description}</p>
      ) : null}
    </div>
  );
}
