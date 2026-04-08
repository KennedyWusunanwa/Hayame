import { BadgeCheck, IdCard, MailCheck, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Props = {
  idVerified?: boolean | null;
  phoneVerified?: boolean | null;
  emailVerified?: boolean | null;
  className?: string;
};

export function VerificationBadges({
  idVerified,
  phoneVerified,
  emailVerified,
  className,
}: Props) {
  const items = [
    { key: "id", label: "ID", verified: idVerified, Icon: IdCard },
    { key: "phone", label: "Phone", verified: phoneVerified, Icon: Phone },
    { key: "email", label: "Email", verified: emailVerified, Icon: MailCheck },
  ] as const;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {items.map(({ key, label, verified, Icon }) => (
        <Badge
          key={key}
          variant={verified ? "default" : "outline"}
          className={cn(
            "inline-flex items-center gap-1 text-[11px] font-semibold",
            verified
              ? "bg-emerald-600 text-white hover:bg-emerald-600"
              : "text-gray-600",
          )}
        >
          {verified ? (
            <BadgeCheck className="h-3 w-3" />
          ) : (
            <Icon className="h-3 w-3" />
          )}
          {verified ? `${label} Verified` : `${label} Not verified`}
        </Badge>
      ))}
    </div>
  );
}
