"use client";

import { useEffect, useState } from "react";
import {
  Store,
  TrendingUp,
  Clock,
  AlertTriangle,
  Activity,
  MapPin,
  Smartphone,
  CreditCard,
  Wifi,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BoothCard } from "@/components/booths/BoothCard";
import type { BoothData } from "@/components/booths/BoothCard";
import { apiGet } from "@/lib/api";

interface ApiBooth {
  id: string;
  name: string;
  isActive: boolean;
  previewImageUrl?: string;
  location?: { address?: string };
  fieldAgent?: { agent?: { firstName?: string; lastName?: string; email?: string } };
}

interface Page<T> { data: T[]; total: number; }
interface BoothAnalytics { total: number; active: number; inactive: number; feed?: Array<{ id: string; product?: string; location?: string; status?: string; createdAt?: string }>; }

export default function BoothsPage() {
  const [booths, setBooths] = useState<BoothData[]>([]);
  const [analytics, setAnalytics] = useState<BoothAnalytics>({ total: 0, active: 0, inactive: 0, feed: [] });

  useEffect(() => {
    apiGet<Page<ApiBooth>>("/admin/booths")
      .then((result) => setBooths(result.data.map((booth) => {
        const attendant = booth.fieldAgent?.agent;
        const attendantName = `${attendant?.firstName || ""} ${attendant?.lastName || ""}`.trim() || attendant?.email || "Unassigned";
        return {
          id: booth.id.slice(0, 8),
          name: booth.name,
          bgImage: booth.previewImageUrl || "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&q=80",
          statusColor: booth.isActive ? "bg-emerald-500" : "bg-zinc-400",
          statusBg: booth.isActive ? "bg-emerald-500/20 text-emerald-100" : "bg-zinc-500/20 text-zinc-100",
          walkIns: 0,
          revenue: "₦0",
          waiting: 0,
          waitingColor: "text-zinc-500",
          attendantName,
          attendantInitials: attendantName.slice(0, 2).toUpperCase(),
          hardware: [
            { icon: Smartphone, color: "text-emerald-500" },
            { icon: CreditCard, color: "text-emerald-500" },
            { icon: Wifi, color: "text-emerald-500" },
          ],
          reconStatus: booth.isActive ? "Active" : "Inactive",
          reconColor: booth.isActive ? "text-emerald-700 bg-emerald-50" : "text-zinc-700 bg-zinc-50",
          expected: "₦0",
          actual: "₦0",
        };
      })))
      .catch(() => setBooths([]));
    apiGet<BoothAnalytics>("/admin/booths/analytics")
      .then(setAnalytics)
      .catch(() => setAnalytics({ total: 0, active: 0, inactive: 0, feed: [] }));
  }, []);

  return (
    <div className="px-4 py-4 sm:px-6 sm:py-6">
      <PageHeader
        title="Physical Booths"
        description="Monitor walk-in kiosks, hardware status, and cash reconciliation."
        actions={
          <Button variant="brand" size="sm" className="flex items-center gap-2">
            <Store size={18} /> Provision New Booth
          </Button>
        }
      />

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-zinc-200 shadow-card">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500 sm:h-12 sm:w-12">
              <Store size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-none text-zinc-900 sm:text-2xl">{analytics.active}</h3>
              <p className="mt-1 text-xs font-medium leading-tight text-zinc-500 sm:text-sm">
                Active Booths<br />
                <span className="text-xs font-normal text-zinc-400">All Systems Go</span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-200 shadow-card">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 sm:h-12 sm:w-12">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-none text-zinc-900 sm:text-2xl">₦0</h3>
              <p className="mt-1 text-xs font-medium leading-tight text-zinc-500 sm:text-sm">
                Walk-in Revenue<br />
                <span className="text-xs font-normal text-zinc-400">+15% vs yesterday</span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-200 shadow-card">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-brand-gold sm:h-12 sm:w-12">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-none text-zinc-900 sm:text-2xl">0</h3>
              <p className="mt-1 text-xs font-medium leading-tight text-zinc-500 sm:text-sm">
                Pending Dispatches<br />
                <span className="text-xs font-normal text-zinc-400">Customers waiting</span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-200 shadow-card">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 sm:h-12 sm:w-12">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-none text-zinc-900 sm:text-2xl">{analytics.inactive}</h3>
              <p className="mt-1 text-xs font-medium leading-tight text-zinc-500 sm:text-sm">
                Hardware Alerts<br />
                <span className="text-xs font-normal text-zinc-400">Network unstable</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Layout Area */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Booth Cards Grid */}
        <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          {booths.length === 0 && (
            <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
              No booths provisioned yet.
            </div>
          )}
          {booths.map((booth) => (
            <BoothCard key={booth.id} booth={booth} />
          ))}
        </div>

        {/* Live Feed Sidebar */}
        <Card className="flex w-full flex-col border-zinc-200 shadow-card lg:w-80 lg:shrink-0 xl:w-[340px]">
          <div className="flex items-center justify-between border-b border-zinc-100 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-emerald-500" />
              <h3 className="font-bold text-zinc-900">Live Walk-ins Feed</h3>
            </div>
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          </div>

          <ScrollArea className="flex-1 max-h-[400px] lg:max-h-none">
            <div className="space-y-6 p-4 sm:p-5">
              {(!analytics.feed || analytics.feed.length === 0) && (
                <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-500">
                  No booth activity yet.
                </div>
              )}
              {(analytics.feed || []).map((item, idx) => (
                <div key={item.id} className="relative pl-6">
                  {idx !== (analytics.feed || []).length - 1 && (
                    <div className="absolute left-[11px] top-4 h-full w-px bg-zinc-200" />
                  )}
                  <div className="absolute left-0 top-1 h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-white" />
                  <div className="mb-1 flex items-start justify-between">
                    <span className="text-xs font-bold text-zinc-900">{item.id}</span>
                    <span className="text-[10px] text-zinc-400">{item.createdAt ? new Date(item.createdAt).toLocaleTimeString() : "Now"}</span>
                  </div>
                  <h4 className="mb-0.5 text-sm font-bold leading-tight text-zinc-900">{item.product || "Booth activity"}</h4>
                  <p className="mb-1 flex items-center gap-1 text-xs text-zinc-500">
                    <MapPin size={10} /> {item.location}
                  </p>
                  <p className="text-[11px] font-bold text-blue-600">{item.status || "Recorded"}</p>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="border-t border-zinc-100 p-4">
            <Button variant="ghost" className="w-full rounded-xl bg-zinc-50 py-2.5 text-sm font-bold text-zinc-700 hover:bg-zinc-100">
              View All History
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
