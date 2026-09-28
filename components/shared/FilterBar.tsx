import { Filter, Search, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/** The same search + filters bar Markets uses, extracted for reuse across the Operations pages. */
export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Search",
  filters,
  active,
  onClear,
  hint = "Refine the list",
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** The Select controls for this page, rendered after the search input. */
  filters?: React.ReactNode;
  /** Whether any filter (search or otherwise) is currently applied — shows Clear instead of the hint. */
  active: boolean;
  onClear: () => void;
  hint?: string;
}) {
  return (
    <Card className="rounded-xl shadow-none">
      <CardContent className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1 lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder={searchPlaceholder} className="h-9 pl-9" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {filters}
          {active ? (
            <Button variant="ghost" size="sm" onClick={onClear}><X /> Clear</Button>
          ) : (
            <span className="hidden items-center gap-1 text-xs text-muted-foreground xl:flex"><Filter className="size-3.5" /> {hint}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
