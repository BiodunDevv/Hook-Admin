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
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { HookLoader } from "@/components/shared/HookLoader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApiQuery } from "@/lib/query";
import { money } from "@/lib/admin-utils";
import { apiPatch } from "@/lib/api";
import { cn } from "@/lib/utils";

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

function absoluteImageUrl(url?: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1").replace(/\/api\/v1\/?$/, "");
  return `${base}${url}`;
}

export function ProductsTable({ queryKey, path, onPageChange }: ProductsTableProps) {
  const { data, isLoading, isFetching, error, refetch } = useApiQuery<Page<ProductRow>>(queryKey, path);
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);
  const products = data?.data || [];
  const meta = {
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || 20,
    totalPages: data?.totalPages || 1,
  };
  const errorMessage = error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "";
  const start = products.length ? (meta.page - 1) * meta.limit + 1 : 0;
  const end = products.length ? start + products.length - 1 : 0;

  async function updateProduct(action: "approve" | "reject" | "disable") {
    if (!selectedProduct) return;
    const label = action === "approve" ? "approved" : action === "reject" ? "rejected" : "disabled";
    try {
      if (action === "disable") {
        await apiPatch(`/admin/products/${selectedProduct.id}/disable`);
      } else {
        await apiPatch(`/admin/products/${selectedProduct.id}/review`, {
          status: action === "approve" ? "approved" : "rejected",
        });
      }
      toast.success(`Product ${label}.`);
      setSelectedProduct(null);
      refetch();
    } catch (mutationError) {
      toast.error(mutationError instanceof Error ? mutationError.message.replace(/^\d+:\s*/, "") : "Product action failed");
    }
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-zinc-100 bg-zinc-50">
              {["No", "Product", "Category", "Managed By", "Legacy Source", "Hook Price", "Stock", "Status", "Created", ""].map((header) => (
                <TableHead
                  key={header}
                  className={cn(
                    "px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400",
                    header === "Managed By" && "hidden lg:table-cell",
                  )}
                >
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={10} className="px-3 py-12 whitespace-normal sm:px-5">
                  <div className="mx-auto flex max-w-sm items-center justify-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-500">
                    <HookLoader label="Loading products..." />
                  </div>
                </TableCell>
              </TableRow>
            )}

            {errorMessage && (
              <TableRow>
                <TableCell colSpan={10} className="px-3 py-12 whitespace-normal sm:px-5">
                  <div className="mx-auto w-full max-w-xl rounded-lg border border-red-200 bg-red-50 p-5 text-center">
                    <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-white text-red-500">
                      <AlertTriangle size={20} />
                    </div>
                    <p className="font-semibold text-red-700">Products could not be loaded</p>
                    <p className="mx-auto mt-1 max-w-md whitespace-normal break-words text-sm leading-6 text-red-600">{errorMessage}</p>
                    <Button variant="outline" size="sm" className="mt-4 bg-white" onClick={() => refetch()}>
                      Try again
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !errorMessage && products.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="px-3 py-14 whitespace-normal sm:px-5 sm:py-16">
                  <div className="mx-auto flex min-h-56 w-full max-w-2xl flex-col items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 px-5 py-8 text-center sm:px-8">
                    <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-white text-zinc-400 shadow-sm sm:size-16">
                      <PackageSearch size={26} />
                    </div>
                    <p className="text-base font-semibold text-zinc-900 sm:text-lg">No products found for this catalog view</p>
                    <p className="mx-auto mt-2 max-w-xl whitespace-normal break-words text-sm leading-6 text-zinc-500 sm:text-base">
                      Try another search, adjust the catalog filters, or add a product when you are ready to build inventory.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {products.map((product, index) => {
              const quantity = Number(product.quantity || 0);
              const image = absoluteImageUrl(product.images?.[0]);

              return (
                <TableRow key={product.id} className="border-b border-zinc-100 transition-colors hover:bg-zinc-50">
                  <TableCell className="px-4 py-3 text-xs font-semibold text-zinc-400">{start + index}</TableCell>
                  <TableCell className="min-w-64 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/dashboard/products/${product.id}`} className="relative size-11 shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100">
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={image} alt={product.title} className="size-full object-cover" />
                        ) : (
                          <PackageSearch className="m-3 size-5 text-zinc-400" />
                        )}
                      </Link>
                      <div className="min-w-0">
                        <Link href={`/dashboard/products/${product.id}`} className="block truncate font-medium text-zinc-900 hover:underline">
                          {product.title}
                        </Link>
                        <p className="mt-0.5 truncate text-xs text-zinc-400">{product.hookId || product.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-zinc-600">{product.category?.name || "Uncategorized"}</TableCell>
                  <TableCell className="hidden px-4 py-3 lg:table-cell">
                    {product.managers?.length ? (
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-sm text-zinc-600">
                          {`${product.managers[0].firstName || ""} ${product.managers[0].lastName || ""}`.trim() || product.managers[0].email}
                        </span>
                        {product.managers.length > 1 && (
                          <span className="shrink-0 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-500">
                            +{product.managers.length - 1}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-sm text-zinc-300">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-zinc-600">{product.vendor?.businessName || "Hook catalog"}</TableCell>
                  <TableCell className="px-4 py-3 font-semibold text-zinc-900">{money(product.sellingPrice || 0)}</TableCell>
                  <TableCell className="px-4 py-3">
                    <span className={cn("text-sm font-semibold", stockTone(quantity))}>{quantity.toLocaleString()}</span>
                    {quantity > 0 && quantity < 10 && <span className="ml-2 text-xs text-amber-600">Low</span>}
                    {quantity <= 0 && <span className="ml-2 text-xs text-red-500">Out</span>}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <StatusBadge status={product.status} />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-zinc-400">
                    {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon-sm" onClick={() => setSelectedProduct(product)} aria-label={`Open actions for ${product.title}`}>
                      <MoreHorizontal size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-2 border-t border-zinc-200 px-4 py-2.5 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Showing {start} to {end} of {meta.total} products {isFetching && !isLoading ? "· refreshing" : ""}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-8 px-3" disabled={meta.page <= 1 || isFetching} onClick={() => onPageChange(meta.page - 1)}>
            <ChevronLeft size={14} />
          </Button>
          <Button size="sm" className="h-8 min-w-8 bg-zinc-900 px-2 text-white hover:bg-zinc-800">
            {meta.page}
          </Button>
          <span className="px-1">/ {meta.totalPages}</span>
          <Button variant="outline" size="sm" className="h-8 px-3" disabled={meta.page >= meta.totalPages || isFetching} onClick={() => onPageChange(meta.page + 1)}>
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>

      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="max-w-sm gap-4 rounded-lg p-5">
          <DialogHeader>
            <DialogTitle>Product actions</DialogTitle>
            <DialogDescription>{selectedProduct?.title}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Button asChild variant="outline" className="justify-start">
              <Link href={`/dashboard/products/${selectedProduct?.id}`}>
                <Eye size={15} /> View details
              </Link>
            </Button>
            <Button variant="outline" className="justify-start text-emerald-700" onClick={() => updateProduct("approve")}>
              <Check size={15} /> Approve product
            </Button>
            <Button variant="outline" className="justify-start text-amber-700" onClick={() => updateProduct("reject")}>
              <XCircle size={15} /> Reject product
            </Button>
            <Button variant="outline" className="justify-start text-red-700" onClick={() => updateProduct("disable")}>
              <Ban size={15} /> Disable product
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
