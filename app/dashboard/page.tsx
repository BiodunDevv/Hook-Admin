"use client";

import { useEffect, useMemo, useState } from "react";
import StatCard from "@/components/shared/StatCard";
import SalesTrendChart from "@/components/charts/SalesTrendChart";
import LiveOperations from "@/components/dashboard/LiveOperations";
import RecentOrders from "@/components/dashboard/RecentOrders";
import NegotiationPipeline from "@/components/charts/NegotiationPipeline";
import { HookLoader } from "@/components/shared/HookLoader";
import { apiGet } from "@/lib/api";
import type { StatCardData } from "@/lib/data";

interface DashboardMetric {
  value: number;
  change: number;
  caption: string;
}

interface DashboardSummary {
  grossMerchandise: DashboardMetric;
  totalRevenue: DashboardMetric;
  activeOrders: DashboardMetric;
  deliverySla: DashboardMetric;
  aiNegotiation: DashboardMetric;
  customerSatisfaction: DashboardMetric;
  activeVendors: DashboardMetric;
  activeDrivers: DashboardMetric;
}

type LegacyDashboardSummary = Partial<{
  vendors: { total: number; active?: number; pending: number };
  orders: { total: number; active?: number; pending: number; delivered: number; today: number };
  revenue: { total: number; grossMerchandise?: number };
  logistics: {
    activeDeliveries: number;
    totalDrivers: number;
    activeDrivers?: number;
    deliverySla?: number;
    averageDeliveryHours?: number;
  };
  negotiations: { total: number; accepted?: number; conversionRate?: number; averageSavings?: number };
  customers: { satisfactionScore: number; reviewCount: number };
}>;

function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

function formatNaira(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatChange(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function trendFor(value: number): StatCardData["trend"] {
  if (value > 0) return "up";
  if (value < 0) return "down";
  return "flat";
}

function metric(value = 0, change = 0, caption = ""): DashboardMetric {
  return { value: Number(value || 0), change: Number(change || 0), caption };
}

function isDashboardMetric(value: unknown): value is DashboardMetric {
  return Boolean(value && typeof value === "object" && "value" in value);
}

function normalizeDashboardSummary(payload: DashboardSummary | LegacyDashboardSummary): DashboardSummary {
  if (isDashboardMetric((payload as DashboardSummary).grossMerchandise)) {
    return payload as DashboardSummary;
  }

  const legacy = payload as LegacyDashboardSummary;
  return {
    grossMerchandise: metric(legacy.revenue?.grossMerchandise ?? legacy.revenue?.total, 0, "vs last month"),
    totalRevenue: metric(legacy.revenue?.total, 0, "vs last month"),
    activeOrders: metric(legacy.orders?.active ?? legacy.orders?.pending, 0, "vs last day"),
    deliverySla: metric(legacy.logistics?.deliverySla, 0, `avg ${legacy.logistics?.averageDeliveryHours ?? 0}h delivery`),
    aiNegotiation: metric(legacy.negotiations?.conversionRate, 0, `avg ${formatNaira(legacy.negotiations?.averageSavings ?? 0)} saved`),
    customerSatisfaction: metric(legacy.customers?.satisfactionScore, 0, `from ${formatNumber(legacy.customers?.reviewCount ?? 0)} reviews`),
    activeVendors: metric(legacy.vendors?.active ?? legacy.vendors?.total, 0, "across 8 cities"),
    activeDrivers: metric(legacy.logistics?.activeDrivers ?? legacy.logistics?.totalDrivers, -1.2, "0% utilization"),
  };
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    apiGet<DashboardSummary | LegacyDashboardSummary>("/admin/dashboard")
      .then((data) => {
        if (mounted) setSummary(normalizeDashboardSummary(data));
      })
      .catch((err: unknown) => {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load dashboard");
      });

    return () => {
      mounted = false;
    };
  }, []);

  const statCards = useMemo<StatCardData[]>(() => {
    if (!summary) return [];

    return [
      {
        label: "Gross Merchandise",
        value: formatNaira(summary.grossMerchandise.value),
        delta: formatChange(summary.grossMerchandise.change),
        trend: trendFor(summary.grossMerchandise.change),
        caption: summary.grossMerchandise.caption,
        sparkline: [2, 4, 3, 6, 5, 7, 8],
      },
      {
        label: "Total Revenue",
        value: formatNaira(summary.totalRevenue.value),
        delta: formatChange(summary.totalRevenue.change),
        trend: trendFor(summary.totalRevenue.change),
        caption: summary.totalRevenue.caption,
        sparkline: [3, 5, 6, 5, 7, 8, 10],
      },
      {
        label: "Active Orders",
        value: formatNumber(summary.activeOrders.value),
        delta: formatChange(summary.activeOrders.change),
        trend: trendFor(summary.activeOrders.change),
        caption: summary.activeOrders.caption,
        sparkline: [3, 3, 4, 4, 5, 4, 5],
      },
      {
        label: "Delivery SLA",
        value: `${summary.deliverySla.value}%`,
        delta: formatChange(summary.deliverySla.change),
        trend: trendFor(summary.deliverySla.change),
        caption: summary.deliverySla.caption,
        sparkline: [8, 8, 8, 8, 8, 8, 8],
      },
      {
        label: "AI Negotiation",
        value: `${summary.aiNegotiation.value}%`,
        delta: formatChange(summary.aiNegotiation.change),
        trend: trendFor(summary.aiNegotiation.change),
        caption: summary.aiNegotiation.caption,
        sparkline: [4, 5, 5, 6, 7, 7, 8],
      },
      {
        label: "Customer Satisfaction",
        value: `${summary.customerSatisfaction.value}/5`,
        delta: formatChange(summary.customerSatisfaction.change),
        trend: trendFor(summary.customerSatisfaction.change),
        caption: summary.customerSatisfaction.caption,
        sparkline: [7, 7, 7, 7, 7, 7, 7],
      },
      {
        label: "Active Vendors",
        value: formatNumber(summary.activeVendors.value),
        delta: formatChange(summary.activeVendors.change),
        trend: trendFor(summary.activeVendors.change),
        caption: summary.activeVendors.caption,
        sparkline: [1, 2, 3, 4, 5, 6, 7],
      },
      {
        label: "Active Drivers",
        value: formatNumber(summary.activeDrivers.value),
        delta: formatChange(summary.activeDrivers.change),
        trend: trendFor(summary.activeDrivers.change),
        caption: summary.activeDrivers.caption,
        sparkline: [8, 8, 8, 8, 8, 8, 8],
      },
    ];
  }, [summary]);

  return (
    <div className="px-4 py-4">
      <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl">Overview</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Here&apos;s what&apos;s happening today.
      </p>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {!summary && !error && (
          <div className="col-span-full rounded-lg border border-zinc-200 bg-white py-12">
            <HookLoader size="page" label="Loading dashboard stats..." />
          </div>
        )}
        {error && (
          <div className="col-span-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {statCards.map((stat) => (
          <StatCard key={stat.label} data={stat} />
        ))}
      </div>

      {/* Sales trend + live ops */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesTrendChart />
        </div>
        <LiveOperations />
      </div>

      {/* Recent orders + negotiation pipeline */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentOrders />
        </div>
        <NegotiationPipeline />
      </div>
    </div>
  );
}
