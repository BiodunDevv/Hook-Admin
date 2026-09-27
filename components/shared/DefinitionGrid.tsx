import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DefinitionItem = {
  label: string;
  value: ReactNode;
  span?: 1 | 2 | 3;
};

/** Whether an item falls in the grid's final row; a best-effort approximation when items carry a `span`. */
function isInLastRow(index: number, count: number, columns: 1 | 2 | 3) {
  if (columns === 1) return index === count - 1;
  const lastRowStart = Math.floor((count - 1) / columns) * columns;
  return index >= lastRowStart;
}

export function DefinitionGrid({
  items,
  columns = 2,
  className,
}: {
  items: DefinitionItem[];
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "grid gap-x-6 gap-y-5",
        columns >= 2 && "sm:grid-cols-2",
        columns === 3 && "xl:grid-cols-3",
        className,
      )}
    >
      {items.map((item, index) => (
        <div
          key={item.label}
          className={cn(
            // The separator is dropped for the whole bottom row, not just the last cell, since `:last-child` alone missed a row in multi-column grids.
            "min-w-0 border-b border-border/70 pb-4",
            isInLastRow(index, items.length, columns) && "sm:border-b-0",
            // A single column always has one item per row, so the last item is the bottom row at every breakpoint.
            index === items.length - 1 && "border-b-0",
            item.span === 2 && "sm:col-span-2",
            item.span === 3 && "sm:col-span-2 xl:col-span-3",
          )}
        >
          <dt className="text-[11px] font-semibold uppercase text-muted-foreground">
            {item.label}
          </dt>
          <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
            {item.value ?? "-"}
          </dd>
        </div>
      ))}
    </dl>
  );
}

