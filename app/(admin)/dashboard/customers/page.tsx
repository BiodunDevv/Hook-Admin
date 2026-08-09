"use client";

import { useState } from "react";
import { Users, TrendingUp, RefreshCcw, UserRoundCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchInput } from "@/components/shared/SearchInput";
import { CustomersTable } from "@/components/customers/CustomersTable";
import { KpiCard } from "@/components/shared/KpiCard";
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
            <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => void query.refetch()} disabled={query.isFetching}><RefreshCcw size={15} className={query.isFetching ? "animate-spin" : ""} /> Refresh</Button>
          </>
        }
      />

      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="border-l-4 border-l-brand-gold px-5 py-6 sm:px-7 sm:py-8">
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-zinc-950 text-brand-gold"><Users className="size-5" /></span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Customer health</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">A clearer view of every shopper.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Use the directory to open a customer record, understand account status, and take only the actions your permission allows.</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between bg-brand-gold px-5 py-6 text-zinc-950 sm:px-7 sm:py-8">
            <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-800">Directory total</p><p className="mt-2 text-3xl font-semibold">{number(data?.total)}</p></div>
            <p className="mt-6 text-sm text-zinc-800">{search.trim() ? "Matching customer records" : "Registered customer accounts"}</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <KpiCard icon={Users} tone="blue" label="Total customers" value={number(data?.total)} caption="Registered accounts" />
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
