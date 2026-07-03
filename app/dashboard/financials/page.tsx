"use client";

import { useState } from "react";
import {
  TrendingUp,
  Wallet,
  Banknote,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  Calendar,
  Download,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TransactionTable } from "@/components/financials/TransactionTable";
import { cn } from "@/lib/utils";

const TIME_TABS = ["24H", "7D", "30D", "YTD"];

export default function FinancialsPage() {
  const [activeTime, setActiveTime] = useState("7D");

  return (
    <div className="px-4 py-4 sm:px-6 sm:py-6">
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
              <Calendar size={16} className="text-zinc-500" /> Oct 12 - Oct 19
            </Button>
            <Button variant="brand" size="sm" className="flex items-center gap-2">
              <Download size={18} /> <span className="hidden sm:inline">Export Statement</span>
            </Button>
          </>
        }
      />

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-zinc-200 shadow-card">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 sm:h-12 sm:w-12">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold leading-none text-zinc-900 sm:text-2xl">₦45.2M</h3>
              <p className="mt-1 text-xs font-medium leading-tight text-zinc-500 sm:text-sm">
                Total Processed Vol.
                <br />
                <span className="mt-0.5 flex items-center gap-0.5 text-xs font-semibold text-emerald-500">
                  <ArrowUpRight size={12} /> +12.5%
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-card">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500 sm:h-12 sm:w-12">
              <Wallet size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold leading-none text-zinc-900 sm:text-2xl">₦12.4M</h3>
              <p className="mt-1 text-xs font-medium leading-tight text-zinc-500 sm:text-sm">
                Escrow Balance
                <br />
                <span className="mt-0.5 flex items-center gap-0.5 text-xs font-semibold text-emerald-500">
                  <ArrowUpRight size={12} /> Ready to release
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-card">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-brand-gold sm:h-12 sm:w-12">
              <Banknote size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold leading-none text-zinc-900 sm:text-2xl">₦6.78M</h3>
              <p className="mt-1 text-xs font-medium leading-tight text-zinc-500 sm:text-sm">
                Platform Revenue
                <br />
                <span className="mt-0.5 flex items-center gap-0.5 text-xs font-semibold text-emerald-500">
                  <ArrowUpRight size={12} /> +8.2%
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-card">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500 sm:h-12 sm:w-12">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold leading-none text-zinc-900 sm:text-2xl">₦3.15M</h3>
              <p className="mt-1 text-xs font-medium leading-tight text-zinc-500 sm:text-sm">
                Pending Payouts
                <br />
                <span className="mt-0.5 flex items-center gap-0.5 text-xs font-semibold text-red-500">
                  <ArrowDownRight size={12} /> 14 scheduled
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Layout Area */}
      <div className="flex flex-col gap-6 lg:flex-row lg:h-[500px]">
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
          <div className="relative flex min-h-[200px] flex-1 flex-col sm:min-h-0">
            <div className="absolute inset-0 flex flex-col justify-between pb-6 text-xs text-zinc-400">
              {["₦10.0M", "₦7.5M", "₦5.0M", "₦2.5M", "₦0.0M"].map((val, i) => (
                <div key={i} className="flex w-full items-center gap-3">
                  <span className="w-10 text-left">{val}</span>
                  <div className="flex-1 border-b border-dashed border-zinc-200" />
                </div>
              ))}
            </div>

            <div className="pointer-events-none absolute inset-0 left-[52px] right-0 pb-6">
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

            <div className="mt-auto flex justify-between pl-[52px] pr-2 pt-3 text-xs text-zinc-400">
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

          <div className="mb-4 flex gap-2 sm:mb-6">
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
