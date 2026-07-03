"use client";

import { useState } from "react";
import { Zap, Truck, BatteryCharging, AlertTriangle, Navigation } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SearchInput } from "@/components/shared/SearchInput";
import { DriversTable } from "@/components/drivers/DriversTable";

export default function DriversPage() {
  const [driverTab, setDriverTab] = useState("all");

  return (
    <div className="px-4 py-4 sm:px-6 sm:py-6">
      <PageHeader
        title="Live Dispatch & Routing"
        description="Monitor EV fleet, active orders, and route optimization in real-time."
        actions={
          <>
            <SearchInput placeholder="Search driver, order, or hub..." className="hidden sm:block w-52 lg:w-64" />
            <Button variant="outline" size="sm">Filters</Button>
          </>
        }
      />

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-zinc-200 shadow-card">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 sm:h-12 sm:w-12">
              <Zap size={20} />
            </div>
            <div>
              <div className="flex items-end gap-1.5">
                <span className="text-lg font-bold text-zinc-900 sm:text-2xl">142</span>
                <span className="text-xs font-medium text-emerald-600 sm:text-sm">+12</span>
              </div>
              <p className="text-xs text-zinc-500">Active EVs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-200 shadow-card">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500 sm:h-12 sm:w-12">
              <Truck size={20} />
            </div>
            <div>
              <div className="flex items-end gap-1.5">
                <span className="text-lg font-bold text-zinc-900 sm:text-2xl">86</span>
                <span className="text-xs font-medium text-emerald-600 sm:text-sm">+5</span>
              </div>
              <p className="text-xs text-zinc-500">On Delivery</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-200 shadow-card">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500 sm:h-12 sm:w-12">
              <BatteryCharging size={20} />
            </div>
            <div>
              <div className="flex items-end gap-1.5">
                <span className="text-lg font-bold text-zinc-900 sm:text-2xl">56</span>
                <span className="text-xs font-medium text-red-500 sm:text-sm">-2</span>
              </div>
              <p className="text-xs text-zinc-500">Idle / Charging</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-200 shadow-card">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 sm:h-12 sm:w-12">
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="flex items-end gap-1.5">
                <span className="text-lg font-bold text-zinc-900 sm:text-2xl">2</span>
                <span className="text-xs font-medium text-red-500 sm:text-sm">-1</span>
              </div>
              <p className="text-xs text-zinc-500">Incidents</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Driver List + Map */}
      <div className="flex flex-col gap-6 lg:flex-row" style={{ minHeight: 500 }}>
        <div className="w-full lg:w-auto">
          <DriversTable activeTab={driverTab} onTabChange={setDriverTab} />
        </div>

        {/* Map Area — hidden on mobile, shown on lg+ */}
        <div className="relative hidden flex-1 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 lg:flex" style={{ minHeight: 500 }}>
          {/* Live Map Placeholder */}
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-center">
              <Navigation size={48} className="mx-auto text-zinc-300" />
              <p className="mt-3 text-sm font-medium text-zinc-500">Live Map Loading…</p>
              <p className="text-xs text-zinc-400">Leaflet map will render here with real-time driver positions</p>
            </div>
          </div>

          {/* Top Banner */}
          <div className="absolute left-1/2 top-6 z-10 -translate-x-1/2 flex items-center gap-2 rounded-full bg-blue-500 px-5 py-2 text-sm font-medium text-white shadow-lg">
            <span className="h-2 w-2 rounded-full bg-white" />
            Rerouting DRV-1030 to Balogun Market via Third Mainland…
          </div>

          {/* Map Legend */}
          <Card className="absolute bottom-6 right-6 z-10 border-zinc-200 shadow-lg">
            <CardContent className="p-4">
              <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-zinc-400">Legend</h4>
              <div className="space-y-2.5 text-sm font-medium text-zinc-600">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-amber-500" /> On Delivery
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-blue-500" /> En Route
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-emerald-500" /> Idle
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Driver Detail Card */}
          <Card className="absolute bottom-6 left-6 z-10 w-64 border-zinc-200 shadow-lg">
            <CardContent className="p-4">
              <h3 className="text-base font-bold text-zinc-900">Amina Mohammed</h3>
              <p className="text-xs text-zinc-400">DRV-1030</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-900">ORD-9924</span>
                <span className="text-sm font-bold text-amber-600">5 mins</span>
              </div>
              <Button variant="ink" className="mt-4 w-full" size="sm">
                View Details
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
