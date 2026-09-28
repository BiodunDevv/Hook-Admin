import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type MetricIntent = "neutral" | "info" | "violet" | "teal" | "warning" | "danger" | "success";
export type MetricTrend = "up" | "down" | "flat";

interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  caption?: React.ReactNode;
  delta?: React.ReactNode;
  trend?: MetricTrend;
  icon?: LucideIcon;
  intent?: MetricIntent;
  className?: string;
}

/** Same soft-tinted icon chip Markets' own stat tiles use — the color itself is the only accent, no colored border needed. */
const intentStyles: Record<MetricIntent, string> = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-info-soft text-info",
  violet: "bg-violet-soft text-violet",
  teal: "bg-teal-soft text-teal",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  success: "bg-success-soft text-success",
};

const trendStyles: Record<MetricTrend, string> = {
  up: "text-success",
  down: "text-danger",
  flat: "text-muted-foreground",
};

const trendIcons = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: ArrowRight,
};

export function MetricCard({
  label,
  value,
  caption,
  delta,
  trend = "flat",
  icon: Icon,
  intent = "neutral",
  className,
}: MetricCardProps) {
  const TrendIcon = trendIcons[trend];

  return (
    <Card className={cn("rounded-xl shadow-none", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {Icon ? (
            <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", intentStyles[intent])}>
              <Icon className="size-4" />
            </span>
          ) : null}
          <span className="truncate text-2xl font-semibold tabular-nums text-foreground">{value}</span>
        </div>

        <p className="mt-3 truncate text-xs font-semibold text-foreground">{label}</p>

        {delta || caption ? (
          <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px]">
            {delta ? (
              <span className={cn("inline-flex shrink-0 items-center gap-0.5 font-semibold", trendStyles[trend])}>
                <TrendIcon className="size-3" />
                {delta}
              </span>
            ) : null}
            {caption ? <span className="truncate text-muted-foreground">{caption}</span> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
