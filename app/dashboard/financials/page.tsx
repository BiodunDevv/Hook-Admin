"use client";

import { useState } from "react";
import {
  TrendingUp,
  Wallet,
  Banknote,
  Clock,
  Search,
  Filter,
  Calendar,
  Download,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { KpiCard } from "@/components/shared/KpiCard";
import { Input } from "@/components/ui/input";
import { TransactionTable } from "@/components/financials/TransactionTable";
import { cn } from "@/lib/utils";
import { useApiQuery } from "@/lib/query";
import { SuperAdminGuard } from "@/components/auth/PermissionGuard";
import { money } from "@/lib/admin-utils";
import { HookLoader } from "@/components/shared/HookLoader";

const TIME_TABS = ["24H", "7D", "30D", "YTD"];

interface FinancialsSummary {
  grossVolume: number;
  platformRevenue: number;
  escrowBalance: number;
  pendingPayouts: number;
  recentPayments: unknown[];
  recentSettlements: unknown[];
}

export default function FinancialsPage() {
  const [activeTime, setActiveTime] = useState("7D");
  const { data, isLoading, error } = useApiQuery<FinancialsSummary>(["admin", "financials"], "/admin/financials");

  const kpis = {
    grossVolume: data?.grossVolume ?? 0,
    escrowBalance: data?.escrowBalance ?? 0,
    platformRevenue: data?.platformRevenue ?? 0,
    pendingPayouts: data?.pendingPayouts ?? 0,
  };

  const errorMessage = error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "";

  return (
    <div className="p-2 sm:p-4">
      <PageHeader
        title="Financial Controls"
        description="Manage platform revenue, vendor payouts, and escrow balances."
        actions={
          <>
            <div className="flex items-center rounded-lg border border-zinc-200 bg-white p-1 shadow-sm">
              {TIME_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTime(tab)}
                  className={cn(
                    "rounded-md px-2 py-1 text-xs font-medium transition-colors sm:px-3 sm:py-1.5 sm:text-sm",
                    activeTime === tab
                      ? "border border-zinc-200 bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900",
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2">
              <Calendar size={16} className="text-zinc-500" /> Select range
            </Button>
            <SuperAdminGuard>
              <Button variant="brand" size="sm" className="flex items-center gap-2">
                <Download size={18} /> <span className="hidden sm:inline">Export Statement</span>
              </Button>
            </SuperAdminGuard>
          </>
        }
      />

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </div>
      )}

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {isLoading ? (
          <div className="col-span-2 rounded-xl border border-border bg-card py-8 lg:col-span-4">
            <HookLoader size="page" label="Loading financial stats..." />
          </div>
        ) : (
          <>
            <KpiCard icon={TrendingUp} tone="green" label="Total Processed Vol." value={money(kpis.grossVolume)} caption="Gross payment volume" />
            <KpiCard icon={Wallet} tone="blue" label="Escrow Balance" value={money(kpis.escrowBalance)} caption="Pending release" />
            <KpiCard icon={Banknote} tone="amber" label="Platform Revenue" value={money(kpis.platformRevenue)} caption="After commissions" />
            <KpiCard icon={Clock} tone="red" label="Pending Payouts" value={money(kpis.pendingPayouts)} caption="Awaiting vendor transfer" />
          </>
        )}
      </div>

      {/* Main Layout Area */}
      <div className="flex flex-col gap-4 lg:flex-row lg:h-125">
        {/* Left Column: Chart */}
        <Card className="flex flex-col border-zinc-200 p-4 shadow-card sm:p-6 lg:w-[55%]">
          <div className="mb-5 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-zinc-900">Volume & Revenue Analysis</h3>
              <p className="text-sm text-zinc-500">Transaction volume vs Platform revenue over time</p>
            </div>
            <div className="flex items-center gap-4 text-sm font-medium text-zinc-600">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-zinc-800" /> Volume
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-brand-gold" /> Revenue
              </div>
            </div>
          </div>

          {/* Chart Area */}
          <div className="relative flex min-h-50 flex-1 flex-col sm:min-h-0">
            <div className="absolute inset-0 flex flex-col justify-between pb-6 text-xs text-zinc-400">
              {["₦10.0M", "₦7.5M", "₦5.0M", "₦2.5M", "₦0.0M"].map((val, i) => (
                <div key={i} className="flex w-full items-center gap-3">
                  <span className="w-10 text-left">{val}</span>
                  <div className="flex-1 border-b border-dashed border-zinc-200" />
                </div>
              ))}
            </div>

            <div className="pointer-events-none absolute inset-0 left-13 right-0 pb-6">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
                <defs>
                  <linearGradient id="revenue-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFC107" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#FFC107" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 100 L 0 55 C 15 45, 25 55, 40 50 C 55 45, 65 25, 80 15 C 90 8, 95 5, 100 5 L 100 100 Z"
                  fill="url(#revenue-gradient)"
                />
                <path
                  d="M 0 55 C 15 45, 25 55, 40 50 C 55 45, 65 25, 80 15 C 90 8, 95 5, 100 5"
                  fill="none"
                  stroke="#FFC107"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div className="mt-auto flex justify-between pl-13 pr-2 pt-3 text-xs text-zinc-400">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
          </div>
        </Card>

        {/* Right Column: Transactions List */}
        <Card className="flex flex-1 flex-col overflow-hidden border-zinc-200 p-4 shadow-card sm:p-6">
          <div className="mb-4 flex items-center justify-between sm:mb-5">
            <h3 className="text-base font-bold text-zinc-900">Recent Payouts & Transfers</h3>
            <button className="text-sm font-semibold text-amber-600 hover:underline">View All</button>
          </div>

          <div className="mb-4 flex gap-2 sm:mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <Input type="text" placeholder="Search transactions..." className="pl-9" />
            </div>
            <Button variant="outline" size="sm" className="p-2">
              <Filter size={18} />
            </Button>
          </div>

          <div className="overflow-x-auto">
            <TransactionTable />
          </div>
        </Card>
      </div>
    </div>
  );
}
