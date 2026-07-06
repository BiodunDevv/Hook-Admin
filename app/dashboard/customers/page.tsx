"use client";

import { Users, TrendingUp, Award, ShoppingBag, Filter, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchInput } from "@/components/shared/SearchInput";
import { CustomersTable } from "@/components/customers/CustomersTable";
import { KpiCard } from "@/components/shared/KpiCard";
import { useApiQuery } from "@/lib/query";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { number, type Page } from "@/lib/admin-utils";

interface CustomerRow {
  id: string;
  isActive: boolean;
  isEmailVerified: boolean;
}

export default function CustomersPage() {
  const { data } = useApiQuery<Page<CustomerRow>>(["admin", "customers", "summary"], "/admin/customers?limit=100");
  const customers = data?.data || [];

  return (
    <div className="p-2 sm:p-4">
      <PageHeader
        title="Customer Directory"
        description="Manage users, view purchase history, and segment your audience."
        actions={
          <>
            <SearchInput placeholder="Search customers..." className="hidden sm:block w-52 lg:w-[280px]" />
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Filter size={16} className="text-zinc-500" /> Filters
            </Button>
            <PermissionGuard permission="customers.view">
              <Button variant="brand" size="sm" className="flex items-center gap-2">
                <ArrowUpRight size={18} /> Export CSV
              </Button>
            </PermissionGuard>
          </>
        }
      />

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={Users} tone="blue" label="Total Customers" value={number(data?.total)} caption="All shoppers" />
        <KpiCard icon={TrendingUp} tone="green" label="Active" value={number(customers.filter((customer) => customer.isActive).length)} caption="Approx. first 100" />
        <KpiCard icon={Award} tone="amber" label="Verified" value={number(customers.filter((customer) => customer.isEmailVerified).length)} caption="Approx. first 100" />
        <KpiCard icon={ShoppingBag} tone="purple" label="Suspended" value={number(customers.filter((customer) => !customer.isActive).length)} caption="Approx. first 100" />
      </div>

      {/* Table */}
      <Card className="border-zinc-200 shadow-card">
        <div className="overflow-x-auto">
          <CustomersTable />
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-zinc-200 p-4 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <div>
            Showing <span className="font-semibold text-zinc-900">1</span> to{" "}
            <span className="font-semibold text-zinc-900">5</span> of{" "}
            <span className="font-semibold text-zinc-900">{number(data?.total)}</span> customers
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">Previous</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
