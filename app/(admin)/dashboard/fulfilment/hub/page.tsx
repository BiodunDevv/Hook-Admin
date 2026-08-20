"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { CheckCircle2, PackageCheck, PackageX, ShieldCheck, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { HookLoader } from "@/components/shared/HookLoader";
import { PageHeader } from "@/components/shared/PageHeader";
import { apiPost } from "@/lib/api";
import { useApiQuery } from "@/lib/query";

type InboundRow = {
  id?: string;
  _id?: string;
  publicId?: string;
  hubId?: string;
  orderId?: string;
  status?: string;
};

type PackageItemRow = {
  orderItemId: string;
  productTitle?: string;
  orderedPhotoUrl?: string;
  pickedUpPhotoUrl?: string;
  checks?: { productMatches: boolean; sizeMatches: boolean; colorMatches: boolean; quantityMatches: boolean };
  matched?: boolean;
};

type PackageRow = InboundRow & {
  taskId?: string;
  version?: number;
  itemIds?: string[];
  items?: PackageItemRow[];
};

type ConsolidationRow = {
  id?: string;
  _id?: string;
  publicId?: string;
  orderId?: string;
  hubId?: string;
  status?: string;
  version?: number;
};

type HubData = {
  inbound: InboundRow[];
  packages: PackageRow[];
  exceptions: InboundRow[];
  consolidations: ConsolidationRow[];
};

const label = (value?: string) => String(value || "-").replaceAll("_", " ");

