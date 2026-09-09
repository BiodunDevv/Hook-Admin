"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreHorizontal,
  PackageSearch,
  Pencil,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { HookLoader } from "@/components/shared/HookLoader";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApiQuery } from "@/lib/query";
import { money } from "@/lib/admin-utils";
import { apiDelete, apiPatch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { PermissionGuard, SuperAdminGuard } from "@/components/auth/PermissionGuard";

export interface ProductRow {
  id: string;
  hookId?: string;
  title: string;
  category?: { name?: string };
  vendor?: { businessName?: string };
  images?: string[];
  sellingPrice?: number;
  quantity?: number;
  status: string;
  createdAt?: string;
  managers?: Array<{
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string | null;
    role: string;
  }>;
}

interface Page<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
  stats?: Record<string, number>;
}

interface ProductsTableProps {
  queryKey: readonly unknown[];
  path: string;
  onPageChange: (page: number) => void;
}

function stockTone(quantity = 0) {
  if (quantity <= 0) return "text-red-600";
  if (quantity < 10) return "text-amber-600";
  return "text-emerald-600";
}

function displayStatus(status: string) {
  return ["published", "approved"].includes(status.toLowerCase()) ? "active" : status;
}

function canReview(status?: string) {
  return !["published", "approved", "active", "disabled"].includes((status || "").toLowerCase());
}

function absoluteImageUrl(url?: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const base = (
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1"
  ).replace(/\/api\/v1\/?$/, "");
  return `${base}${url}`;
}

function ProductThumb({ src, title, className }: { src?: string; title: string; className?: string }) {
  return (
    <span className={cn("relative shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={title} className="size-full object-cover" />
      ) : (
        <PackageSearch className="m-auto size-1/2 text-zinc-400" />
      )}
    </span>
  );
}

function StockBadge({ quantity }: { quantity: number }) {
  return (
    <span className={cn("text-sm font-semibold tabular-nums", stockTone(quantity))}>
      {quantity.toLocaleString()}
      {quantity > 0 && quantity < 10 && <span className="ml-1.5 text-xs font-medium text-amber-600">Low</span>}
      {quantity <= 0 && <span className="ml-1.5 text-xs font-medium text-red-500">Out</span>}
    </span>
  );
}

