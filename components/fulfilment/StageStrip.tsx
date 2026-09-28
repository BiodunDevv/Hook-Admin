import { cn } from "@/lib/utils";

export type Stage = { key: string; label: string; count?: number; href?: string; tone?: "default" | "warning" | "danger"; group?: string };

/** Cycles a small set of hues across groups (or, if a page has no groups, across each stage) so the strip reads as color-coded lanes rather than one flat gray bar. */
const PALETTE = [
  { text: "text-info", soft: "bg-info-soft", ring: "ring-info/25", dot: "bg-info" },
  { text: "text-violet", soft: "bg-violet-soft", ring: "ring-violet/25", dot: "bg-violet" },
  { text: "text-teal", soft: "bg-teal-soft", ring: "ring-teal/25", dot: "bg-teal" },
  { text: "text-danger", soft: "bg-danger-soft", ring: "ring-danger/25", dot: "bg-danger" },
] as const;

const TONE_OVERRIDE = {
  warning: { text: "text-warning", soft: "bg-warning-soft" },
  danger: { text: "text-danger", soft: "bg-danger-soft" },
} as const;

/** Compact pipeline of fulfilment stages with live counts, grouped into named phases (e.g. Sourcing / Hub / Dispatch) so a long strip reads as a journey rather than a flat row of buttons. Each phase gets its own color lane. */
export function StageStrip({ stages, active, onSelect }: { stages: Stage[]; active?: string; onSelect?: (key: string) => void }) {
  const laneIds = Array.from(new Set(stages.map((stage) => stage.group || stage.key)));

  return (
    <div className="flex flex-wrap gap-2">
      {laneIds.map((laneId) => {
        const laneStages = stages.filter((stage) => (stage.group || stage.key) === laneId);
        const palette = PALETTE[laneIds.indexOf(laneId) % PALETTE.length];
        const label = laneStages[0]?.group;

        return (
          <div key={laneId} className={cn("flex items-center gap-1 rounded-lg border bg-card p-1.5", label && "pl-3")}>
            {label ? (
              <span className={cn("mr-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide", palette.text)}>
                <span className={cn("size-1.5 rounded-full", palette.dot)} />
                {label}
              </span>
            ) : null}
            {laneStages.map((stage) => {
              const isActive = active === stage.key;
              const countStyle = stage.tone && stage.tone !== "default" ? TONE_OVERRIDE[stage.tone] : palette;
              return (
                <button
                  key={stage.key}
                  type="button"
                  onClick={() => onSelect?.(stage.key)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition",
                    isActive ? cn(palette.soft, palette.text, "font-semibold ring-1", palette.ring) : "text-foreground hover:bg-muted",
                  )}
                >
                  <span>{stage.label}</span>
                  <span className={cn("min-w-5 rounded-full px-1.5 text-center text-xs font-semibold", countStyle.soft, countStyle.text)}>
                    {stage.count ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