export default function FulfilmentHubPage() {
  const query = useApiQuery<HubData>(["admin", "fulfilment", "hub"], "/admin/fulfilment/hub");
  const [credential, setCredential] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<string>();
  const [confirmedItems, setConfirmedItems] = useState<Record<string, boolean>>({});

  async function receive(item: InboundRow) {
    const id = item.publicId || item.id || item._id;
    if (!id || !item.hubId || credential[id]?.length !== 6) return;
    setPending(id);
    try {
      await apiPost(`/admin/fulfilment/packages/${id}/receive`, {
        hubId: item.hubId,
        scanCredential: credential[id],
        idempotencyKey: `hub-receive-${id}`,
      });
      await query.refetch();
    } finally {
      setPending(undefined);
    }
  }

  async function qc(item: PackageRow, passed: boolean) {
    const id = item.publicId || item.id || item._id;
    if (!id) return;
    setPending(id);
    try {
      const checks = passed
        ? (item.items || []).map((row) => ({ orderItemId: row.orderItemId, confirmed: Boolean(confirmedItems[row.orderItemId]) }))
        : [{ result: "failed", at: new Date().toISOString() }];
      await apiPost(`/admin/fulfilment/packages/${id}/qc`, {
        version: item.version,
        passed,
        checks,
      });
      await query.refetch();
    } finally {
      setPending(undefined);
    }
  }

  async function consolidate(item: PackageRow) {
    const id = item.orderId;
    if (!id || !item.hubId) return;
    setPending(`consolidate-${id}`);
    try {
      await apiPost(`/admin/fulfilment/orders/${id}/consolidate`, { hubId: item.hubId });
      await query.refetch();
    } finally {
      setPending(undefined);
    }
  }

  async function seal(item: ConsolidationRow) {
    const id = item.publicId || item.id || item._id;
    if (!id) return;
    setPending(`seal-${id}`);
    try {
      await apiPost(`/admin/fulfilment/consolidations/${id}/seal`, { version: item.version });
      await query.refetch();
    } finally {
      setPending(undefined);
    }
  }

  const readyForConsolidation = useMemo(() => {
    const seen = new Set<string>();
    return (query.data?.packages || []).filter((item) => {
      if (item.status !== "QC_PASSED" || !item.orderId || seen.has(item.orderId)) return false;
      seen.add(item.orderId);
      return true;
    });
  }, [query.data?.packages]);

  if (query.isLoading) return <div className="grid min-h-80 place-items-center"><HookLoader label="Loading Hub workspace" /></div>;
  if (query.isError || !query.data) return <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">The Hub workspace could not be loaded. Refresh and try again.</div>;

  const data = query.data;
  return (
    <div className="w-full space-y-5 px-4 py-5">
      <PageHeader title="Dispatch Hub workspace" description="Receive Runner packages, complete visible quality checks, and prepare complete State Orders for dispatch." />

      <Card className="rounded-lg shadow-none">
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Inbound Runner packages</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Verify the one-time six-digit credential before accepting custody.</p>
          </div>
          <Badge variant="outline">{data.inbound.length} waiting</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.inbound.length ? data.inbound.map((item, index) => {
            const id = item.publicId || item.id || item._id || `inbound-${index}`;
            return (
              <div key={id} className="grid gap-3 rounded-md border p-4 lg:grid-cols-[1fr_220px_auto] lg:items-center">
                <div>
                  <div className="flex items-center gap-2"><Truck className="size-4" /><p className="text-sm font-medium">{id}</p><Badge variant="secondary">Ready for Hub</Badge></div>
                  <p className="mt-1 text-xs text-muted-foreground">Order {item.orderId || "-"} · Hub {item.hubId || "-"}</p>
                </div>
                <Input inputMode="numeric" maxLength={6} placeholder="Six-digit credential" value={credential[id] || ""} onChange={(event) => setCredential((current) => ({ ...current, [id]: event.target.value.replace(/\D/g, "").slice(0, 6) }))} />
                <Button size="sm" onClick={() => void receive(item)} disabled={pending === id || credential[id]?.length !== 6}>{pending === id ? <HookLoader size="button" /> : <><PackageCheck /> Receive package</>}</Button>
              </div>
            );
          }) : <p className="py-8 text-center text-sm text-muted-foreground">No Runner packages are awaiting Hub receipt.</p>}
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-none">
        <CardHeader><CardTitle className="text-base">Visible quality checks</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {data.packages.filter((item) => ["RECEIVED", "QC_PENDING", "QC_PASSED"].includes(String(item.status))).length ? data.packages.filter((item) => ["RECEIVED", "QC_PENDING", "QC_PASSED"].includes(String(item.status))).map((item, index) => {
            const id = item.publicId || item.id || item._id || `package-${index}`;
            const awaitingQc = item.status === "RECEIVED" || item.status === "QC_PENDING";
            const items = item.items || [];
            const allConfirmed = items.length > 0 && items.every((row) => confirmedItems[row.orderItemId]);
            return (
              <div key={id} className="space-y-3 rounded-md border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><div className="flex items-center gap-2"><PackageCheck className="size-4" /><p className="text-sm font-medium">{id}</p><Badge variant={item.status === "QC_PASSED" ? "default" : "secondary"}>{label(item.status)}</Badge></div><p className="mt-1 text-xs text-muted-foreground">Order {item.orderId || "-"} · Hub {item.hubId || "-"}</p></div>
                  {awaitingQc ? <div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => void qc(item, true)} disabled={pending === id || !allConfirmed}>{pending === id ? <HookLoader size="button" /> : <><CheckCircle2 /> QC pass</>}</Button><Button size="sm" variant="destructive" onClick={() => void qc(item, false)} disabled={pending === id}><PackageX /> Fail and open exception</Button></div> : <Badge variant="outline">Ready for consolidation</Badge>}
                </div>

                {awaitingQc && items.length ? (
                  <div className="space-y-2 border-t pt-3">
                    {items.map((row) => (
                      <div key={row.orderItemId} className="grid gap-3 rounded-md bg-muted/30 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
                        <div>
                          <p className="mb-1 text-xs font-medium text-muted-foreground">Ordered</p>
                          <div className="relative aspect-square w-full max-w-24 overflow-hidden rounded-md bg-muted">
                            {row.orderedPhotoUrl ? <Image src={row.orderedPhotoUrl} alt="Ordered reference" fill className="object-cover" unoptimized /> : null}
                          </div>
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-medium text-muted-foreground">Picked up</p>
                          <div className="relative aspect-square w-full max-w-24 overflow-hidden rounded-md bg-muted">
                            {row.pickedUpPhotoUrl ? <Image src={row.pickedUpPhotoUrl} alt="Picked up by Runner" fill className="object-cover" unoptimized /> : null}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <p className="text-sm font-medium">{row.productTitle || "Product item"}</p>
                          <Badge variant={row.matched ? "default" : "secondary"} className="w-fit">{row.matched ? "Runner confirmed match" : "Runner reported mismatch"}</Badge>
                          <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={Boolean(confirmedItems[row.orderItemId])}
                              onCheckedChange={(value) => setConfirmedItems((current) => ({ ...current, [row.orderItemId]: value === true }))}
                            />
                            Confirm this item
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          }) : <p className="py-8 text-center text-sm text-muted-foreground">No packages are waiting for quality review.</p>}
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-none">
        <CardHeader><CardTitle className="text-base">Consolidation and final packing</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {readyForConsolidation.length ? readyForConsolidation.map((item, index) => {
            const id = `${item.orderId}-${item.hubId || index}`;
            return <div key={id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-4"><div><p className="text-sm font-medium">Order {item.orderId}</p><p className="mt-1 text-xs text-muted-foreground">All active packages passed QC · Hub {item.hubId || "-"}</p></div><Button size="sm" onClick={() => void consolidate(item)} disabled={pending === `consolidate-${item.orderId}`}>{pending === `consolidate-${item.orderId}` ? <HookLoader size="button" /> : "Start consolidation"}</Button></div>;
          }) : <p className="py-4 text-center text-sm text-muted-foreground">No complete Orders are ready for consolidation.</p>}
          {data.consolidations.length ? data.consolidations.map((item, index) => { const id = item.publicId || item.id || item._id || `consolidation-${index}`; return <div key={id} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-muted/40 p-4"><div><p className="text-sm font-medium">{id} · Order {item.orderId || "-"}</p><p className="mt-1 text-xs text-muted-foreground">Hub {item.hubId || "-"} · {label(item.status)}</p></div>{item.status === "DRAFT" ? <Button size="sm" onClick={() => void seal(item)} disabled={pending === `seal-${id}`}>{pending === `seal-${id}` ? <HookLoader size="button" /> : <><ShieldCheck /> Seal parcel</>}</Button> : <Badge>Sealed for dispatch</Badge>}</div>; }) : null}
        </CardContent>
      </Card>
    </div>
  );
}
