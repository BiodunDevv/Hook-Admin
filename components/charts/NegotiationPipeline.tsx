"use client";

import Link from "next/link";
import { ArrowUpRight, Bot, Sparkles } from "lucide-react";
import { PolarAngleAxis, RadialBar, RadialBarChart } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { HookLoader } from "@/components/shared/HookLoader";
import { useApiQuery } from "@/lib/query";

interface NegotiationPipelinePoint {
  label: string;
  status: string;
  volume: number;
}

interface AnalyticsResponse {
  negotiationPipeline?: NegotiationPipelinePoint[];
  negotiationSummary?: {
    total: number;
    accepted: number;
    conversionRate: number;
    averageSavings: number;
  };
}

const chartConfig = {
  conversion: {
    label: "Conversion",
    color: "#7C3AED",
  },
} satisfies ChartConfig;

const statusStyles: Record<
  string,
  { label: string; className: string; dot: string }
> = {
  active: {
    label: "Active",
    className: "border-violet-100 bg-violet-50 text-violet-700",
    dot: "bg-violet-500",
  },
  accepted: {
    label: "Accepted",
    className: "border-emerald-100 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  declined: {
    label: "Declined",
    className: "border-rose-100 bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
  },
  withdrawn: {
    label: "Withdrawn",
    className: "border-amber-100 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  expired: {
    label: "Expired",
    className: "border-zinc-200 bg-zinc-50 text-zinc-600",
    dot: "bg-zinc-400",
  },
};

function money(value = 0) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizeStatus(point: NegotiationPipelinePoint) {
  return (point.status || point.label || "").toLowerCase().replace(/\s+/g, "_");
}

export default function NegotiationPipeline() {
  const { data: result, isLoading, error } = useApiQuery<AnalyticsResponse>(
    ["admin", "analytics", "negotiation-pipeline"],
    "/admin/analytics?period=monthly",
  );

  const pipelineData = result?.negotiationPipeline || [];
  const totalAttempts =
    result?.negotiationSummary?.total ??
    pipelineData.reduce((sum, item) => sum + item.volume, 0);
  const conversionRate = result?.negotiationSummary?.conversionRate ?? 0;
  const averageSavings = result?.negotiationSummary?.averageSavings ?? 0;
  const hasData = !isLoading && totalAttempts > 0;
  const safeConversionRate = Math.min(Math.max(conversionRate, 0), 100);
  const statusCounts = pipelineData.reduce<Record<string, number>>((acc, item) => {
    const key = normalizeStatus(item);
    acc[key] = (acc[key] || 0) + item.volume;
    return acc;
  }, {});
  const radialData = [
    {
      name: "Conversion",
      value: safeConversionRate,
      fill: "var(--color-conversion)",
    },
  ];

  return (
    <Card className="shadow-card border-zinc-200 py-0">
      <CardContent className="pt-5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-600">
            <Sparkles size={16} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-zinc-900">
              AI Negotiation Pipeline
            </h3>
            <p className="truncate text-sm text-zinc-400">
              Conversion and saved value
            </p>
          </div>
        </div>

        <div className="mt-4 flex h-[190px] min-h-[190px] min-w-0 items-center justify-center">
          {isLoading ? (
            <HookLoader label="Loading pipeline..." />
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-600">
              Negotiation pipeline could not be loaded.
            </div>
          ) : !hasData ? (
            <div className="flex max-w-[240px] flex-col items-center gap-2 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-zinc-50 text-zinc-300 ring-1 ring-zinc-100">
                <Bot size={24} />
              </span>
              <p className="text-sm font-medium text-zinc-500">
                No negotiation activity yet
              </p>
              <p className="text-xs leading-5 text-zinc-400">
                Sessions will appear once customers start negotiating.
              </p>
            </div>
          ) : (
            <div className="grid w-full grid-cols-[132px_1fr] items-center gap-3">
              <div className="relative mx-auto size-[132px]">
                <ChartContainer
                  config={chartConfig}
                  className="size-[132px] aspect-square"
                  initialDimension={{ width: 132, height: 132 }}
                >
                  <RadialBarChart
                    data={radialData}
                    startAngle={90}
                    endAngle={-270}
                    innerRadius={46}
                    outerRadius={63}
                  >
                    <PolarAngleAxis
                      type="number"
                      domain={[0, 100]}
                      dataKey="value"
                      tick={false}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel nameKey="name" />}
                    />
                    <RadialBar dataKey="value" background cornerRadius={12} />
                  </RadialBarChart>
                </ChartContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-semibold tracking-tight text-zinc-950">
                    {safeConversionRate.toFixed(1)}%
                  </span>
                  <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-400">
                    Converted
                  </span>
                </div>
              </div>

              <div className="grid min-w-0 gap-2">
                {["active", "accepted", "declined", "withdrawn", "expired"].map(
                  (status) => {
                    const style = statusStyles[status];
                    const count = statusCounts[status] || 0;

                    return (
                      <div
                        key={status}
                        className={`flex min-w-0 items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-xs ${style.className}`}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className={`size-1.5 shrink-0 rounded-full ${style.dot}`}
                          />
                          <span className="truncate font-medium">{style.label}</span>
                        </span>
                        <span className="shrink-0 font-semibold tabular-nums">
                          {count}
                        </span>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-100 pt-4">
          <div className="min-w-0">
            <p className="truncate text-xs text-zinc-400">Average saved per accepted deal</p>
            <p className="truncate text-xl font-semibold text-zinc-900">
              {money(averageSavings)}
            </p>
          </div>
          <Link
            href="/dashboard/ai-negotiation"
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-2 text-sm font-medium text-zinc-700 shadow-xs transition hover:bg-zinc-50"
          >
            View all
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
