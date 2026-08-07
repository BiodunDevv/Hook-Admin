import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type MetricIntent = "neutral" | "warning" | "danger" | "success";
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

const intentStyles: Record<MetricIntent, string> = {
  neutral: "bg-muted text-muted-foreground",
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
    <Card
      className={cn(
        "gap-0 rounded-lg border-border py-0 shadow-card",
        className,
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          {Icon ? (
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-md",
                intentStyles[intent],
              )}
            >
              <Icon className="size-4" />
            </span>
          ) : null}
        </div>

        <p className="mt-2 truncate text-xl font-semibold leading-none tabular-nums text-foreground">
          {value}
        </p>

        {delta || caption ? (
          <div className="mt-3 flex min-w-0 items-center gap-1.5 text-xs">
            {delta ? (
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-0.5 font-semibold",
                  trendStyles[trend],
                )}
              >
                <TrendIcon className="size-3" />
                {delta}
              </span>
            ) : null}
            {caption ? (
              <span className="truncate text-muted-foreground">{caption}</span>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
