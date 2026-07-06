"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  Clock,
  Filter,
  MoreVertical,
  PieChart,
  ShoppingBag,
  Users,
  BarChart3,
  Calendar,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { KpiCard } from "@/components/shared/KpiCard";
import { ReportCard } from "@/components/reports/ReportCard";
import type { Report } from "@/components/reports/ReportCard";
import { apiGet } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { money, number } from "@/lib/admin-utils";

const tabs = ["Overview", "Sales", "Vendors", "Customers", "Logistics"];

interface ApiReport { id: string; type?: string; createdAt?: string; status?: string; }
interface PageData<T> { data: T[]; total?: number; }

interface DashboardMetric { value: number; change: number; caption: string; }
interface DashboardSummary {
  grossMerchandise: DashboardMetric;
  activeOrders: DashboardMetric;
  deliverySla: DashboardMetric;
}

const categories = [
  { name: "Sneakers", color: "bg-zinc-900", width: "w-[85%]" },
  { name: "Vintage Wear", color: "bg-brand-gold", width: "w-[65%]" },
  { name: "Accessories", color: "bg-slate-700", width: "w-[35%]" },
  { name: "Streetwear", color: "bg-slate-500", width: "w-[45%]" },
  { name: "Beauty", color: "bg-slate-400", width: "w-[15%]" },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [reports, setReports] = useState<Report[]>([]);

  const { data: dashData } = useApiQuery<DashboardSummary>(["admin", "dashboard"], "/admin/dashboard");
  const { data: customersData } = useApiQuery<PageData<unknown>>(["admin", "customers", "total"], "/admin/customers?limit=1");

  const gmv = dashData?.grossMerchandise?.value ?? null;
  const totalOrders = dashData?.activeOrders?.value ?? null;
  const deliverySla = dashData?.deliverySla?.value ?? null;
  const totalBuyers = customersData?.total ?? null;

  useEffect(() => {
    apiGet<PageData<ApiReport>>("/admin/reports")
      .then((result) => setReports(result.data.map((report, index) => ({
        id: index + 1,
        title: `${report.type || "Platform"} report`,
        date: report.createdAt ? new Date(report.createdAt).toLocaleDateString() : "Just now",
        author: "System Auto",
        size: "Pending",
        type: "pdf",
        iconColor: "text-red-500",
        iconBg: "bg-red-50",
      }))))
      .catch(() => setReports([]));
  }, []);

  return (
    <div className="flex flex-col p-2 sm:p-4">
      <PageHeader
        title="Advanced Reports"
        description="Analyze marketplace performance, generate custom insights, and export data."
        actions={
          <>
            <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2">
              <Calendar size={16} className="text-zinc-500" /> Last 30 Days
            </Button>
            <Button variant="ink" size="sm" className="flex items-center gap-2">
              <BarChart3 size={18} /> <span className="hidden sm:inline">Generate Custom Report</span>
            </Button>
          </>
        }
      />

      {/* Tabs */}
      <div className="mb-4 flex overflow-x-auto gap-4 border-b border-zinc-200 sm:gap-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 pb-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "border-b-2 border-brand-gold font-semibold text-zinc-900"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={TrendingUp}
          tone="amber"
          label="Gross Merchandise Value"
          value={gmv !== null ? money(gmv) : "—"}
          caption="Platform-wide sales volume"
        />
        <KpiCard
          icon={Users}
          tone="blue"
          label="Total Customers"
          value={totalBuyers !== null ? number(totalBuyers) : "—"}
          caption="Registered shoppers"
        />
        <KpiCard
          icon={ShoppingBag}
          tone="green"
          label="Active Orders"
          value={totalOrders !== null ? number(totalOrders) : "—"}
          caption="Orders in progress"
        />
        <KpiCard
          icon={Clock}
          tone="zinc"
          label="Delivery SLA"
          value={deliverySla !== null ? `${deliverySla.toFixed(1)}%` : "—"}
          caption="On-time delivery rate"
        />
      </div>

      {/* Charts Row */}
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:h-95">
        {/* Left Chart: Area */}
        <Card className="flex flex-col border-zinc-200 p-4 shadow-card sm:p-6 lg:w-[65%]">
          <div className="mb-4 flex items-start justify-between sm:mb-4">
            <div>
              <h3 className="text-base font-bold text-zinc-900">GMV vs Orders Trend</h3>
              <p className="text-sm text-zinc-500">Platform-wide performance over the last 7 weeks</p>
            </div>
            <button className="text-zinc-400 hover:text-zinc-600">
              <MoreVertical size={18} />
            </button>
          </div>

          <div className="relative flex min-h-45 flex-1 flex-col sm:min-h-0">
            <div className="absolute inset-0 flex flex-col justify-between pb-6 text-[11px] font-medium text-zinc-400">
              {["₦38M", "₦29M", "₦19M", "₦10M", "₦0M"].map((val, i) => (
                <div key={i} className="flex w-full items-center gap-3">
                  <span className="w-8 text-left">{val}</span>
                  <div className="flex-1 border-b border-dashed border-zinc-200" />
                </div>
              ))}
            </div>

            <div className="pointer-events-none absolute inset-0 left-11 right-0 pb-6">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
                <defs>
                  <linearGradient id="gmv-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFC107" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#FFC107" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 100 L 0 60 C 20 50, 30 65, 45 55 C 60 45, 75 30, 100 20 L 100 100 Z"
                  fill="url(#gmv-gradient)"
                />
                <path
                  d="M 0 60 C 20 50, 30 65, 45 55 C 60 45, 75 30, 100 20"
                  fill="none"
                  stroke="#FFC107"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div className="mt-auto flex justify-between pl-11 pt-3 text-[11px] font-medium text-zinc-400">
              {["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7"].map((week) => (
                <span key={week}>{week}</span>
              ))}
            </div>
          </div>
        </Card>

        {/* Right Chart: Horizontal Bars */}
        <Card className="flex flex-1 flex-col border-zinc-200 p-4 shadow-card sm:p-6">
          <div className="mb-4 flex items-start justify-between sm:mb-4">
            <div>
              <h3 className="text-base font-bold text-zinc-900">Sales by Category</h3>
              <p className="text-sm text-zinc-500">Top performing verticals</p>
            </div>
            <button className="text-zinc-400 hover:text-zinc-600">
              <PieChart size={18} />
            </button>
          </div>

          <div className="flex flex-1 flex-col justify-around gap-3">
            {categories.map((cat, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-right text-xs font-medium text-zinc-700 sm:w-24 sm:text-sm">{cat.name}</span>
                <div className="flex-1">
                  <div className={`h-4 rounded-md sm:h-5 ${cat.color} ${cat.width}`} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Generated Reports Library */}
      <Card className="flex flex-col border-zinc-200 shadow-card">
        <div className="flex items-center justify-between border-b border-zinc-100 p-4 sm:p-4">
          <div>
            <h3 className="text-base font-bold text-zinc-900">Generated Reports Library</h3>
            <p className="hidden text-sm text-zinc-500 sm:block">Access previously exported analytics and scheduled reports.</p>
          </div>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Filter size={16} /> Filter
          </Button>
        </div>

        <div className="flex flex-col divide-y divide-zinc-100">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      </Card>
    </div>
  );
}
