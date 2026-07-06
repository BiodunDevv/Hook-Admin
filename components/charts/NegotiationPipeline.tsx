"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Bot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useApiQuery } from "@/lib/query";

interface NegotiationSummary {
  data?: unknown[];
  total?: number;
  accepted?: number;
  conversionRate?: number;
}

export default function NegotiationPipeline() {
  const { data: result, isLoading } = useApiQuery<NegotiationSummary>(
    ["admin", "negotiation-summary"],
    "/admin/negotiations?limit=1",
  );

  const totalAttempts = result?.total ?? 0;
  const conversionRate = result?.conversionRate ?? 0;
  const hasData = !isLoading && totalAttempts > 0;

  const chartData: Array<{ day: string; volume: number }> = hasData
    ? [{ day: "Total", volume: totalAttempts }]
    : [];

  return (
    <Card className="shadow-card border-zinc-200 py-0">
      <CardContent className="pt-5">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-amber-500" />
          <h3 className="font-semibold text-zinc-900">AI Negotiation Pipeline</h3>
        </div>
        <p className="text-sm text-zinc-400">Success rate and discount volume</p>

        <div className="mt-4 flex h-[220px] min-h-[220px] min-w-0 items-center justify-center">
          {!hasData ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <Bot size={36} className="text-zinc-200" />
              <p className="text-sm font-medium text-zinc-500">No negotiation activity yet</p>
              <p className="text-xs text-zinc-400">Pipeline data will appear here once customers start negotiating</p>
            </div>
          ) : (
            <ResponsiveContainer
              width="100%"
              height="100%"
              initialDimension={{ width: 360, height: 220 }}
            >
              <BarChart data={chartData} margin={{ left: -16 }}>
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
                  dataKey="volume"
                  fill="#6D5BD0"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 border-t border-zinc-100 pt-4 text-sm">
          <div>
            <p className="text-zinc-400">Total Attempts</p>
            <p className="text-lg font-semibold text-zinc-900">{totalAttempts}</p>
          </div>
          <div>
            <p className="text-zinc-400">Success Rate</p>
            <p className="text-lg font-semibold text-emerald-600">{conversionRate.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-zinc-400">Avg Discount</p>
            <p className="text-lg font-semibold text-zinc-900">--</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