export function ProductsTable({
  queryKey,
  path,
  onPageChange,
}: ProductsTableProps) {
  const { data, isLoading, isFetching, error, refetch } = useApiQuery<
    Page<ProductRow>
  >(queryKey, path);
  const products = data?.data || [];
  const meta = {
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || 20,
    totalPages: data?.totalPages || 1,
  };
  const errorMessage =
    error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "";
  const start = products.length ? (meta.page - 1) * meta.limit + 1 : 0;
  const end = products.length ? start + products.length - 1 : 0;
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function deleteProduct() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDelete(`/admin/products/${deleteTarget.id}`);
      toast.success("Product deleted.");
      setDeleteTarget(null);
      refetch();
    } catch (mutationError) {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message.replace(/^\d+:\s*/, "")
          : "Product could not be deleted",
      );
    } finally {
      setDeleting(false);
    }
  }

  async function updateProduct(product: ProductRow, action: "approve" | "reject" | "disable") {
    const label =
      action === "approve"
        ? "approved"
        : action === "reject"
          ? "rejected"
          : "disabled";
    try {
      if (action === "disable") {
        await apiPatch(`/admin/products/${product.id}/disable`);
      } else {
        await apiPatch(`/admin/products/${product.id}/review`, {
          status: action === "approve" ? "approved" : "rejected",
        });
      }
      toast.success(`Product ${label}.`);
      refetch();
    } catch (mutationError) {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message.replace(/^\d+:\s*/, "")
          : "Product action failed",
      );
    }
  }

  function ProductActionsMenu({ product }: { product: ProductRow }) {
    const isDisabled = product.status === "disabled";
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon-sm" aria-label={`Actions for ${product.title}`}>
            <MoreHorizontal size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/products/${product.id}`}>
              <Eye size={15} /> View details
            </Link>
          </DropdownMenuItem>
          <PermissionGuard permission="products.edit">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/products/${product.id}`}>
                <Pencil size={15} /> Edit product
              </Link>
            </DropdownMenuItem>
            {!isDisabled ? (
              <DropdownMenuItem variant="destructive" onSelect={() => updateProduct(product, "disable")}>
                <Ban size={15} /> Disable product
              </DropdownMenuItem>
            ) : null}
          </PermissionGuard>
          <PermissionGuard permission="products.review">
            {canReview(product.status) ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => updateProduct(product, "approve")}>
                  <Check size={15} /> Approve product
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => updateProduct(product, "reject")}>
                  <XCircle size={15} /> Reject product
                </DropdownMenuItem>
              </>
            ) : null}
          </PermissionGuard>
          {isDisabled ? (
            <SuperAdminGuard>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setDeleteTarget(product)}>
                <Trash2 size={15} /> Delete product
              </DropdownMenuItem>
            </SuperAdminGuard>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      {isLoading ? (
        <div className="border-t border-zinc-100 px-4 py-10 sm:px-6 sm:py-12">
          <div className="mx-auto flex max-w-sm items-center justify-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-500">
            <HookLoader label="Loading products..." />
          </div>
        </div>
      ) : errorMessage ? (
        <div className="border-t border-zinc-100 px-4 py-10 sm:px-6 sm:py-12">
          <div className="mx-auto w-full max-w-xl rounded-lg border border-red-200 bg-red-50 p-5 text-center">
            <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-white text-red-500">
              <AlertTriangle size={20} />
            </div>
            <p className="font-semibold text-red-700">Products could not be loaded</p>
            <p className="mx-auto mt-1 max-w-md whitespace-normal break-words text-sm leading-6 text-red-600">
              {errorMessage}
            </p>
            <Button variant="outline" size="sm" className="mt-4 bg-white" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="border-t border-zinc-100 px-4 py-10 sm:px-6 sm:py-12">
          <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 px-5 py-8 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-white text-zinc-400 shadow-sm">
              <PackageSearch size={26} />
            </div>
            <p className="text-base font-semibold text-zinc-900 sm:text-lg">
              No products found for this catalog view
            </p>
            <p className="mx-auto mt-2 max-w-xl whitespace-normal break-words text-sm leading-6 text-zinc-500">
              Try another search, adjust the catalog filters, or add a product when you are ready to build inventory.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-3 border-t border-zinc-100 p-3 md:hidden">
            {products.map((product, index) => {
              const quantity = Number(product.quantity || 0);
              const image = absoluteImageUrl(product.images?.[0]);
              return (
                <article key={product.id} className="min-w-0 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                  <div className="flex min-w-0 items-start gap-3">
                    <ProductThumb src={image} title={product.title} className="size-12" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-zinc-400">#{start + index}</p>
                      <Link href={`/dashboard/products/${product.id}`} className="mt-0.5 block truncate font-semibold text-zinc-950 hover:underline">
                        {product.title}
                      </Link>
                      <p className="mt-0.5 truncate text-xs text-zinc-400">{product.hookId || product.id.slice(0, 8)}</p>
                    </div>
                    <ProductActionsMenu product={product} />
                  </div>
                  <div className="my-3 border-t border-zinc-100" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">{product.category?.name || "Uncategorized"}</span>
                    <span className="font-semibold text-zinc-900">{money(product.sellingPrice || 0)}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <StatusBadge status={displayStatus(product.status)} />
                    <StockBadge quantity={quantity} />
                  </div>
                </article>
              );
            })}
          </div>

          <div className="hidden min-w-0 divide-y divide-zinc-100 border-t border-zinc-100 md:block">
            {products.map((product, index) => {
              const quantity = Number(product.quantity || 0);
              const image = absoluteImageUrl(product.images?.[0]);
              return (
                <article key={product.id} className="group flex min-w-0 items-center gap-4 px-4 py-3 transition-colors hover:bg-zinc-50 xl:px-5">
                  <span className="w-6 shrink-0 text-xs font-semibold tabular-nums text-zinc-400">{start + index}</span>
                  <ProductThumb src={image} title={product.title} className="size-11" />
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <Link href={`/dashboard/products/${product.id}`} className="truncate text-sm font-semibold text-zinc-950 hover:underline">
                        {product.title}
                      </Link>
                      <span className="text-zinc-300">·</span>
                      <span className="truncate text-sm text-zinc-500">{product.category?.name || "Uncategorized"}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-zinc-400">{product.hookId || product.id.slice(0, 8)}</p>
                  </div>
                  <span className="hidden shrink-0 text-sm font-semibold text-zinc-900 sm:block">{money(product.sellingPrice || 0)}</span>
                  <span className="hidden shrink-0 lg:block"><StockBadge quantity={quantity} /></span>
                  <span className="shrink-0"><StatusBadge status={displayStatus(product.status)} /></span>
                  <ProductActionsMenu product={product} />
                </article>
              );
            })}
          </div>
        </>
      )}

      <div className="flex flex-col gap-2 border-t border-zinc-200 px-4 py-2.5 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Showing {start} to {end} of {meta.total} products{" "}
          {isFetching && !isLoading ? "· refreshing" : ""}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3"
            disabled={meta.page <= 1 || isFetching}
            onClick={() => onPageChange(meta.page - 1)}
          >
            <ChevronLeft size={14} />
          </Button>
          <Button
            size="sm"
            className="h-8 min-w-8 bg-zinc-900 px-2 text-white hover:bg-zinc-800"
          >
            {meta.page}
          </Button>
          <span className="px-1">/ {meta.totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3"
            disabled={meta.page >= meta.totalPages || isFetching}
            onClick={() => onPageChange(meta.page + 1)}
          >
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>

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
