"use client";

import { useState } from "react";
import { Download, Plus, SlidersHorizontal, ChevronDown, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SearchInput } from "@/components/shared/SearchInput";
import { ProductsTable } from "@/components/products/ProductsTable";
import { cn } from "@/lib/utils";

export default function ProductsPage() {
  const [view, setView] = useState("all");

  return (
    <div className="px-4 py-4 sm:px-6 sm:py-6">
      <PageHeader
        title="Products"
        description="Manage inventory, pricing, and AI negotiation targets."
        actions={
          <>
            <Button variant="outline" size="sm" className="flex items-center gap-1.5">
              <Download size={15} /> <span className="hidden sm:inline">Export</span>
            </Button>
            <Button variant="ink" size="sm" className="flex items-center gap-1.5">
              <Plus size={16} /> Add Product
            </Button>
          </>
        }
      />

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-zinc-200 shadow-card">
          <CardContent className="p-4 sm:p-5">
            <p className="text-xs font-medium text-zinc-500">Total Products</p>
            <h3 className="mt-1 text-xl font-bold text-zinc-900 sm:text-2xl">12,405</h3>
            <p className="mt-2 text-xs text-zinc-400">+45 this week</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-200 shadow-card">
          <CardContent className="p-4 sm:p-5">
            <p className="text-xs font-medium text-zinc-500">Active Categories</p>
            <h3 className="mt-1 text-xl font-bold text-zinc-900 sm:text-2xl">32</h3>
            <p className="mt-2 text-xs text-zinc-400">Across 8 departments</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-200 shadow-card">
          <CardContent className="p-4 sm:p-5">
            <p className="text-xs font-medium text-zinc-500">Low Stock Alerts</p>
            <h3 className="mt-1 text-xl font-bold text-zinc-900 sm:text-2xl">184</h3>
            <p className="mt-2 flex items-center gap-1 text-xs text-amber-600">
              <AlertCircle size={12} /> Needs attention
            </p>
          </CardContent>
        </Card>
        <Card className="border-zinc-200 shadow-card">
          <CardContent className="p-4 sm:p-5">
            <p className="text-xs font-medium text-zinc-500">Top Vendors</p>
            <h3 className="mt-1 text-xl font-bold text-zinc-900 sm:text-2xl">145</h3>
            <p className="mt-2 text-xs text-zinc-400">Supplying 80% volume</p>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-card">
        {/* Controls */}
        <div className="flex flex-col gap-3 border-b border-zinc-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput placeholder="Search products, SKUs..." className="w-full sm:w-56 lg:w-64" />
            <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-zinc-600">
              <SlidersHorizontal size={14} /> Categories <ChevronDown size={12} className="text-zinc-300" />
            </Button>
            <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-1.5 text-zinc-600">
              <SlidersHorizontal size={14} /> Vendors <ChevronDown size={12} className="text-zinc-300" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-400 hidden sm:inline">View:</span>
            <div className="flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
              <button
                onClick={() => setView("all")}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium sm:text-sm",
                  view === "all" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500",
                )}
              >
                All
              </button>
              <button
                onClick={() => setView("low")}
                className={cn(
                  "flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium sm:text-sm",
                  view === "low" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500",
                )}
              >
                <AlertCircle size={12} className="text-amber-500" /> Low Stock
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <ProductsTable />
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-xs text-zinc-500 sm:px-5 sm:text-sm">
          <span>Showing 1 to 5 of 12,405 products</span>
        </div>
      </div>
    </div>
  );
}
