import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  caption?: string;
  icon?: LucideIcon;
  tone?: "blue" | "green" | "amber" | "red" | "purple" | "zinc";
}

const toneClasses = {
  blue: "bg-blue-50 text-blue-500",
  green: "bg-emerald-50 text-emerald-500",
  amber: "bg-amber-50 text-brand-gold",
  red: "bg-red-50 text-red-500",
  purple: "bg-purple-50 text-purple-500",
  zinc: "bg-zinc-100 text-zinc-500",
};

export function KpiCard({ label, value, caption, icon: Icon, tone = "zinc" }: KpiCardProps) {
  return (
    <Card className="rounded-lg border-zinc-200 shadow-card py-0">
      <CardContent className="flex items-center gap-3 p-4">
        {Icon && (
          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", toneClasses[tone])}>
            <Icon size={20} />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
          <p className="mt-1 truncate text-2xl font-semibold leading-none text-zinc-900">{value}</p>
          {caption && <p className="mt-2 truncate text-xs text-zinc-500">{caption}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
