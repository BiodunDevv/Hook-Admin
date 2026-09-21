"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FolderInput, PackageSearch } from "lucide-react";
import { toast } from "sonner";
import { CategoryPicker } from "@/components/categories/CategoryPicker";
import { HookLoader } from "@/components/shared/HookLoader";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryState } from "@/components/shared/QueryState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { apiPost } from "@/lib/api";
import type { CategoryOption } from "@/lib/category-attributes";
import { useApiQuery } from "@/lib/query";

type ProductRow = {
  id: string;
  publicId?: string;
  title?: string;
  name?: string;
  images?: string[];
  status?: string;
  category?: { name?: string } | null;
  sellingPrice?: number;
};

/**
 * Products filed under the old flat categories keep selling, but they need a
 * home in the new tree. Pick some, choose a sub-category, move them together.
 */
export default function RecategorisePage() {
  const queryClient = useQueryClient();
  const products = useApiQuery<{ data?: ProductRow[]; items?: ProductRow[] }>(
    ["admin", "products", "needs-recategorisation"],
    "/admin/products?needsRecategorisation=true&limit=100",
  );
  const categories = useApiQuery<{ data: CategoryOption[] }>(["admin", "categories", "product-options"], "/admin/categories");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [target, setTarget] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const rows = useMemo(() => {
    const list = products.data?.data || products.data?.items || [];
    const needle = search.trim().toLowerCase();
    return needle ? list.filter((row) => `${row.title || row.name} ${row.category?.name || ""}`.toLowerCase().includes(needle)) : list;
  }, [products.data, search]);
  const key = (row: ProductRow) => row.publicId || row.id;
  const allSelected = rows.length > 0 && rows.every((row) => selected.has(key(row)));

  function toggle(row: ProductRow, value: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (value) next.add(key(row)); else next.delete(key(row));
      return next;
    });
  }

  async function move() {
    if (!selected.size || !target) return;
    setSaving(true);
    try {
      const result = await apiPost<{ moved: number }>("/admin/products/recategorise", { productIds: [...selected], categoryId: target });
      toast.success(`Moved ${result.moved} product${result.moved === 1 ? "" : "s"}`);
      setSelected(new Set());
      await Promise.all([
        products.refetch(),
        queryClient.invalidateQueries({ queryKey: ["admin", "categories"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "products"] }),
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "The products could not be moved");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full space-y-5 px-4 py-5">
      <PageHeader
        title="Move products into the new categories"
        description="These products were filed under a category that now has sub-categories. They stay live until you move them."
        actions={<Button asChild variant="outline" size="sm"><Link href="/dashboard/categories"><ArrowLeft /> Categories</Link></Button>}
      />

      <PermissionGuard permission="products.edit">
        <Card className="rounded-lg shadow-none">
          <CardContent className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <CategoryPicker categories={categories.data?.data || []} value={target} onChange={setTarget} label="Move selected products to" />
            <Button variant="brand" disabled={saving || !selected.size || !target} onClick={() => void move()}>
              {saving ? <HookLoader size="button" /> : <><FolderInput /> Move {selected.size || ""} selected</>}
            </Button>
          </CardContent>
        </Card>
      </PermissionGuard>

      <Card className="gap-0 rounded-lg py-0 shadow-none">
        <CardHeader className="flex-row items-center justify-between gap-3 border-b py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Checkbox checked={allSelected} onCheckedChange={(value) => setSelected(value === true ? new Set(rows.map(key)) : new Set())} aria-label="Select all" />
            Products waiting ({rows.length})
          </CardTitle>
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" className="h-8 w-56" />
        </CardHeader>
        <CardContent className="p-0">
          <QueryState
            loading={products.isLoading}
            error={products.error}
            empty={rows.length === 0}
            loadingLabel="Loading products"
            errorTitle="Products could not be loaded"
            emptyTitle="Everything is filed"
            emptyDescription="No product is waiting for a sub-category."
            emptyIcon={PackageSearch}
            onRetry={() => products.refetch()}
          >
            <ul className="divide-y">
              {rows.map((row) => (
                <li key={key(row)} className="flex items-center gap-3 px-4 py-3">
                  <Checkbox checked={selected.has(key(row))} onCheckedChange={(value) => toggle(row, value === true)} aria-label={`Select ${row.title || row.name}`} />
                  {row.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.images[0]} alt="" className="size-10 shrink-0 rounded-md border object-cover" />
                  ) : <span className="size-10 shrink-0 rounded-md bg-muted" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{row.title || row.name}</p>
                    <p className="truncate text-xs text-muted-foreground">Now in {row.category?.name || "an old category"}</p>
                  </div>
                  <Link href={`/dashboard/products/${key(row)}`} className="text-xs text-muted-foreground underline-offset-2 hover:underline">Open</Link>
                </li>
              ))}
            </ul>
          </QueryState>
        </CardContent>
      </Card>
    </div>
  );
}
