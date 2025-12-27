import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  title: string;
  value: string;
  icon?: ReactNode;
  description?: string;
};

export function StatCard({ title, value, icon, description }: Props) {
  return (
    <Card className="flex flex-col gap-2 shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between pb-1">
        <CardTitle className="text-sm text-gray-600">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl font-semibold text-foreground">{value}</div>
        {description ? (
          <p className="text-xs text-gray-500">{description}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
