"use client";

import { useState } from "react";
import { Gift, Users, TrendingUp, RefreshCcw, UserRoundCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchInput } from "@/components/shared/SearchInput";
import { CustomersTable } from "@/components/customers/CustomersTable";
import { GiftCreditDialog } from "@/components/customers/GiftCreditDialog";
import { KpiCard } from "@/components/shared/KpiCard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useApiQuery } from "@/lib/query";
import { number, type Page } from "@/lib/admin-utils";

interface CustomerRow {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: string;
}

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [giftOpen, setGiftOpen] = useState(false);
  const endpoint = `/admin/customers?limit=100${search.trim() ? `&search=${encodeURIComponent(search.trim())}` : ""}`;
  const query = useApiQuery<Page<CustomerRow>>(["admin", "customers", search], endpoint);
  const data = query.data;
  const customers = data?.data || [];

  return (
    <div className="w-full space-y-5 px-4 py-5">
      <PageHeader
        className="mb-0"
        title="Customer Directory"
        description="Review customer identity, account access, verification, and delivery readiness from one workspace."
        actions={
          <>
            <SearchInput placeholder="Search customers..." value={search} onChange={setSearch} className="w-full sm:w-64 lg:w-[300px]" />
            <PermissionGuard permission="credits.adjust">
              <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => setGiftOpen(true)}><Gift size={15} /> Gift Hook credit</Button>
            </PermissionGuard>
            <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => void query.refetch()} disabled={query.isFetching}><RefreshCcw size={15} className={query.isFetching ? "animate-spin" : ""} /> Refresh</Button>
          </>
        }
      />
      <GiftCreditDialog open={giftOpen} onOpenChange={setGiftOpen} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <KpiCard icon={Users} tone="zinc" label="Total customers" value={number(data?.total)} caption={search.trim() ? "Matching this search" : "Registered accounts"} />
        <KpiCard icon={TrendingUp} tone="green" label="Active in view" value={number(customers.filter((customer) => customer.isActive).length)} caption="Loaded records" />
        <KpiCard icon={UserRoundCheck} tone="amber" label="Verified in view" value={number(customers.filter((customer) => customer.isEmailVerified).length)} caption="Loaded records" />
      </div>

      <Card className="gap-0 overflow-hidden py-0 shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-4 sm:px-6"><div><h3 className="text-base font-semibold text-foreground">Customer records</h3><p className="mt-0.5 text-sm text-muted-foreground">Select a row to inspect the full account record.</p></div>{query.isFetching && !query.isLoading ? <span className="text-xs text-muted-foreground">Refreshing…</span> : null}</div>
        <CustomersTable customers={customers} isLoading={query.isLoading} error={query.error} />
        <div className="flex items-center justify-between border-t px-5 py-3 text-sm text-muted-foreground sm:px-6"><span>Showing {customers.length} of {number(data?.total)} customers</span><span className="text-xs">Use search to narrow the directory</span></div>
      </Card>
    </div>
  );
}
