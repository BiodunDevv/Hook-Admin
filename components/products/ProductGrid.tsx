"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, PackageSearch } from "lucide-react";
import { toast } from "sonner";
import { HookLoader } from "@/components/shared/HookLoader";
import { QueryState } from "@/components/shared/QueryState";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useApiQuery } from "@/lib/query";
import { apiDelete, apiPatch, apiPost } from "@/lib/api";
import type { Page } from "@/lib/admin-utils";
import { ProductCard } from "./ProductCard";
import { ProductTable, type ColumnKey } from "./ProductTable";
import type { ProductRow } from "./product-types";

export type { ProductRow } from "./product-types";

interface ProductGridProps {
  queryKey: readonly unknown[];
  path: string;
  onPageChange: (page: number) => void;
  /** "table" is the dense default; "cards" keeps the picture-led grid. */
  view?: "table" | "cards";
  categories?: Array<{ id: string; name: string; parentId?: string | null }>;
  columns?: Record<ColumnKey, boolean>;
  sort?: string;
  dir?: string;
  onSort?: (field: string) => void;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : fallback;
}

const ALL_COLUMNS: Record<ColumnKey, boolean> = { market: true, price: true, stock: true, status: true, activity: true, updated: true };

export function ProductGrid({ queryKey, path, onPageChange, view = "cards", categories = [], columns = ALL_COLUMNS, sort = "createdAt", dir = "desc", onSort = () => undefined }: ProductGridProps) {
  const query = useApiQuery<Page<ProductRow>>(queryKey, path);
  const products = query.data?.data || [];
  const meta = {
    total: query.data?.total || 0,
    page: query.data?.page || 1,
    limit: query.data?.limit || 20,
    totalPages: query.data?.totalPages || 1,
  };
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const toggle = (id: string) => setSelected((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const toggleAll = (checked: boolean) => setSelected(checked ? new Set(products.map((product) => product.id)) : new Set());

  /** Runs one action over every selected product and reports how many worked. */
  async function recategorise(categoryId: string) {
    const ids = products.filter((product) => selected.has(product.id)).map((product) => product.id);
    if (!ids.length) return;
    setBulkBusy(true);
    try {
      await apiPost("/admin/products/recategorise", { productIds: ids, categoryId });
      toast.success(`${ids.length} product${ids.length === 1 ? "" : "s"} moved.`);
      setSelected(new Set());
      void query.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Could not move products");
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulk(action: "approve" | "disable") {
    const targets = products.filter((product) => selected.has(product.id));
    if (!targets.length) return;
    setBulkBusy(true);
    const results = await Promise.allSettled(targets.map((product) => action === "disable" ? apiPatch(`/admin/products/${product.id}/disable`) : apiPatch(`/admin/products/${product.id}/review`, { status: "approved" })));
    const failed = results.filter((result) => result.status === "rejected").length;
    if (failed) toast.warning(`${targets.length - failed} of ${targets.length} ${action === "disable" ? "disabled" : "approved"}; ${failed} could not be changed.`);
    else toast.success(`${targets.length} product${targets.length === 1 ? "" : "s"} ${action === "disable" ? "disabled" : "approved"}.`);
    setSelected(new Set());
    setBulkBusy(false);
    void query.refetch();
  }
  const [deleting, setDeleting] = useState(false);

  async function deleteProduct() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDelete(`/admin/products/${deleteTarget.id}`);
      toast.success("Product deleted.");
      setDeleteTarget(null);
      query.refetch();
    } catch (error) {
      toast.error(errorMessage(error, "Product could not be deleted"));
    } finally {
      setDeleting(false);
    }
  }

  async function updateProduct(product: ProductRow, action: "approve" | "reject" | "disable") {
    const label = action === "approve" ? "approved" : action === "reject" ? "rejected" : "disabled";
    try {
      if (action === "disable") {
        await apiPatch(`/admin/products/${product.id}/disable`);
      } else {
        await apiPatch(`/admin/products/${product.id}/review`, { status: action === "approve" ? "approved" : "rejected" });
      }
      toast.success(`Product ${label}.`);
      query.refetch();
    } catch (error) {
      toast.error(errorMessage(error, "Product action failed"));
    }
  }

  return (
    <>
      <QueryState
        loading={query.isLoading}
        error={query.error}
        loadingLabel="Loading products"
        errorTitle="Products could not be loaded"
        empty={!query.isLoading && !query.isError && !products.length}
        emptyIcon={PackageSearch}
        emptyTitle="No products found for this catalog view"
        emptyDescription="Try another search, adjust the catalog filters, or add a product when you are ready to build inventory."
        onRetry={() => query.refetch()}
      >
        {selected.size > 0 ? (
          <div className="sticky top-2 z-20 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 shadow-sm">
            <span className="text-sm font-medium text-amber-900">{selected.size} selected</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => void bulk("approve")}>Approve</Button>
              <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => void bulk("disable")}>Disable</Button>
              <Select value="" onValueChange={(value) => void recategorise(value)} disabled={bulkBusy}>
                <SelectTrigger className="h-8 w-[170px] bg-white text-xs"><SelectValue placeholder="Move to category…" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {categories.filter((category) => category.parentId).map((category) => (
                    <SelectItem key={category.id} value={category.id}>{categories.find((parent) => parent.id === category.parentId)?.name} › {category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="ghost" disabled={bulkBusy} onClick={() => setSelected(new Set())}>Clear</Button>
            </div>
          </div>
        ) : null}
        {view === "table" ? (
          <ProductTable
            products={products}
            columns={columns}
            selected={selected}
            onToggle={toggle}
            onToggleAll={toggleAll}
            sort={sort}
            dir={dir}
            onSort={onSort}
            onApprove={(item) => void updateProduct(item, "approve")}
            onReject={(item) => void updateProduct(item, "reject")}
            onDisable={(item) => void updateProduct(item, "disable")}
            onDelete={setDeleteTarget}
          />
        ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onApprove={(item) => void updateProduct(item, "approve")}
              onReject={(item) => void updateProduct(item, "reject")}
              onDisable={(item) => void updateProduct(item, "disable")}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
        )}
      </QueryState>

      {products.length ? (
        <div className="flex flex-col gap-2 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {(meta.page - 1) * meta.limit + 1} to {(meta.page - 1) * meta.limit + products.length} of {meta.total} products
            {query.isFetching && !query.isLoading ? " · refreshing" : ""}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 px-3" disabled={meta.page <= 1 || query.isFetching} onClick={() => onPageChange(meta.page - 1)}>
              <ChevronLeft size={14} />
            </Button>
            <Button size="sm" className="h-8 min-w-8 bg-zinc-900 px-2 text-white hover:bg-zinc-800">{meta.page}</Button>
            <span className="px-1">/ {meta.totalPages}</span>
            <Button variant="outline" size="sm" className="h-8 px-3" disabled={meta.page >= meta.totalPages || query.isFetching} onClick={() => onPageChange(meta.page + 1)}>
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open && !deleting) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this product?</DialogTitle>
            <DialogDescription>
              {deleteTarget ? `"${deleteTarget.title}" will be permanently removed from the catalog. This cannot be undone.` : "This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={() => void deleteProduct()} disabled={deleting}>
              {deleting ? <HookLoader size="button" /> : "Delete product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
