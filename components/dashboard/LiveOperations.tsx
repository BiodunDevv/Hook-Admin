"use client";

import Link from "next/link";
import { Navigation, Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HookLoader } from "@/components/shared/HookLoader";
import { useApiQuery } from "@/lib/query";
import { cn } from "@/lib/utils";

interface Delivery {
  id: string;
  status: string;
  estimatedDeliveryAt?: string;
  driver?: { firstName?: string; lastName?: string; email?: string };
  order?: { orderCode?: string };
  deliveryLocation?: { address?: string };
  pickupLocation?: { name?: string; address?: string };
}

function titleCaseStatus(status: string) {
  if (status === "in_transit") return "ON ROUTE";
  if (status === "at_pickup" || status === "driver_acknowledged") return "PICKING UP";
  if (status === "item_packed" || status === "qr_tagged") return "QUALITY CHECK";
  return status.replace(/_/g, " ").toUpperCase();
}

function statusClass(status: string) {
  if (status === "in_transit") return "bg-blue-100 text-blue-700";
  if (status === "at_pickup" || status === "driver_acknowledged") return "bg-amber-100 text-amber-700";
  if (status === "failed") return "bg-rose-100 text-rose-700";
  if (status === "item_packed" || status === "qr_tagged") return "bg-fuchsia-100 text-fuchsia-700";
  return "bg-zinc-100 text-zinc-600";
}

function etaLabel(estimatedDeliveryAt?: string) {
  if (!estimatedDeliveryAt) return "ETA pending";
  const minutes = Math.max(1, Math.round((new Date(estimatedDeliveryAt).getTime() - Date.now()) / 60000));
  return `ETA: ${minutes} mins`;
}

function shortLocation(value?: string) {
  if (!value) return "Location pending";
  const [first] = value.split(",");
  return first.trim() || value;
}

export default function LiveOperations() {
  const { data, isLoading } = useApiQuery<Delivery[]>(["admin", "active-dispatch"], "/admin/dispatch/active");
  const deliveries = data || [];

  return (
    <Card className="shadow-card border-zinc-200 py-0">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-100">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <h3 className="font-semibold text-zinc-900">Live Operations</h3>
          </div>
          <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-zinc-900">
            <Link href="/dashboard/operations-map">View Map</Link>
          </Button>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {deliveries.length} active deliveries right now
        </p>

        <ScrollArea className="mt-5 h-[382px]">
          <ul className="space-y-3 pr-2">
            {isLoading && (
              <li className="rounded-lg border border-zinc-100 bg-zinc-50/60 p-4">
                <HookLoader label="Loading deliveries..." />
              </li>
            )}
            {!isLoading && deliveries.length === 0 && (
              <li className="rounded-lg border border-zinc-100 bg-zinc-50/60 p-4 text-sm text-zinc-500">
                No active deliveries right now. New dispatch jobs will appear here as soon as drivers are assigned.
              </li>
            )}
            {deliveries.map((d) => {
              const driver = `${d.driver?.firstName || ""} ${d.driver?.lastName || ""}`.trim() || d.driver?.email || "Unassigned";
              const from = shortLocation(d.pickupLocation?.name || d.pickupLocation?.address);
              const to = shortLocation(d.deliveryLocation?.address);
              return (
              <li
                key={d.id}
                className="rounded-lg border border-zinc-100 bg-slate-50/80 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold uppercase tracking-wide text-slate-950">
                    {d.order?.orderCode || `DEL-${d.id.slice(0, 4).toUpperCase()}`}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                      statusClass(d.status),
                    )}
                  >
                    {titleCaseStatus(d.status)}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                  <Truck size={13} className="text-slate-500" />
                  {driver}
                  <span className="text-slate-400">•</span>
                  <span>{etaLabel(d.estimatedDeliveryAt)}</span>
                </div>
                <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs text-slate-500">
                  <span className="truncate">{from}</span>
                  <Navigation size={13} className="text-slate-300" />
                  <span className="truncate text-right">{to}</span>
                </div>
              </li>
            );})}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
