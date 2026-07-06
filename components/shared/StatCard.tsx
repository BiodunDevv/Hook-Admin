import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { StatCardData } from "@/lib/data";

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values);
  return (
    <div className="flex items-end gap-[3px]">
      {values.map((v, i) => (
        <span
          key={i}
          className="w-[3px] rounded-sm bg-zinc-300"
          style={{ height: `${Math.max((v / max) * 18, 3)}px` }}
        />
      ))}
    </div>
  );
}

export default function StatCard({ data }: { data: StatCardData }) {
  const { label, value, delta, trend, caption, sparkline } = data;

  const deltaColor =
    trend === "up"
      ? "text-emerald-600"
      : trend === "down"
      ? "text-red-500"
      : "text-zinc-400";

  return (
    <Card className="rounded-lg border-zinc-200 shadow-card py-0">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            {label}
          </p>
          <Sparkline values={sparkline} />
        </div>

        <p className="mt-2 text-2xl font-semibold leading-none text-zinc-900">{value}</p>

        <div className="mt-3 flex items-center gap-1.5 text-xs leading-none">
          <span className="h-1.5 w-1.5 rounded-full border border-zinc-300" />
          <span className={cn("font-semibold", deltaColor)}>{delta}</span>
          <span className="text-zinc-400">{caption}</span>
        </div>
      </CardContent>
    </Card>
  );
}
