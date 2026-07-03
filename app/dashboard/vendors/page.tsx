"use client";

import { useState } from "react";
import { Download, Plus, SlidersHorizontal, ChevronDown, Shield, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SearchInput } from "@/components/shared/SearchInput";
import { VendorsTable } from "@/components/vendors/VendorsTable";
import { cn } from "@/lib/utils";

export default function VendorsPage() {
  const [filter, setFilter] = useState("all");

  return (
    <div className="px-4 py-4 sm:px-6 sm:py-6">
      <PageHeader
        title="Vendor Ecosystem"
        description="Monitor partner performance, compliance, and revenue generation."
        actions={
          <>
            <Button variant="outline" size="sm" className="flex items-center gap-1.5">
              <Download size={15} /> <span className="hidden sm:inline">Export Data</span>
            </Button>
            <Button variant="ink" size="sm" className="flex items-center gap-1.5">
              <Plus size={16} /> Onboard Vendor
            </Button>
          </>
        }
      />

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-zinc-200 shadow-card">
          <CardContent className="p-4 sm:p-5">
            <p className="text-xs font-medium text-zinc-500">Total Active Vendors</p>
            <h3 className="mt-1 text-xl font-bold text-zinc-900 sm:text-2xl">1,245</h3>
            <p className="mt-2 text-xs text-zinc-400">+12 this month</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-200 shadow-card">
          <CardContent className="p-4 sm:p-5">
            <p className="text-xs font-medium text-zinc-500">Network GMV</p>
            <h3 className="mt-1 text-xl font-bold text-zinc-900 sm:text-2xl">$4.2M</h3>
            <p className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
              <TrendingUp size={12} /> +14.2% vs last month
            </p>
          </CardContent>
        </Card>
        <Card className="border-zinc-200 shadow-card">
          <CardContent className="p-4 sm:p-5">
            <p className="text-xs font-medium text-zinc-500">Avg Fulfillment Rate</p>
            <h3 className="mt-1 text-xl font-bold text-zinc-900 sm:text-2xl">97.8%</h3>
            <p className="mt-2 text-xs text-zinc-400">+0.5% vs last month</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-200 shadow-card">
          <CardContent className="p-4 sm:p-5">
            <p className="text-xs font-medium text-zinc-500">Platinum Partners</p>
            <h3 className="mt-1 text-xl font-bold text-zinc-900 sm:text-2xl">184</h3>
            <p className="mt-2 text-xs text-zinc-400">Generating 65% revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-card">
        {/* Controls */}
        <div className="flex flex-col gap-3 border-b border-zinc-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput placeholder="Search vendors..." className="w-full sm:w-60 lg:w-72" />
            <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-1.5 text-zinc-600">
              <SlidersHorizontal size={14} /> Location <ChevronDown size={12} className="text-zinc-300" />
            </Button>
            <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-1.5 text-zinc-600">
              <Shield size={14} /> Tier <ChevronDown size={12} className="text-zinc-300" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-400 hidden sm:inline">Status:</span>
            <div className="flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
              {["all", "active", "warning"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium capitalize sm:px-3",
                    filter === f ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500",
                  )}
                >
                  {f === "all" ? "All" : f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <VendorsTable />
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-xs text-zinc-500 sm:px-5 sm:text-sm">
          <span>Showing 1 to 6 of 1,245 vendors</span>
        </div>
      </div>
    </div>
  );
}
