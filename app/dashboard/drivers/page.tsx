"use client";

import Link from "next/link";
import { Zap, Truck, BatteryCharging, Users, Navigation, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { KpiCard } from "@/components/shared/KpiCard";
import { SearchInput } from "@/components/shared/SearchInput";
import { DriversTable } from "@/components/drivers/DriversTable";
import { HookLoader } from "@/components/shared/HookLoader";
import { useApiQuery } from "@/lib/query";
import { useState } from "react";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { StateDropdown } from "@/components/operations/StateDropdown";
import { useUrlFilters } from "@/lib/admin-utils";

interface DriverStats {
  total: number;
  active: number;
  inactive: number;
  onDelivery: number;
}

export default function DriversPage() {
  const [driverTab, setDriverTab] = useState("all");
  const filters = useUrlFilters({ stateCode: "all" });
  const stateCode = filters.get("stateCode") || "all";
  const { data: stats, isLoading } = useApiQuery<DriverStats>(
    ["admin", "dispatch", "drivers-stats"],
    "/admin/dispatch/drivers/stats",
  );

  return (
    <div className="p-2 sm:p-4">
      <PageHeader
        title="Live Dispatch & Routing"
        description="Monitor EV fleet, active orders, and route optimization in real-time."
        actions={
          <>
            <SearchInput placeholder="Search driver or order..." className="hidden sm:block w-52 lg:w-64" />
            <StateDropdown value={stateCode} onChange={(value) => filters.set({ stateCode: value })} />
            <PermissionGuard permission="drivers.edit">
              <Button asChild variant="brand" size="sm" className="gap-1.5">
                <Link href="/dashboard/drivers/new">
                  <Plus size={15} /> Add Driver
                </Link>
              </Button>
            </PermissionGuard>
          </>
        }
      />

      {/* KPI Cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {isLoading ? (
          <div className="col-span-2 rounded-xl border border-border bg-card py-8 lg:col-span-4">
            <HookLoader size="page" label="Loading driver stats..." />
          </div>
        ) : (
          <>
            <KpiCard icon={Zap} tone="green" label="Active EVs" value={stats?.active ?? 0} caption="Online & available" />
            <KpiCard icon={Truck} tone="amber" label="On Delivery" value={stats?.onDelivery ?? 0} caption="Active deliveries" />
            <KpiCard icon={BatteryCharging} tone="blue" label="Idle / Charging" value={stats?.inactive ?? 0} caption="Not dispatched" />
            <KpiCard icon={Users} tone="zinc" label="Total Drivers" value={stats?.total ?? 0} caption="All EV drivers" />
          </>
        )}
      </div>

      {/* Driver List + Map */}
      <div className="flex flex-col gap-4 lg:flex-row" style={{ minHeight: 500 }}>
        <div className="w-full lg:w-auto">
          <DriversTable activeTab={driverTab} onTabChange={setDriverTab} stateCode={stateCode} />
        </div>

        {/* Map Area */}
        <div className="relative hidden flex-1 overflow-hidden rounded-xl border border-border bg-zinc-100 lg:flex" style={{ minHeight: 500 }}>
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-center">
              <Navigation size={40} className="mx-auto text-zinc-300" />
              <div className="mt-4">
                <HookLoader size="inline" label="Loading live map..." />
              </div>
              <p className="mt-2 text-xs text-zinc-400">Real-time driver positions via Mapbox</p>
            </div>
          </div>

          <div className="absolute left-1/2 top-5 z-10 -translate-x-1/2 flex items-center gap-2 rounded-full bg-blue-500 px-4 py-1.5 text-xs font-semibold text-white shadow-lg">
            <span className="size-2 rounded-full bg-white" />
            Rerouting DRV-1030 → Balogun Market via Third Mainland
          </div>

          <Card className="absolute bottom-5 right-5 z-10 shadow-lg">
            <CardContent className="p-3.5">
              <h4 className="mb-2.5 text-[10px] font-bold uppercase tracking-wide text-zinc-400">Legend</h4>
              <div className="space-y-2 text-xs font-medium text-zinc-600">
                <div className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-amber-500" /> On Delivery</div>
                <div className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-blue-500" /> En Route</div>
                <div className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-emerald-500" /> Idle</div>
              </div>
            </CardContent>
          </Card>

          <Card className="absolute bottom-5 left-5 z-10 w-60 shadow-lg">
            <CardContent className="p-3.5">
              <h3 className="text-sm font-bold text-zinc-900">Amina Mohammed</h3>
              <p className="text-xs text-zinc-400">DRV-1030</p>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-900">ORD-9924</span>
                <span className="text-sm font-bold text-amber-600">5 mins</span>
              </div>
              <Button variant="ink" className="mt-3 w-full" size="sm">View Details</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
