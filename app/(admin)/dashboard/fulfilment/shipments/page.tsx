"use client";

import { useMemo, useState } from "react";
import { Check, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HookLoader } from "@/components/shared/HookLoader";
import { PageHeader } from "@/components/shared/PageHeader";
import { apiPatch, apiPost } from "@/lib/api";
import { useApiQuery } from "@/lib/query";

type Shipment = {
  id?: string;
  _id?: string;
  publicId?: string;
  orderId?: string;
  provider?: string;
  trackingNumber?: string;
  status?: string;
  version?: number;
};

type Consolidation = {
  id?: string;
  _id?: string;
  publicId?: string;
  orderId?: string;
  hubId?: string;
  status?: string;
};

type LogisticsReadiness = {
  providers?: Array<{ name: string; enabled: boolean; mode: string; reason?: string }>;
};

const label = (value?: string) => String(value || "-").replaceAll("_", " ");
const nextStatuses: Record<string, string[]> = {
  BOOKED_WITH_PROVIDER: ["AWAITING_PICKUP", "CANCELLED"],
  AWAITING_PICKUP: ["PICKED_UP", "CANCELLED"],
  PICKED_UP: ["IN_TRANSIT", "DELIVERY_FAILED"],
  IN_TRANSIT: ["OUT_FOR_DELIVERY", "DELIVERY_FAILED", "RETURN_IN_TRANSIT"],
  OUT_FOR_DELIVERY: ["DELIVERED", "DELIVERY_FAILED", "AWAITING_HANDOVER_PAYMENT"],
  AWAITING_HANDOVER_PAYMENT: ["RELEASE_APPROVED"],
  RELEASE_APPROVED: ["DELIVERED"],
  DELIVERY_FAILED: ["RETURN_IN_TRANSIT"],
  RETURN_IN_TRANSIT: ["RETURNED_TO_HOOK"],
};

export default function FulfilmentShipmentsPage() {
  const shipmentsQuery = useApiQuery<Shipment[]>(["admin", "fulfilment", "shipments"], "/admin/fulfilment/shipments?limit=100");
  const consolidationsQuery = useApiQuery<Consolidation[]>(["admin", "fulfilment", "sealed-consolidations"], "/admin/fulfilment/consolidations?status=SEALED&limit=100");
  const readinessQuery = useApiQuery<LogisticsReadiness>(["admin", "fulfilment", "logistics-readiness"], "/admin/fulfilment/logistics/readiness");
  const [provider, setProvider] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<string>();

  const unbooked = useMemo(() => {
    const bookedOrders = new Set((shipmentsQuery.data || []).map((item) => item.orderId));
    return (consolidationsQuery.data || []).filter((item) => item.orderId && !bookedOrders.has(item.orderId));
  }, [consolidationsQuery.data, shipmentsQuery.data]);

  async function book(item: Consolidation) {
    if (!item.orderId || !item.hubId) return;
    const id = item.publicId || item.id || item._id;
    if (!id) return;
    setPending(`book-${id}`);
    try {
      await apiPost(`/admin/fulfilment/orders/${item.orderId}/shipments`, { provider: provider[id] || "manual", hubId: item.hubId, idempotencyKey: `shipment-${item.orderId}` });
      await Promise.all([shipmentsQuery.refetch(), consolidationsQuery.refetch()]);
    } finally {
      setPending(undefined);
    }
  }

  async function advance(item: Shipment, status: string) {
    const id = item.publicId || item.id || item._id;
    if (!id) return;
    setPending(`status-${id}`);
    try {
      await apiPatch(`/admin/fulfilment/shipments/${id}`, { status, version: item.version });
      await shipmentsQuery.refetch();
    } finally {
      setPending(undefined);
    }
  }

  if (shipmentsQuery.isLoading || consolidationsQuery.isLoading || readinessQuery.isLoading) return <div className="grid min-h-80 place-items-center"><HookLoader label="Loading shipments" /></div>;
  if (shipmentsQuery.isError || consolidationsQuery.isError || readinessQuery.isError) return <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">Shipment operations could not be loaded. Refresh and try again.</div>;

  const simulationEnabled = readinessQuery.data?.providers?.some((item) => item.name === "simulated" && item.enabled) ?? false;

  return (
    <div className="space-y-5 pb-10">
      <PageHeader title="Shipments" description="Book sealed parcels through the controlled manual logistics path and advance status only through valid transitions. GIG and Fez remain disabled until verified." />

      <Card className="rounded-lg shadow-none">
        <CardHeader><CardTitle className="text-base">Ready for booking</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {unbooked.length ? unbooked.map((item, index) => { const id = item.publicId || item.id || item._id || `consolidation-${index}`; return <div key={id} className="grid gap-3 rounded-md border p-4 md:grid-cols-[1fr_220px_auto] md:items-center"><div><p className="text-sm font-medium">Order {item.orderId}</p><p className="mt-1 text-xs text-muted-foreground">Sealed consolidation {id} · Hub {item.hubId}</p></div><Select value={provider[id] || "manual"} onValueChange={(value) => setProvider((current) => ({ ...current, [id]: value }))}><SelectTrigger><SelectValue placeholder="Provider" /></SelectTrigger><SelectContent><SelectItem value="manual">Manual fallback</SelectItem>{simulationEnabled ? <SelectItem value="simulated">Simulation (development only)</SelectItem> : null}<SelectItem value="other">Approved provider</SelectItem><SelectItem value="gig" disabled>GIG unavailable</SelectItem><SelectItem value="fez" disabled>Fez unavailable</SelectItem></SelectContent></Select><Button size="sm" onClick={() => void book(item)} disabled={pending === `book-${id}`}>{pending === `book-${id}` ? <HookLoader size="button" /> : <><Truck /> Book shipment</>}</Button></div>; }) : <p className="py-8 text-center text-sm text-muted-foreground">No sealed parcels are waiting for shipment booking.</p>}
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-none">
        <CardHeader><CardTitle className="text-base">Shipment register</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {shipmentsQuery.data?.length ? shipmentsQuery.data.map((item, index) => { const id = item.publicId || item.id || item._id || `shipment-${index}`; const options = nextStatuses[item.status || ""] || []; return <div key={id} className="grid gap-3 rounded-md border p-4 lg:grid-cols-[1fr_auto_auto] lg:items-center"><div><div className="flex items-center gap-2"><p className="text-sm font-medium">{id}</p><Badge variant={item.status === "DELIVERY_FAILED" ? "destructive" : "secondary"}>{label(item.status)}</Badge></div><p className="mt-1 text-xs text-muted-foreground">Order {item.orderId || "-"} · {item.provider || "manual"}{item.trackingNumber ? ` · ${item.trackingNumber}` : ""}</p></div>{options.length ? <Select onValueChange={(value) => void advance(item, value)}><SelectTrigger className="w-[210px]"><SelectValue placeholder="Advance status" /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option} value={option}>{label(option)}</SelectItem>)}</SelectContent></Select> : <Badge variant="outline">No manual action</Badge>}<Button size="sm" variant="outline" disabled={pending === `status-${id}`} onClick={() => { const next = options[0]; if (next) void advance(item, next); }}>{pending === `status-${id}` ? <HookLoader size="button" /> : <><Check /> Advance</>}</Button></div>; }) : <p className="py-8 text-center text-sm text-muted-foreground">No shipments recorded.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
