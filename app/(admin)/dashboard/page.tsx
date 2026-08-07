"use client";

import { useEffect, useMemo, useState } from "react";
import StatCard from "@/components/shared/StatCard";
import SalesTrendChart from "@/components/charts/SalesTrendChart";
import RecentOrders from "@/components/dashboard/RecentOrders";
import NegotiationPipeline from "@/components/charts/NegotiationPipeline";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryState } from "@/components/shared/QueryState";
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
  activeRunners: DashboardMetric;
  publishedProducts: DashboardMetric;
}

type LegacyDashboardSummary = Partial<{
  orders: {
    total: number;
    active?: number;
    pending: number;
    delivered: number;
    today: number;
  };
  revenue: { total: number; grossMerchandise?: number };
  logistics: { deliverySla?: number; averageDeliveryHours?: number };
  negotiations: {
    total: number;
    accepted?: number;
    conversionRate?: number;
    averageSavings?: number;
  };
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

function normalizeDashboardSummary(
  payload: DashboardSummary | LegacyDashboardSummary,
): DashboardSummary {
  if (isDashboardMetric((payload as DashboardSummary).grossMerchandise)) {
    return payload as DashboardSummary;
  }

  const legacy = payload as LegacyDashboardSummary;
  return {
    grossMerchandise: metric(
      legacy.revenue?.grossMerchandise ?? legacy.revenue?.total,
      0,
      "vs last month",
    ),
    totalRevenue: metric(legacy.revenue?.total, 0, "vs last month"),
    activeOrders: metric(
      legacy.orders?.active ?? legacy.orders?.pending,
      0,
      "vs last day",
    ),
    deliverySla: metric(
      legacy.logistics?.deliverySla,
      0,
      `avg ${legacy.logistics?.averageDeliveryHours ?? 0}h delivery`,
    ),
    aiNegotiation: metric(
      legacy.negotiations?.conversionRate,
      0,
      `avg ${formatNaira(legacy.negotiations?.averageSavings ?? 0)} saved`,
    ),
    customerSatisfaction: metric(
      legacy.customers?.satisfactionScore,
      0,
      `from ${formatNumber(legacy.customers?.reviewCount ?? 0)} reviews`,
    ),
    activeRunners: metric(0, 0, "market-side operations"),
    publishedProducts: metric(0, 0, "commercially approved"),
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
        if (mounted)
          setError(
            err instanceof Error ? err.message : "Failed to load dashboard",
          );
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
      },
      {
        label: "Total Revenue",
        value: formatNaira(summary.totalRevenue.value),
        delta: formatChange(summary.totalRevenue.change),
        trend: trendFor(summary.totalRevenue.change),
        caption: summary.totalRevenue.caption,
      },
      {
        label: "Active Orders",
        value: formatNumber(summary.activeOrders.value),
        delta: formatChange(summary.activeOrders.change),
        trend: trendFor(summary.activeOrders.change),
        caption: summary.activeOrders.caption,
      },
      {
        label: "Delivery SLA",
        value: `${summary.deliverySla.value}%`,
        delta: formatChange(summary.deliverySla.change),
        trend: trendFor(summary.deliverySla.change),
        caption: summary.deliverySla.caption,
      },
      {
        label: "AI Negotiation",
        value: `${summary.aiNegotiation.value}%`,
        delta: formatChange(summary.aiNegotiation.change),
        trend: trendFor(summary.aiNegotiation.change),
        caption: summary.aiNegotiation.caption,
      },
      {
        label: "Customer Satisfaction",
        value: `${summary.customerSatisfaction.value}/5`,
        delta: formatChange(summary.customerSatisfaction.change),
        trend: trendFor(summary.customerSatisfaction.change),
        caption: summary.customerSatisfaction.caption,
      },
      {
        label: "Active Runners",
        value: formatNumber(summary.activeRunners.value),
        delta: formatChange(summary.activeRunners.change),
        trend: trendFor(summary.activeRunners.change),
        caption: summary.activeRunners.caption,
      },
      {
        label: "Published Products",
        value: formatNumber(summary.publishedProducts.value),
        delta: formatChange(summary.publishedProducts.change),
        trend: trendFor(summary.publishedProducts.change),
        caption: summary.publishedProducts.caption,
      },
    ];
  }, [summary]);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-4 p-4 md:p-5">
      <PageHeader
        className="mb-0"
        title="Control Tower"
        description="Live commerce, catalogue, fulfilment, and customer performance across the current operating scope."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {!summary && !error && (
          <div className="col-span-full rounded-lg border bg-card">
            <QueryState loading loadingLabel="Loading dashboard metrics..." />
          </div>
        )}
        {error && (
          <div className="col-span-full rounded-lg border bg-card">
            <QueryState
              error={new Error(error)}
              errorTitle="Dashboard metrics could not be loaded"
            />
          </div>
        )}
        {statCards.map((stat) => (
          <StatCard key={stat.label} data={stat} />
        ))}
      </div>

      <div>
        <SalesTrendChart />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentOrders />
        </div>
        <NegotiationPipeline />
      </div>
    </div>
  );
}
