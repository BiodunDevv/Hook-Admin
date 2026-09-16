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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MetricCard } from "@/components/shared/MetricCard";
import { QueryState } from "@/components/shared/QueryState";
import { ListRow, initialsOf } from "@/components/shared/ListRow";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { apiPost } from "@/lib/api";
import { useApiQuery } from "@/lib/query";

type InboundRow = {
  id?: string;
  _id?: string;
  publicId?: string;
  hubId?: string;
  orderId?: string;
  status?: string;
  hub?: { name?: string } | null;
  order?: { publicId?: string } | null;
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
  hub?: { name?: string } | null;
  order?: { publicId?: string } | null;
};

type HubData = {
  inbound: InboundRow[];
  packages: PackageRow[];
  consolidations: ConsolidationRow[];
};

const label = (value?: string) => String(value || "-").replaceAll("_", " ");

type HubOption = { publicId?: string; id?: string; name?: string };

export default function FulfilmentHubPage() {
  // Staff attached to one hub see theirs automatically; this filter only
  // matters for someone who can see several, who otherwise got every hub's
  // work merged into one list with no way to narrow.
  const [hubId, setHubId] = useState<string>("all");
  const hubsQuery = useApiQuery<{ data?: HubOption[] } | HubOption[]>(
    ["admin", "fulfilment", "hubs"],
    "/admin/fulfilment/hubs?limit=100",
  );
  const hubOptions = useMemo(() => {
    const raw = hubsQuery.data;
    return (Array.isArray(raw) ? raw : raw?.data || []) as HubOption[];
  }, [hubsQuery.data]);

  const query = useApiQuery<HubData>(
    ["admin", "fulfilment", "hub", hubId],
    `/admin/fulfilment/hub${hubId !== "all" ? `?hubId=${encodeURIComponent(hubId)}` : ""}`,
  );
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

  // Packages awaiting or holding a quality decision. Computed once instead of
  // filtering the same array twice inline.
  const qcPackages = useMemo(
    () => (query.data?.packages || []).filter((item) =>
      ["RECEIVED", "QC_PENDING", "QC_PASSED"].includes(String(item.status)),
    ),
    [query.data?.packages],
  );

  const data = query.data;
  const inbound = data?.inbound || [];
  const consolidations = data?.consolidations || [];
  return (
    <div className="w-full space-y-5 px-4 py-5">
      <PageHeader
        showBack={false}
        title="Dispatch Hub workspace"
        description="Receive Market Associate packages, complete visible quality checks, and prepare complete State Orders for dispatch."
        actions={
          hubOptions.length > 1 ? (
            <Select value={hubId} onValueChange={setHubId}>
              <SelectTrigger className="h-9 w-[220px]">
                <SelectValue placeholder="All hubs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All my hubs</SelectItem>
                {hubOptions.map((hub) => {
                  const value = String(hub.publicId || hub.id);
                  return (
                    <SelectItem key={value} value={value}>
                      {hub.name || value}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          ) : undefined
        }
      />

      {/* Queue depth at a glance: the three stages a package passes through
          here, so staff can see where the backlog is without scrolling. */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <MetricCard icon={Truck} label="Awaiting receipt" value={inbound.length} />
        <MetricCard
          icon={PackageCheck}
          label="Awaiting quality check"
          value={qcPackages.filter((item) => item.status !== "QC_PASSED").length}
          intent={qcPackages.some((item) => item.status !== "QC_PASSED") ? "warning" : "neutral"}
        />
        <MetricCard icon={ShieldCheck} label="Ready to consolidate" value={readyForConsolidation.length} />
      </div>

      <Card className="rounded-lg shadow-none">
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Inbound Market Associate packages</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Verify the one-time six-digit credential before accepting custody.</p>
          </div>
          <Badge variant="outline">{inbound.length} waiting</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <QueryState
            loading={query.isLoading}
            error={query.error}
            empty={inbound.length === 0}
            loadingLabel="Loading Hub workspace"
            errorTitle="The Hub workspace could not be loaded"
            emptyTitle="Nothing awaiting receipt"
            emptyDescription="Market Associate packages appear here on their way to this hub."
            emptyIcon={Truck}
            onRetry={() => query.refetch()}
          >
            {inbound.map((item, index) => {
              const id = item.publicId || item.id || item._id || `inbound-${index}`;
              return (
                <div key={id} className="border-t border-zinc-100 first:border-t-0">
                  <ListRow
                    index={index + 1}
                    initials={initialsOf(item.hub?.name || "hub")}
                    title={<span className="truncate text-sm font-semibold text-zinc-950">{id}</span>}
                    subject={item.order?.publicId || item.orderId || undefined}
                    meta={[item.hub?.name || `Hub ${item.hubId || "-"}`, "Awaiting receipt"]}
                    actions={
                      <PermissionGuard permission="fulfilment.hub.receive">
                        <div className="flex items-center gap-2">
                          <Input
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="Six-digit credential"
                            className="h-9 w-[168px]"
                            value={credential[id] || ""}
                            onChange={(event) =>
                              setCredential((current) => ({
                                ...current,
                                [id]: event.target.value.replace(/\D/g, "").slice(0, 6),
                              }))
                            }
                          />
                          <Button
                            size="sm"
                            onClick={() => void receive(item)}
                            disabled={pending === id || credential[id]?.length !== 6}
                          >
                            {pending === id ? (
                              <HookLoader size="button" />
                            ) : (
                              <>
                                <PackageCheck /> Receive
                              </>
                            )}
                          </Button>
                        </div>
                      </PermissionGuard>
                    }
                  />
                </div>
              );
            })}
          </QueryState>
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-none">
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">Visible quality checks</CardTitle>
          <Badge variant="outline">{qcPackages.length} in review</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <QueryState
            loading={query.isLoading}
            error={query.error}
            empty={qcPackages.length === 0}
            loadingLabel="Loading Hub workspace"
            errorTitle="The Hub workspace could not be loaded"
            emptyTitle="Nothing waiting for quality review"
            emptyDescription="Received packages appear here for their visible check."
            emptyIcon={PackageCheck}
            onRetry={() => query.refetch()}
          >
            {qcPackages.map((item, index) => {
              const id = item.publicId || item.id || item._id || `package-${index}`;
              const awaitingQc = item.status === "RECEIVED" || item.status === "QC_PENDING";
              const items = item.items || [];
              const allConfirmed = items.length > 0 && items.every((row) => confirmedItems[row.orderItemId]);
              return (
                <div key={id} className="border-t border-zinc-100 first:border-t-0">
                  <ListRow
                    index={index + 1}
                    initials={initialsOf(item.hub?.name || "hub")}
                    title={<span className="truncate text-sm font-semibold text-zinc-950">{id}</span>}
                    subject={item.order?.publicId || item.orderId || undefined}
                    meta={[
                      item.hub?.name || `Hub ${item.hubId || "-"}`,
                      awaitingQc
                        ? `${items.length} item${items.length === 1 ? "" : "s"} to check`
                        : "Ready for consolidation",
                    ]}
                    actions={
                      <>
                        <StatusBadge status={item.status || "RECEIVED"} />
                        {awaitingQc ? (
                          <PermissionGuard permission="fulfilment.hub.qc">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                onClick={() => void qc(item, true)}
                                disabled={pending === id || !allConfirmed}
                              >
                                {pending === id ? (
                                  <HookLoader size="button" />
                                ) : (
                                  <>
                                    <CheckCircle2 /> QC pass
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => void qc(item, false)}
                                disabled={pending === id}
                              >
                                <PackageX /> Fail check
                              </Button>
                            </div>
                          </PermissionGuard>
                        ) : null}
                      </>
                    }
                  />

                  {/* The photo comparison only appears while a decision is
                      still owed, so a passed package reads as a plain row. */}
                  {awaitingQc && items.length ? (
                    <div className="space-y-2 border-t border-zinc-100 bg-zinc-50/60 px-4 py-3 xl:px-5">
                      {items.map((row) => (
                        <div
                          key={row.orderItemId}
                          className="grid gap-3 rounded-md border bg-white p-3 sm:grid-cols-[auto_auto_1fr] sm:items-center"
                        >
                          <div>
                            <p className="mb-1 text-xs font-medium text-muted-foreground">Ordered</p>
                            <div className="relative size-20 overflow-hidden rounded-md bg-muted">
                              {row.orderedPhotoUrl ? (
                                <Image src={row.orderedPhotoUrl} alt="Ordered reference" fill className="object-cover" unoptimized />
                              ) : null}
                            </div>
                          </div>
                          <div>
                            <p className="mb-1 text-xs font-medium text-muted-foreground">Picked up</p>
                            <div className="relative size-20 overflow-hidden rounded-md bg-muted">
                              {row.pickedUpPhotoUrl ? (
                                <Image src={row.pickedUpPhotoUrl} alt="Picked up by Market Associate" fill className="object-cover" unoptimized />
                              ) : null}
                            </div>
                          </div>
                          <div className="flex min-w-0 flex-col gap-2">
                            <p className="truncate text-sm font-medium">{row.productTitle || "Product item"}</p>
                            <Badge variant={row.matched ? "default" : "secondary"} className="w-fit">
                              {row.matched ? "Market Associate confirmed match" : "Market Associate reported mismatch"}
                            </Badge>
                            <label className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={Boolean(confirmedItems[row.orderItemId])}
                                onCheckedChange={(value) =>
                                  setConfirmedItems((current) => ({ ...current, [row.orderItemId]: value === true }))
                                }
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
            })}
          </QueryState>
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-none">
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">Consolidation and final packing</CardTitle>
          <Badge variant="outline">
            {readyForConsolidation.length} ready · {consolidations.length} open
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <QueryState
            loading={query.isLoading}
            error={query.error}
            empty={readyForConsolidation.length === 0 && consolidations.length === 0}
            loadingLabel="Loading Hub workspace"
            errorTitle="The Hub workspace could not be loaded"
            emptyTitle="Nothing ready to consolidate"
            emptyDescription="Orders appear here once every package has passed QC."
            emptyIcon={ShieldCheck}
            onRetry={() => query.refetch()}
          >
            {readyForConsolidation.map((item, index) => {
              const id = `${item.orderId}-${item.hubId || index}`;
              return (
                <div key={id} className="border-t border-zinc-100 first:border-t-0">
                  <ListRow
                    index={index + 1}
                    initials={initialsOf(item.hub?.name || "hub")}
                    title={
                      <span className="truncate text-sm font-semibold text-zinc-950">
                        {item.order?.publicId || item.orderId}
                      </span>
                    }
                    meta={[
                      item.hub?.name || `Hub ${item.hubId || "-"}`,
                      "All active packages passed QC",
                    ]}
                    actions={
                      <PermissionGuard permission="fulfilment.consolidate">
                        <Button
                          size="sm"
                          onClick={() => void consolidate(item)}
                          disabled={pending === `consolidate-${item.orderId}`}
                        >
                          {pending === `consolidate-${item.orderId}` ? (
                            <HookLoader size="button" />
                          ) : (
                            "Start consolidation"
                          )}
                        </Button>
                      </PermissionGuard>
                    }
                  />
                </div>
              );
            })}
            {consolidations.map((item, index) => {
              const id = item.publicId || item.id || item._id || `consolidation-${index}`;
              return (
                <div key={id} className="border-t border-zinc-100 first:border-t-0">
                  <ListRow
                    index={readyForConsolidation.length + index + 1}
                    initials={initialsOf(item.hub?.name || "hub")}
                    title={<span className="truncate text-sm font-semibold text-zinc-950">{id}</span>}
                    subject={item.order?.publicId || item.orderId || undefined}
                    meta={[item.hub?.name || `Hub ${item.hubId || "-"}`, label(item.status)]}
                    actions={
                      item.status === "DRAFT" ? (
                        <PermissionGuard permission="fulfilment.consolidate">
                          <Button size="sm" onClick={() => void seal(item)} disabled={pending === `seal-${id}`}>
                            {pending === `seal-${id}` ? (
                              <HookLoader size="button" />
                            ) : (
                              <>
                                <ShieldCheck /> Seal parcel
                              </>
                            )}
                          </Button>
                        </PermissionGuard>
                      ) : (
                        <StatusBadge status={item.status || "SEALED"} />
                      )
                    }
                  />
                </div>
              );
            })}
          </QueryState>
        </CardContent>
      </Card>
    </div>
  );
}
