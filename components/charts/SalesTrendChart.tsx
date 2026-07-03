"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";

const periods = ["Weekly", "Monthly", "Yearly"] as const;

export default function SalesTrendChart() {
  const [period, setPeriod] = useState<(typeof periods)[number]>("Monthly");
  const [trend, setTrend] = useState<Array<{ day: string; newUser: number; existingUser: number }>>([]);

  useEffect(() => {
    apiGet<{ salesTrend?: Array<{ day: string; newUser: number; existingUser: number }> }>("/admin/analytics")
      .then((result) => setTrend(result.salesTrend || []))
      .catch(() => setTrend([]));
  }, []);

  return (
    <Card className="shadow-card border-zinc-200">
      <CardContent className="pt-5">
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
            <p className="text-3xl font-semibold text-zinc-900">₦0</p>
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
                    : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-zinc-300" /> New User
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-zinc-700" /> Existing User
          </span>
        </div>

        <div className="mt-4 h-[280px] min-h-[280px] min-w-0">
          <ResponsiveContainer
            width="100%"
            height="100%"
            initialDimension={{ width: 640, height: 280 }}
          >
            <BarChart data={trend} barGap={4} margin={{ left: -16 }}>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="#EDEDF0"
              />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#A1A1AA", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#A1A1AA", fontSize: 12 }}
                tickFormatter={(v) => (v === 0 ? "0k" : `${v / 1000}k`)}
              />
              <Tooltip
                cursor={{ fill: "#F4F4F5" }}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #E4E4E7",
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="existingUser"
                stackId="a"
                fill="#D4D4D8"
                radius={[0, 0, 6, 6]}
                maxBarSize={36}
              />
              <Bar
                dataKey="newUser"
                stackId="a"
                fill="#3F3F46"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
