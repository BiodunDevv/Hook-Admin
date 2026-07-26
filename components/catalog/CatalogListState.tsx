import { PackageSearch } from "lucide-react";
import { HookLoader } from "@/components/shared/HookLoader";

export function CatalogListState({
  loading,
  error,
  empty,
}: {
  loading: boolean;
  error: boolean;
  empty: boolean;
}) {
  if (loading) return <div className="grid min-h-56 place-items-center"><HookLoader label="Loading catalog" /></div>;
  if (error) return <div className="grid min-h-56 place-items-center text-sm text-destructive">Catalog data could not be loaded.</div>;
  if (empty) return (
    <div className="grid min-h-56 place-items-center text-center">
      <div><PackageSearch className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 font-medium">Nothing in this view yet</p><p className="mt-1 text-sm text-muted-foreground">New records will appear here when they reach this workflow stage.</p></div>
    </div>
  );
  return null;
}
