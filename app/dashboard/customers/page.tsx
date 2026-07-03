"use client";

import { Users, TrendingUp, Award, ShoppingBag, Filter, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SearchInput } from "@/components/shared/SearchInput";
import { CustomersTable } from "@/components/customers/CustomersTable";

export default function CustomersPage() {
  return (
    <div className="px-4 py-4 sm:px-6 sm:py-6">
      <PageHeader
        title="Customer Directory"
        description="Manage users, view purchase history, and segment your audience."
        actions={
          <>
            <SearchInput placeholder="Search customers..." className="hidden sm:block w-52 lg:w-[280px]" />
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Filter size={16} className="text-zinc-500" /> Filters
            </Button>
            <Button variant="brand" size="sm" className="flex items-center gap-2">
              <ArrowUpRight size={18} /> Export CSV
            </Button>
          </>
        }
      />

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-zinc-200 shadow-card">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500 sm:h-12 sm:w-12">
              <Users size={20} className="sm:hidden" />
              <Users size={24} className="hidden sm:block" />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-none text-zinc-900 sm:text-2xl">12,450</h3>
              <p className="mt-1 text-xs font-medium leading-tight text-zinc-500 sm:text-sm">
                Total Customers
                <br />
                <span className="text-xs font-normal text-zinc-400">+450 this month</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-card">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 sm:h-12 sm:w-12">
              <TrendingUp size={20} className="sm:hidden" />
              <TrendingUp size={24} className="hidden sm:block" />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-none text-zinc-900 sm:text-2xl">8,124</h3>
              <p className="mt-1 text-xs font-medium leading-tight text-zinc-500 sm:text-sm">
                Active (30 Days)
                <br />
                <span className="text-xs font-normal text-zinc-400">65% retention rate</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-card">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-brand-gold sm:h-12 sm:w-12">
              <Award size={20} className="sm:hidden" />
              <Award size={24} className="hidden sm:block" />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-none text-zinc-900 sm:text-2xl">842</h3>
              <p className="mt-1 text-xs font-medium leading-tight text-zinc-500 sm:text-sm">
                VIP Members
                <br />
                <span className="text-xs font-normal text-zinc-400">Spent &gt; ₦500k</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-card">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-500 sm:h-12 sm:w-12">
              <ShoppingBag size={20} className="sm:hidden" />
              <ShoppingBag size={24} className="hidden sm:block" />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-none text-zinc-900 sm:text-2xl">₦24,500</h3>
              <p className="mt-1 text-xs font-medium leading-tight text-zinc-500 sm:text-sm">
                Avg. Order Value
                <br />
                <span className="text-xs font-normal text-zinc-400">+12% vs last year</span>
              </p>
            </div>
          </CardContent>
        </Card>
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
            <span className="font-semibold text-zinc-900">12,450</span> customers
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
