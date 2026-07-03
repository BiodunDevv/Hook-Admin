"use client";

import { useEffect, useMemo, useState } from "react";
import StatCard from "@/components/shared/StatCard";
import SalesTrendChart from "@/components/charts/SalesTrendChart";
import LiveOperations from "@/components/dashboard/LiveOperations";
import RecentOrders from "@/components/dashboard/RecentOrders";
import NegotiationPipeline from "@/components/charts/NegotiationPipeline";
import { apiGet } from "@/lib/api";
import type { StatCardData } from "@/lib/data";

interface DashboardSummary {
  users: { total: number; newToday: number };
  vendors: { total: number; pending: number };
  products: { total: number; pendingApproval: number };
  orders: { total: number; pending: number; delivered: number; today: number };
  revenue: { total: number };
  logistics: { activeDeliveries: number; totalDrivers: number };
  negotiations: { total: number };
  settlements: { pendingEscrow: number; cleared: number };
}

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

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    apiGet<DashboardSummary>("/admin/dashboard")
      .then((data) => {
        if (mounted) setSummary(data);
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
        value: formatNaira(summary.revenue.total),
        delta: `${formatNumber(summary.orders.delivered)} delivered`,
        trend: "up",
        caption: "all time",
        sparkline: [2, 4, 3, 6, 5, 7, 8],
      },
      {
        label: "Active Orders",
        value: formatNumber(summary.orders.pending),
        delta: `${formatNumber(summary.orders.today)} today`,
        trend: "flat",
        caption: "pending",
        sparkline: [3, 3, 4, 4, 5, 4, 5],
      },
      {
        label: "Active Vendors",
        value: formatNumber(summary.vendors.total),
        delta: `${formatNumber(summary.vendors.pending)} pending`,
        trend: summary.vendors.pending ? "down" : "up",
        caption: "review queue",
        sparkline: [1, 2, 3, 4, 5, 6, 7],
      },
      {
        label: "Admin Users",
        value: formatNumber(summary.users.total),
        delta: `${formatNumber(summary.users.newToday)} today`,
        trend: "up",
        caption: "registered",
        sparkline: [1, 1, 2, 2, 3, 3, 4],
      },
    ];
  }, [summary]);

  return (
    <div className="px-4 py-4 sm:px-6 sm:py-6">
      <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl">Overview</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Here&apos;s what&apos;s happening today.
      </p>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {!summary && !error &&
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-lg border border-zinc-200 bg-white" />
          ))}
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
