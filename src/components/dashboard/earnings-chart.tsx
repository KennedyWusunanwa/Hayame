"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

type Props = {
  data: { month: string; earnings: number }[];
};

export function EarningsChart({ data }: Props) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorEarn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0e86d4" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#0e86d4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" tickLine={false} axisLine={false} />
          <YAxis
            tickFormatter={(v) => `₵${v}`}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{ borderRadius: 12, borderColor: "#e5e7eb" }}
          />
          <Area
            type="monotone"
            dataKey="earnings"
            stroke="#0e86d4"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorEarn)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
