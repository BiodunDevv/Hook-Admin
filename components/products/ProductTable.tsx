"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, Ban, Check, ChevronRight, MoreHorizontal, Pencil, Trash2, XCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { PermissionGuard, SuperAdminGuard } from "@/components/auth/PermissionGuard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { money } from "@/lib/admin-utils";
import { cn } from "@/lib/utils";
import type { ProductRow } from "./product-types";

function absoluteImageUrl(url?: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1").replace(/\/api\/v1\/?$/, "");
  return `${base}${url}`;
}

const displayStatus = (status: string) => (["published", "approved"].includes(status.toLowerCase()) ? "active" : status);
const canReview = (status?: string) => !["published", "approved", "active", "disabled"].includes((status || "").toLowerCase());

export type ColumnKey = "market" | "price" | "stock" | "status" | "activity" | "updated";
export const COLUMN_LABELS: Record<ColumnKey, string> = { market: "Market", price: "Price", stock: "Stock", status: "Status", activity: "Orders / views", updated: "Updated" };

/** The thumbnail shows the cover image, with a "+N" chip when the product has more pictures. */
function Thumb({ product }: { product: ProductRow }) {
  const images = product.images || [];
  const cover = absoluteImageUrl(images[0]);
  return (
    <span className="relative block size-11 shrink-0 overflow-hidden rounded-lg border bg-zinc-100">
      {cover ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={cover} alt="" loading="lazy" className="size-full object-cover" /> : null}
      {images.length > 1 ? <span className="absolute bottom-0 right-0 rounded-tl-md bg-black/70 px-1 text-[10px] font-semibold leading-4 text-white">+{images.length - 1}</span> : null}
    </span>
  );
}

