"use client";

import Link from "next/link";
import { AlertCircle, Boxes, Download, PackageCheck, Plus, Tags } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { ProductFilters } from "@/components/products/ProductFilters";
import { ProductRow, ProductsTable } from "@/components/products/ProductsTable";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useApiQuery } from "@/lib/query";
import { Page, number, queryString, useUrlFilters } from "@/lib/admin-utils";

interface CategoryOption {
  id: string;
  name: string;
}

interface VendorOption {
  id: string;
  businessName: string;
}

export default function ProductsPage() {
  const filters = useUrlFilters({
    page: "1",
    search: "",
    status: "all",
    categoryId: "all",
    vendorId: "all",
    stock: "all",
  });

  const page = Number(filters.get("page") || 1);
  const search = filters.get("search") || "";
  const status = filters.get("status") || "all";
  const categoryId = filters.get("categoryId") || "all";
  const vendorId = filters.get("vendorId") || "all";
  const stock = filters.get("stock") || "all";
  const listPath = `/admin/products${queryString({ page, limit: 12, search, status, categoryId, vendorId, stock })}`;
  const queryKey = ["admin", "products", page, search, status, categoryId, vendorId, stock] as const;

  const productsQuery = useApiQuery<Page<ProductRow>>(queryKey, listPath);
  const vendorsQuery = useApiQuery<Page<VendorOption>>(["admin", "product-vendor-options"], "/admin/vendors?limit=100");
  const categoriesQuery = useApiQuery<CategoryOption[]>(["admin", "product-category-options"], "/categories");

  const stats = productsQuery.data?.stats || {};
  const products = productsQuery.data?.data || [];
  const categories = categoriesQuery.data || [];
  const vendors = vendorsQuery.data?.data || [];

  function setFilter(key: string, value: string) {
    filters.set({ [key]: value, page: 1 });
  }

  function exportCsv() {
    if (!products.length) {
      toast.info("There are no products to export for this view.");
      return;
    }

    const rows = [
      ["Product", "Hook ID", "Category", "Vendor", "Hook Price", "Stock", "Status"],
      ...products.map((product) => [
        product.title,
        product.hookId || product.id,
        product.category?.name || "Uncategorized",
        product.vendor?.businessName || "No vendor",
        String(product.sellingPrice || 0),
        String(product.quantity || 0),
        product.status,
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `hook-products-page-${page}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Product export downloaded.");
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] overflow-y-auto p-2 pb-6 sm:p-4 sm:pb-8">
      <PageHeader
        title="Products"
        description="Manage inventory, market pricing, Hook pricing, and AI negotiation floors."
        actions={
          <>
            <PermissionGuard permission="products.view">
              <Button type="button" variant="outline" size="sm" className="flex items-center gap-1.5" onClick={exportCsv}>
                <Download size={15} /> <span className="hidden sm:inline">Export CSV</span>
              </Button>
            </PermissionGuard>
            <PermissionGuard permission="products.edit">
              <Button asChild variant="ink" size="sm" className="flex items-center gap-1.5">
                <Link href="/dashboard/products/new">
                  <Plus size={16} /> Add Product
                </Link>
              </Button>
            </PermissionGuard>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Total Products"
          value={number(stats.total)}
          caption={`${number(stats.approved)} approved`}
          icon={Boxes}
          tone="blue"
        />
        <KpiCard
          label="Pending Review"
          value={number(stats.pendingApproval)}
          caption="Awaiting catalog decision"
          icon={PackageCheck}
          tone="amber"
        />
        <KpiCard
          label="Low Stock"
          value={number(stats.lowStock)}
          caption="Needs replenishment"
          icon={AlertCircle}
          tone="red"
        />
        <KpiCard
          label="Sold Out"
          value={number(stats.soldOut)}
          caption="Unavailable products"
          icon={Tags}
          tone="zinc"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-card">
        <ProductFilters
          search={search}
          status={status}
          categoryId={categoryId}
          vendorId={vendorId}
          stock={stock}
          categories={categories}
          vendors={vendors}
          onSearchChange={(value) => setFilter("search", value)}
          onStatusChange={(value) => setFilter("status", value)}
          onCategoryChange={(value) => setFilter("categoryId", value)}
          onVendorChange={(value) => setFilter("vendorId", value)}
          onStockChange={(value) => setFilter("stock", value)}
          onClear={() => filters.set({ search: "", status: "all", categoryId: "all", vendorId: "all", stock: "all", page: 1 })}
        />

        <ProductsTable queryKey={queryKey} path={listPath} onPageChange={(nextPage) => filters.set({ page: nextPage })} />
      </div>
    </div>
  );
}
