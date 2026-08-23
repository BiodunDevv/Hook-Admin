import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DefinitionItem = {
  label: string;
  value: ReactNode;
  span?: 1 | 2 | 3;
};

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
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "min-w-0 border-b border-border/70 pb-4 last:border-b-1",
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