function SortHead({ label, field, sort, dir, onSort, className }: { label: string; field: string; sort: string; dir: string; onSort: (field: string) => void; className?: string }) {
  const active = sort === field;
  return (
    <th className={cn("px-3 py-2.5 text-left font-medium", className)} aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={() => onSort(field)} className={cn("inline-flex items-center gap-1 hover:text-zinc-900", active && "text-zinc-900")}>
        {label}
        {active ? (dir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : null}
      </button>
    </th>
  );
}

/**
 * A dense product table: one row per product, so a page of 50 or 100 fits on screen. The thumbnail carries a "+N"
 * count for extra pictures; columns can be hidden; rows can be selected for bulk actions.
 */
export function ProductTable({
  products,
  columns,
  selected,
  onToggle,
  onToggleAll,
  sort,
  dir,
  onSort,
  onApprove,
  onReject,
  onDisable,
  onDelete,
}: {
  products: ProductRow[];
  columns: Record<ColumnKey, boolean>;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  sort: string;
  dir: string;
  onSort: (field: string) => void;
  onApprove: (product: ProductRow) => void;
  onReject: (product: ProductRow) => void;
  onDisable: (product: ProductRow) => void;
  onDelete: (product: ProductRow) => void;
}) {
  const allSelected = products.length > 0 && products.every((product) => selected.has(product.id));
  return (
    <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="w-full min-w-[860px] text-sm">
        <thead className="sticky top-0 z-10 bg-zinc-50 text-xs text-zinc-500 shadow-[0_1px_0_0_theme(colors.zinc.200)]">
          <tr>
            <th className="w-10 px-3 py-2.5"><Checkbox checked={allSelected} onCheckedChange={(value) => onToggleAll(Boolean(value))} aria-label="Select all products on this page" /></th>
            <SortHead label="Product" field="title" sort={sort} dir={dir} onSort={onSort} />
            <th className="px-3 py-2.5 text-left font-medium">Category</th>
            {columns.market ? <th className="px-3 py-2.5 text-left font-medium">Market</th> : null}
            {columns.price ? <SortHead label="Price" field="sellingPrice" sort={sort} dir={dir} onSort={onSort} className="text-right" /> : null}
            {columns.stock ? <SortHead label="Stock" field="quantity" sort={sort} dir={dir} onSort={onSort} /> : null}
            {columns.status ? <th className="px-3 py-2.5 text-left font-medium">Status</th> : null}
            {columns.activity ? <SortHead label="Orders / views" field="orderCount" sort={sort} dir={dir} onSort={onSort} /> : null}
            {columns.updated ? <SortHead label="Updated" field="updatedAt" sort={sort} dir={dir} onSort={onSort} /> : null}
            <th className="w-10 px-2 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {products.map((product) => {
            const quantity = Number(product.quantity || 0);
            return (
              <tr key={product.id} className={cn("group hover:bg-zinc-50", selected.has(product.id) && "bg-amber-50/60")}>
                <td className="px-3 py-2"><Checkbox checked={selected.has(product.id)} onCheckedChange={() => onToggle(product.id)} aria-label={`Select ${product.title}`} /></td>
                <td className="px-3 py-2">
                  <Link href={`/dashboard/products/${product.id}`} className="flex min-w-0 items-center gap-3 outline-none">
                    <Thumb product={product} />
                    <span className="min-w-0">
                      <span className="block max-w-[280px] truncate font-medium text-zinc-900 group-hover:underline">{product.title}</span>
                      <span className="block font-mono text-[11px] text-zinc-400">{product.hookId || product.id.slice(0, 8)}</span>
                    </span>
                  </Link>
                </td>
                <td className="px-3 py-2 text-zinc-600">
                  {product.category?.name ? (
                    <span className="inline-flex max-w-[210px] items-center gap-1 truncate">
                      {product.category.parentName ? <><span className="truncate text-zinc-400">{product.category.parentName}</span><ChevronRight size={11} className="shrink-0 text-zinc-300" /></> : null}
                      <span className="truncate font-medium text-zinc-700">{product.category.name}</span>
                    </span>
                  ) : <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700">Needs a category</span>}
                </td>
                {columns.market ? <td className="max-w-[150px] truncate px-3 py-2 text-zinc-600">{product.marketName || "—"}</td> : null}
                {columns.price ? <td className="px-3 py-2 text-right tabular-nums font-medium">{money(product.sellingPrice)}</td> : null}
                {columns.stock ? (
                  <td className="px-3 py-2">
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums", quantity <= 0 ? "bg-red-50 text-red-700" : quantity < 10 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700")}>
                      {quantity <= 0 ? "Out" : quantity}
                    </span>
                  </td>
                ) : null}
                {columns.status ? <td className="px-3 py-2"><StatusBadge status={displayStatus(product.status)} /></td> : null}
                {columns.activity ? <td className="px-3 py-2 text-xs tabular-nums text-zinc-500">{Number(product.orderCount || 0)} / {Number(product.viewCount || 0)}</td> : null}
                {columns.updated ? <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-500">{product.updatedAt ? new Date(product.updatedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" }) : "—"}</td> : null}
                <td className="px-2 py-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`Actions for ${product.title}`}><MoreHorizontal size={16} /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem asChild><Link href={`/dashboard/products/${product.id}`}><Pencil size={14} /> View / edit</Link></DropdownMenuItem>
                      <PermissionGuard permission="products.review">
                        {canReview(product.status) ? <DropdownMenuItem onClick={() => onApprove(product)}><Check size={14} /> Approve</DropdownMenuItem> : null}
                        {canReview(product.status) ? <DropdownMenuItem onClick={() => onReject(product)}><XCircle size={14} /> Reject</DropdownMenuItem> : null}
                      </PermissionGuard>
                      <PermissionGuard permission="products.edit">
                        {product.status !== "disabled" ? <DropdownMenuItem onClick={() => onDisable(product)}><Ban size={14} /> Disable</DropdownMenuItem> : null}
                      </PermissionGuard>
                      {product.status === "disabled" ? (
                        <SuperAdminGuard>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(product)}><Trash2 size={14} /> Delete</DropdownMenuItem>
                        </SuperAdminGuard>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
