"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  Boxes,
  Columns3,
  Download,
  LayoutGrid,
  PackageCheck,
  Rows3,
  Plus,
  Tags,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { ProductFilters } from "@/components/products/ProductFilters";
import { ProductGrid } from "@/components/products/ProductGrid";
import type { ProductRow } from "@/components/products/product-types";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COLUMN_LABELS, type ColumnKey } from "@/components/products/ProductTable";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useApiQuery } from "@/lib/query";
import { Page, number, queryString, useUrlFilters } from "@/lib/admin-utils";

interface CategoryOption {
  id: string;
  name: string;
}

export default function ProductsPage() {
  const filters = useUrlFilters({
    page: "1",
    search: "",
    status: "all",
    categoryId: "all",
    stock: "all",
    marketId: "all",
    source: "all",
    view: "table",
    limit: "50",
    sort: "createdAt",
    dir: "desc",
  });

  const page = Number(filters.get("page") || 1);
  const search = filters.get("search") || "";
  const status = filters.get("status") || "all";
  const categoryId = filters.get("categoryId") || "all";
  const stock = filters.get("stock") || "all";
  const marketId = filters.get("marketId") || "all";
  const source = filters.get("source") || "all";
  const view = filters.get("view") === "cards" ? "cards" : "table";
  const limit = [25, 50, 100].includes(Number(filters.get("limit"))) ? Number(filters.get("limit")) : 50;
  const sort = filters.get("sort") || "createdAt";
  const dir = filters.get("dir") === "asc" ? "asc" : "desc";
  const [columns, setColumns] = useState<Record<ColumnKey, boolean>>({ market: true, price: true, stock: true, status: true, activity: true, updated: true });
  // Remember which columns the admin hides.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("hook.products.columns");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setColumns((current) => ({ ...current, ...(JSON.parse(saved) as Record<ColumnKey, boolean>) }));
    } catch { /* a stored preference is a convenience only */ }
  }, []);
  function toggleColumn(key: ColumnKey) {
    setColumns((current) => {
      const next = { ...current, [key]: !current[key] };
      try { localStorage.setItem("hook.products.columns", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }
  const listPath = `/admin/products${queryString({ page, limit, search, status, categoryId, stock, sort, dir, marketId: marketId === "all" ? undefined : marketId, source: source === "all" ? undefined : source, fields: view === "table" ? "summary" : undefined })}`;
  const queryKey = [
    "admin",
    "products",
    page,
    search,
    status,
    categoryId,
    stock,
    marketId,
    source,
    limit,
    sort,
    dir,
    view,
  ] as const;

  const productsQuery = useApiQuery<Page<ProductRow>>(queryKey, listPath);
  const categoriesQuery = useApiQuery<{ data: CategoryOption[] }>(
    ["admin", "product-category-options"],
    "/admin/categories",
  );

  const marketsQuery = useApiQuery<{ data: Array<{ id: string; name: string }> }>(["admin", "markets", "product-options"], "/admin/markets?limit=200");
  const markets = marketsQuery.data?.data || [];
  const stats = productsQuery.data?.stats || {};
  const products = productsQuery.data?.data || [];
  const categories = categoriesQuery.data?.data || [];

  function setFilter(key: string, value: string) {
    filters.set({ [key]: value, page: 1 });
  }

  function exportCsv() {
    if (!products.length) {
      toast.info("There are no products to export for this view.");
      return;
    }

    const rows = [
      ["Product", "Hook ID", "Category", "Hook Price", "Stock", "Status"],
      ...products.map((product) => [
        product.title,
        product.hookId || product.id,
        product.category?.name || "Uncategorized",
        String(product.sellingPrice || 0),
        String(product.quantity || 0),
        product.status,
      ]),
    ];
    const csv = rows
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `hook-products-page-${page}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Product export downloaded.");
  }

  return (
    <div className="w-full space-y-5 px-4 py-5">
      <PageHeader
        className="mb-0"
        title="Products"
        description="Manage inventory, market pricing, Hook pricing, and AI negotiation floors."
        actions={
          <>
            <PermissionGuard permission="products.view">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5"
                onClick={exportCsv}
              >
                <Download size={15} />{" "}
                <span className="hidden sm:inline">Export CSV</span>
              </Button>
            </PermissionGuard>
            <PermissionGuard permission="products.edit">
              <Button
                asChild
                variant="brand"
                size="sm"
                className="flex items-center gap-1.5"
              >
                <Link href="/dashboard/products/new">
                  <Plus size={16} /> Add Product
                </Link>
              </Button>
            </PermissionGuard>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {([
          { key: "all", label: "Total Products", value: stats.total, caption: `${number(stats.approved)} active`, icon: Boxes, tone: "blue", apply: { status: "all", stock: "all" }, active: status === "all" && stock === "all" },
          { key: "pending", label: "Pending Review", value: stats.pendingApproval, caption: "Awaiting catalog decision", icon: PackageCheck, tone: "amber", apply: { status: "pending_approval", stock: "all" }, active: status === "pending_approval" },
          { key: "low", label: "Low Stock", value: stats.lowStock, caption: "Needs replenishment", icon: AlertCircle, tone: "red", apply: { status: "all", stock: "low" }, active: stock === "low" },
          { key: "sold", label: "Sold Out", value: stats.soldOut, caption: "Unavailable products", icon: Tags, tone: "zinc", apply: { status: "sold_out", stock: "all" }, active: status === "sold_out" },
        ] as const).map((card) => (
          <button key={card.key} type="button" onClick={() => filters.set({ ...card.apply, page: 1 })} aria-pressed={card.active} className={`rounded-xl text-left transition ${card.active ? "ring-2 ring-brand-gold" : "hover:ring-1 hover:ring-zinc-300"}`}>
            <KpiCard label={card.label} value={number(card.value)} caption={card.caption} icon={card.icon} tone={card.tone} />
          </button>
        ))}
      </div>

      <ProductFilters
        search={search}
        status={status}
        categoryId={categoryId}
        stock={stock}
        categories={categories}
        onSearchChange={(value) => setFilter("search", value)}
        onStatusChange={(value) => setFilter("status", value)}
        onCategoryChange={(value) => setFilter("categoryId", value)}
        onStockChange={(value) => setFilter("stock", value)}
        onClear={() =>
          filters.set({
            search: "",
            status: "all",
            categoryId: "all",
            stock: "all",
            marketId: "all",
            source: "all",
            page: 1,
          })
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border bg-white p-0.5">
          {(["table", "cards"] as const).map((mode) => (
            <button key={mode} type="button" onClick={() => filters.set({ view: mode })} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium capitalize ${view === mode ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"}`}>
              {mode === "table" ? <Rows3 size={13} /> : <LayoutGrid size={13} />} {mode}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={marketId} onValueChange={(value) => setFilter("marketId", value)}>
            <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue placeholder="All markets" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All markets</SelectItem>{markets.map((market) => <SelectItem key={market.id} value={market.id}>{market.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={source} onValueChange={(value) => setFilter("source", value)}>
            <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Any source" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any source</SelectItem>
              <SelectItem value="field_agent">Market Associate</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="partner">Partner</SelectItem>
              <SelectItem value="vendor">Vendor</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(limit)} onValueChange={(value) => filters.set({ limit: value, page: 1 })}>
            <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{[25, 50, 100].map((size) => <SelectItem key={size} value={String(size)}>{size} per page</SelectItem>)}</SelectContent>
          </Select>
          {view === "table" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs"><Columns3 size={13} /> Columns</Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {(Object.keys(COLUMN_LABELS) as ColumnKey[]).map((key) => (
                  <DropdownMenuCheckboxItem key={key} checked={columns[key]} onCheckedChange={() => toggleColumn(key)} onSelect={(event) => event.preventDefault()}>{COLUMN_LABELS[key]}</DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      <ProductGrid
        queryKey={queryKey}
        path={listPath}
        view={view}
        categories={categories}
        columns={columns}
        sort={sort}
        dir={dir}
        onSort={(field) => filters.set(sort === field ? { dir: dir === "asc" ? "desc" : "asc", page: 1 } : { sort: field, dir: "desc", page: 1 })}
        onPageChange={(nextPage) => filters.set({ page: nextPage })}
      />
    </div>
  );
}
