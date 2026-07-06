"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HookLoader } from "@/components/shared/HookLoader";
import { useApiQuery } from "@/lib/query";

const periods = ["Weekly", "Monthly", "Yearly"] as const;

interface SalesTrendPoint {
  day: string;
  newUser: number;
  existingUser: number;
  orders: number;
  revenue: number;
}

interface SalesAnalytics {
  salesTrend?: SalesTrendPoint[];
  salesSummary?: { totalRevenue: number; totalOrders: number; period: string };
}

function money(value = 0) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function axisMoney(value: number) {
  if (value >= 1_000_000) return `₦${Math.round(value / 1_000_000)}m`;
  if (value >= 1_000) return `₦${Math.round(value / 1_000)}k`;
  return `₦${value}`;
}

export default function SalesTrendChart() {
  const [period, setPeriod] = useState<(typeof periods)[number]>("Monthly");
  const periodKey = period.toLowerCase();
  const { data, isLoading, error } = useApiQuery<SalesAnalytics>(["admin", "analytics", periodKey], `/admin/analytics?period=${periodKey}`);
  const trend = data?.salesTrend || [];
  const hasTrend = trend.some((item) => item.revenue > 0);
  const totalRevenue = data?.salesSummary?.totalRevenue || 0;
  const totalOrders = data?.salesSummary?.totalOrders || 0;

  return (
    <Card className="rounded-lg border-zinc-200 py-0 shadow-card">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Sales Trend
          </p>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400">
            <MoreHorizontal size={18} />
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-500">Total Revenue</p>
            <p className="text-3xl font-semibold text-zinc-900">{money(totalRevenue)}</p>
            <p className="mt-1 text-xs text-zinc-400">{totalOrders.toLocaleString()} orders in this view</p>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 text-sm">
            {periods.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "rounded-md px-3 py-1 font-medium transition-colors",
                  period === p
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand-gold" /> New customers
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-zinc-800" /> Existing customers
          </span>
        </div>

        <div className="mt-4 h-[280px] min-h-[280px] min-w-0">
          {isLoading && (
            <div className="flex h-full items-center justify-center rounded-lg border border-zinc-100 bg-zinc-50">
              <HookLoader label="Loading sales trend..." />
            </div>
          )}

          {!isLoading && error && (
            <div className="flex h-full items-center justify-center rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
              Sales trend could not be loaded.
            </div>
          )}

          {!isLoading && !error && !hasTrend && (
            <div className="flex h-full items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-center">
              <div>
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-white text-zinc-400 shadow-sm">
                  <BarChart3 size={26} />
                </div>
                <p className="mt-4 font-semibold text-zinc-900">No sales trend yet</p>
                <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-zinc-500">
                  Revenue will appear here once orders are created or delivered for the selected period.
                </p>
              </div>
            </div>
          )}

          {!isLoading && !error && hasTrend && (
            <ResponsiveContainer
              width="100%"
              height="100%"
              initialDimension={{ width: 640, height: 280 }}
            >
              <BarChart data={trend} barGap={4} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#EDEDF0" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#A1A1AA", fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#A1A1AA", fontSize: 12 }}
                  tickFormatter={(value) => axisMoney(Number(value))}
                />
                <Tooltip
                  cursor={{ fill: "#F4F4F5" }}
                  formatter={(value, name) => [money(Number(value)), name === "newUser" ? "New customers" : "Existing customers"]}
                  labelStyle={{ color: "#18181B", fontWeight: 600 }}
                  contentStyle={{ borderRadius: 8, border: "1px solid #E4E4E7", fontSize: 12 }}
                />
                <Bar dataKey="existingUser" stackId="sales" fill="#27272A" radius={[0, 0, 6, 6]} maxBarSize={34} />
                <Bar dataKey="newUser" stackId="sales" fill="#F8C231" radius={[6, 6, 0, 0]} maxBarSize={34} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
