"use client";

import Link from "next/link";
import { Award, Download, Gauge, Plus, Store, Wallet } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { VendorsTable, VendorRow } from "@/components/vendors/VendorsTable";
import { VendorFilters } from "@/components/vendors/VendorFilters";
import { KpiCard } from "@/components/shared/KpiCard";
import { useApiQuery } from "@/lib/query";
import { money, number, queryString, useUrlFilters, type Page } from "@/lib/admin-utils";

function csvEscape(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export default function VendorsPage() {
  const filters = useUrlFilters({ page: "1", search: "", status: "all", tier: "all" });
  const page = filters.get("page") || "1";
  const search = filters.get("search") || "";
  const status = filters.get("status") || "all";
  const tier = filters.get("tier") || "all";
  const path = `/admin/vendors${queryString({ page, limit: 12, search, status, tier })}`;
  const queryKey = ["admin", "vendors", page, search, status, tier] as const;
  const { data } = useApiQuery<Page<VendorRow>>(queryKey, path);
  const stats = data?.stats || {};

  function setFilter(key: string, value: string) {
    filters.set({ [key]: value, page: 1 });
  }

  function exportCsv() {
    const rows = data?.data || [];
    if (!rows.length) {
      toast.info("There are no vendors to export for this view.");
      return;
    }

    const header = ["Business", "Owner", "Email", "Tier", "Approved", "Active"];
    const body = rows.map((vendor) => {
      const owner = `${vendor.owner?.firstName || ""} ${vendor.owner?.lastName || ""}`.trim() || vendor.owner?.email || "Owner";
      return [vendor.businessName, owner, vendor.businessEmail, vendor.tier, vendor.isApproved, vendor.isActive].map(csvEscape).join(",");
    });
    const url = URL.createObjectURL(new Blob([[header.join(","), ...body].join("\n")], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `hook-vendors-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Vendors CSV exported.");
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] overflow-y-auto p-2 pb-6 sm:p-4 sm:pb-8">
      <PageHeader
        title="Vendor Ecosystem"
        description="Monitor partner performance, compliance, and revenue generation."
        actions={
          <>
            <PermissionGuard permission="vendors.view">
              <Button type="button" variant="outline" size="sm" className="flex items-center gap-1.5" onClick={exportCsv}>
                <Download size={15} /> <span className="hidden sm:inline">Export CSV</span>
              </Button>
            </PermissionGuard>
            <PermissionGuard permission="vendors.edit">
              <Button asChild variant="ink" size="sm" className="flex items-center gap-1.5">
                <Link href="/dashboard/vendors/new">
                  <Plus size={16} /> Onboard Vendor
                </Link>
              </Button>
            </PermissionGuard>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={Store} tone="blue" label="Active Vendors" value={number(stats.active)} caption={`${number(stats.total)} total`} />
        <KpiCard icon={Wallet} tone="green" label="Network GMV" value={money(stats.gmv)} caption="From fulfilled items" />
        <KpiCard icon={Gauge} tone="amber" label="Pending Review" value={number(stats.pending)} caption="Needs approval" />
        <KpiCard icon={Award} tone="purple" label="Tier 1 Partners" value={number(stats.tierOne)} caption="Top integration tier" />
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-card">
        <VendorFilters
          search={search}
          status={status}
          tier={tier}
          onSearchChange={(value) => setFilter("search", value)}
          onStatusChange={(value) => setFilter("status", value)}
          onTierChange={(value) => setFilter("tier", value)}
          onClear={() => filters.set({ search: "", status: "all", tier: "all", page: 1 })}
        />
        <VendorsTable queryKey={queryKey} path={path} onPageChange={(nextPage) => filters.set({ page: nextPage })} />
      </div>
    </div>
  );
}
