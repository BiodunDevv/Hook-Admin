import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CompactStat {
  label: string;
  value: string | number;
  caption?: string;
  tone?: "default" | "green" | "amber" | "red" | "blue";
}

const tones: Record<NonNullable<CompactStat["tone"]>, string> = {
  default: "border-zinc-200",
  green: "border-emerald-200 bg-emerald-50/40",
  amber: "border-amber-200 bg-amber-50/40",
  red: "border-red-200 bg-red-50/40",
  blue: "border-blue-200 bg-blue-50/40",
};

export function CompactStatGrid({ stats }: { stats: CompactStat[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className={cn("rounded-lg shadow-none", tones[stat.tone || "default"])}>
          <CardContent className="p-3">
            <p className="truncate text-[11px] font-medium uppercase text-muted-foreground">{stat.label}</p>
            <p className="mt-1 truncate text-lg font-semibold text-foreground">{stat.value}</p>
            {stat.caption && <p className="mt-0.5 truncate text-xs text-muted-foreground">{stat.caption}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
