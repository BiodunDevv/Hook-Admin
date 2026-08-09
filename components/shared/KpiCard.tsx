import type { LucideIcon } from "lucide-react";
import { MetricCard, type MetricIntent } from "@/components/shared/MetricCard";

interface KpiCardProps {
  label: string;
  value: string | number;
  caption?: string;
  icon?: LucideIcon;
  tone?: "blue" | "green" | "amber" | "red" | "purple" | "zinc";
}

const toneIntents: Record<NonNullable<KpiCardProps["tone"]>, MetricIntent> = {
  blue: "neutral",
  green: "success",
  amber: "warning",
  red: "danger",
  purple: "neutral",
  zinc: "neutral",
};

export function KpiCard({
  label,
  value,
  caption,
  icon: Icon,
  tone = "zinc",
}: KpiCardProps) {
  return (
    <MetricCard
      label={label}
      value={value}
      caption={caption}
      icon={Icon}
      intent={toneIntents[tone]}
    />
  );
}
