"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgeDollarSign, CheckCircle2, CircleCheck, Package, RefreshCw, ShoppingBag, Truck, UserPlus, Wallet } from "lucide-react";
import {
  PaymentChart, PipelineChart, RevenueChart, StatusChart, TopStatesChart, naira, type Overview,
} from "@/components/dashboard/OverviewCharts";
import { MetricCard } from "@/components/shared/MetricCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryState } from "@/components/shared/QueryState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApiQuery } from "@/lib/query";
import { cn } from "@/lib/utils";

type Range = "7" | "30" | "90";

const trendOf = (changePct: number) => (changePct > 0 ? "up" : changePct < 0 ? "down" : "flat");
const pct = (value: number) => `${value > 0 ? "+" : ""}${value}%`;

export default function DashboardPage() {
  const [range, setRange] = useState<Range>("30");
  // Refreshes on realtime events (see lib/realtime) and every 15 s as a fallback.
  const query = useApiQuery<Overview>(["admin", "overview", range], `/admin/overview?range=${range}`, true, {
    refetchInterval: 15_000,
    staleTime: 5_000,
  });
  const data = query.data;
  const k = data?.kpis;

  return (
    <div className="w-full space-y-5 px-4 py-5">
      <PageHeader
        showBack={false}
        title="Overview"
        description="How Hook is trading and where every order is right now."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
              <span className="relative flex size-2">
                <span className={cn("absolute inline-flex size-full rounded-full bg-success opacity-60", query.isFetching ? "animate-ping" : "")} />
                <span className="relative inline-flex size-2 rounded-full bg-success" />
              </span>
              Live{data ? ` · updated ${new Date(data.generatedAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : ""}
            </span>
            <Tabs value={range} onValueChange={(value) => setRange(value as Range)}>
              <TabsList>
                <TabsTrigger value="7">7 days</TabsTrigger>
                <TabsTrigger value="30">30 days</TabsTrigger>
                <TabsTrigger value="90">90 days</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="sm" onClick={() => void query.refetch()} disabled={query.isFetching}>
              <RefreshCw className={query.isFetching ? "animate-spin" : undefined} /> Refresh
            </Button>
          </div>
        }
      />

      <QueryState
        loading={query.isLoading}
        error={query.error}
        loadingLabel="Loading overview"
        errorTitle="The overview could not be loaded"
        onRetry={() => query.refetch()}
      >
        {data && k ? (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
              <MetricCard label="Revenue" value={naira(k.revenue.value)} icon={Wallet} intent="success" delta={pct(k.revenue.changePct)} trend={trendOf(k.revenue.changePct)} caption="vs previous period" />
              <MetricCard label="Orders" value={k.orders.value} icon={ShoppingBag} delta={pct(k.orders.changePct)} trend={trendOf(k.orders.changePct)} caption={`${k.lastHourOrders.value} in the last hour`} />
              <MetricCard label="Avg order value" value={naira(k.averageOrder.value)} icon={BadgeDollarSign} delta={pct(k.averageOrder.changePct)} trend={trendOf(k.averageOrder.changePct)} caption="per paid order" />
              <MetricCard label="Delivered" value={k.delivered.value} icon={CheckCircle2} intent="success" delta={pct(k.delivered.changePct)} trend={trendOf(k.delivered.changePct)} caption="completed orders" />
              <MetricCard label="New customers" value={k.customers.value} icon={UserPlus} delta={pct(k.customers.changePct)} trend={trendOf(k.customers.changePct)} caption="sign-ups" />
              <MetricCard label="In fulfilment" value={k.inFulfilment.value} icon={Truck} intent="warning" caption="orders moving now" />
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <div className="xl:col-span-2"><RevenueChart data={data.series} /></div>
              <Card className="gap-0 rounded-lg py-0 shadow-card">
                <CardHeader className="border-b px-4 py-3">
                  <CardTitle className="text-sm font-semibold">Needs attention</CardTitle>
                  <p className="text-xs text-muted-foreground">Things waiting on a person</p>
                </CardHeader>
                <CardContent className="p-0">
                  {data.attention.length ? (
                    <ul className="divide-y">
                      {data.attention.map((item) => (
                        <li key={item.key}>
                          <Link href={item.href} className="group flex items-center gap-3 px-4 py-3 transition hover:bg-muted/50">
                            <span className={cn("grid min-w-8 place-items-center rounded-md px-2 py-1 text-sm font-semibold tabular-nums", item.tone === "danger" ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning")}>{item.count}</span>
                            <span className="flex-1 text-sm">{item.label}</span>
                            <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
                      <CircleCheck className="size-8 text-success" />
                      <p className="text-sm font-medium">All clear</p>
                      <p className="text-xs text-muted-foreground">Nothing is waiting on the team.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              <PipelineChart pipeline={data.pipeline} />
              <StatusChart data={data.statuses} />
              <PaymentChart data={data.paymentMethods} />
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <TopStatesChart data={data.topStates} />
              <Card className="gap-0 rounded-lg py-0 shadow-card xl:col-span-2">
                <CardHeader className="flex-row items-center justify-between space-y-0 border-b px-4 py-3">
                  <div>
                    <CardTitle className="text-sm font-semibold">Recent orders</CardTitle>
                    <p className="text-xs text-muted-foreground">Latest paid and in-progress orders</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild><Link href="/dashboard/orders">All orders <ArrowRight /></Link></Button>
                </CardHeader>
                <CardContent className="p-0">
                  {data.recentOrders.length ? (
                    <ul className="divide-y">
                      {data.recentOrders.map((order) => (
                        <li key={order.publicId}>
                          <Link href={`/dashboard/orders/${order.publicId}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-muted/50">
                            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted"><Package className="size-4" /></span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold">{order.publicId}</span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {[order.customer, order.state, new Date(order.createdAt).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })].filter(Boolean).join(" · ")}
                              </span>
                            </span>
                            <StatusBadge status={order.status} />
                            <span className="w-24 text-right text-sm font-semibold tabular-nums">{naira(order.totalMinor || 0)}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-4 py-14 text-center text-sm text-muted-foreground">No orders yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </QueryState>
    </div>
  );
}
