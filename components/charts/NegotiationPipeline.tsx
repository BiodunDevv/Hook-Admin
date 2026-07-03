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
import { Bot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { apiGet } from "@/lib/api";

export default function NegotiationPipeline() {
  const [data, setData] = useState<Array<{ day: string; volume: number }>>([]);
  const [summary, setSummary] = useState({ totalAttempts: 0, successRate: "0%", avgDiscount: "0%" });

  useEffect(() => {
    apiGet<{ data?: unknown[]; total?: number; accepted?: number; conversionRate?: number }>("/admin/negotiations?limit=1")
      .then((result) => {
        setData([]);
        setSummary({
          totalAttempts: result.total || 0,
          successRate: `${result.conversionRate || 0}%`,
          avgDiscount: "0%",
        });
      })
      .catch(() => setSummary({ totalAttempts: 0, successRate: "0%", avgDiscount: "0%" }));
  }, []);

  return (
    <Card className="shadow-card border-zinc-200">
      <CardContent className="pt-5">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-amber-500" />
          <h3 className="font-semibold text-zinc-900">AI Negotiation Pipeline</h3>
        </div>
        <p className="text-sm text-zinc-400">Success rate and discount volume</p>

        <div className="mt-4 h-[220px] min-h-[220px] min-w-0">
          <ResponsiveContainer
            width="100%"
            height="100%"
            initialDimension={{ width: 360, height: 220 }}
          >
            <BarChart data={data} margin={{ left: -16 }}>
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
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 border-t border-zinc-100 pt-4 text-sm">
          <div>
            <p className="text-zinc-400">Total Attempts</p>
            <p className="text-lg font-semibold text-zinc-900">
              {summary.totalAttempts}
            </p>
          </div>
          <div>
            <p className="text-zinc-400">Success Rate</p>
            <p className="text-lg font-semibold text-emerald-600">
              {summary.successRate}
            </p>
          </div>
          <div>
            <p className="text-zinc-400">Avg Discount</p>
            <p className="text-lg font-semibold text-zinc-900">
              {summary.avgDiscount}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
