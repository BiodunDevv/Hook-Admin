"use client";

import Image from "next/image";
import Link from "next/link";
import { use } from "react";
import { ArrowLeft, Box, CheckCircle2, Clock3, MapPin, Package, Store } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DefinitionGrid } from "@/components/shared/DefinitionGrid";
import { DetailSection } from "@/components/shared/DetailSection";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryState } from "@/components/shared/QueryState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useApiQuery } from "@/lib/query";

type TaskDetail = {
  task?: {
    publicId?: string;
    status?: string;
    marketId?: string;
    sourceStateId?: string;
    hubId?: string;
    marketAssociateId?: string;
    version?: number;
    acceptanceDueAt?: string;
    sourcingDueAt?: string;
    hubHandoverDueAt?: string;
    resolutionDueAt?: string;
    acceptedAt?: string;
    sourcingStartedAt?: string;
    productSecuredAt?: string;
    hubReceivedAt?: string;
    completedAt?: string;
    actualCostMinor?: number;
    evidence?: Array<{ type?: string; note?: string; url?: string }>;
    market?: { name?: string; imageUrl?: string } | null;
    hub?: { name?: string } | null;
    marketAssociate?: { name?: string; email?: string; avatarUrl?: string } | null;
  };
  order?: { publicId?: string; commerceStatus?: string; status?: string };
  items?: Array<{
    id?: string;
    publicId?: string;
    quantity?: number;
    fulfilmentStatus?: string;
    productTitle?: string;
    productImage?: string;
    productSnapshot?: { title?: string; image?: string };
  }>;
};

const label = (value?: string) => String(value || "-").replaceAll("_", " ");
const formatDate = (value?: string) => (value ? new Date(value).toLocaleString() : "Not set");

function initials(name?: string) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "MA";
  return `${parts[0][0]}${parts[1]?.[0] || ""}`.toUpperCase();
}

export default function FulfilmentTaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const query = useApiQuery<TaskDetail>(["admin", "fulfilment", "task", id], `/admin/fulfilment/tasks/${id}`, Boolean(id));
  const detail = query.data;
  const task = detail?.task;

  const checkpoints = task
    ? ([
        ["Accepted", task.acceptedAt, task.acceptanceDueAt],
        ["Sourcing started", task.sourcingStartedAt, task.sourcingDueAt],
        ["Product secured", task.productSecuredAt, undefined],
        ["Hub handover", task.hubReceivedAt, task.hubHandoverDueAt],
        ["Completed", task.completedAt, task.resolutionDueAt],
      ] as const)
    : [];

  return (
    <div className="w-full space-y-5 px-4 py-5">
      <PageHeader
        title="Fulfilment task"
        description="Full operational record — Market, Hub, Market Associate, items, and SLA checkpoints in one place."
        actions={
          <Button variant="outline" asChild>
            <Link href="/dashboard/fulfilment">
              <ArrowLeft /> Control tower
            </Link>
          </Button>
        }
      />

      <QueryState
        loading={query.isLoading}
        error={query.isError || !task ? new Error("This fulfilment task could not be loaded or is outside your scope.") : undefined}
        loadingLabel="Loading fulfilment task"
        errorTitle="Fulfilment task unavailable"
        onRetry={() => query.refetch()}
      >
        {task ? (
          <>
            <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div className="relative bg-zinc-950 px-5 py-6 text-white sm:px-7">
                {task.market?.imageUrl ? (
                  <Image
                    src={task.market.imageUrl}
                    alt=""
                    fill
                    className="object-cover opacity-25"
                    unoptimized
                  />
                ) : null}
                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-amber-400 text-zinc-950 shadow-lg shadow-black/20">
                      <Store className="size-7" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
                        {task.market?.name || "Unassigned Market"}
                      </h2>
                      <p className="mt-1 truncate text-sm text-zinc-300">
                        Order {detail?.order?.publicId || "-"}
                      </p>
                      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-amber-300">
                        {task.publicId || id}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <StatusBadge status={task.status || "Unknown"} className="border-white/15 bg-white/10 text-white" />
                  </div>
                </div>
              </div>
              <div className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <div className="min-w-0 px-5 py-4 sm:px-6">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Market Associate</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Avatar className="size-6">
                      <AvatarImage src={task.marketAssociate?.avatarUrl} alt="" />
                      <AvatarFallback className="text-[10px]">{initials(task.marketAssociate?.name)}</AvatarFallback>
                    </Avatar>
                    <p className="truncate text-sm font-semibold text-foreground">
                      {task.marketAssociate?.name || "Unassigned"}
                    </p>
                  </div>
                </div>
                <div className="min-w-0 px-5 py-4 sm:px-6">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Dispatch Hub</p>
                  <p className="mt-1.5 truncate text-sm font-semibold text-foreground">{task.hub?.name || "Unassigned"}</p>
                </div>
                <div className="min-w-0 px-5 py-4 sm:px-6">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Task version</p>
                  <p className="mt-1.5 truncate text-sm font-semibold text-foreground">{task.version || 1}</p>
                </div>
              </div>
            </section>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.42fr)_minmax(310px,0.58fr)]">
              <div className="space-y-4">
                <DetailSection
                  title="Assigned items"
                  description="Products this Market Associate is sourcing for the order."
                  action={<span className="text-xs tabular-nums text-muted-foreground">{detail?.items?.length || 0} item(s)</span>}
                >
                  {detail?.items?.length ? (
                    <div className="space-y-2">
                      {detail.items.map((item, index) => {
                        const photo = item.productImage || item.productSnapshot?.image;
                        const title = item.productTitle || item.productSnapshot?.title || "Catalog item";
                        return (
                          <div key={item.publicId || item.id || index} className="flex items-center gap-3 rounded-lg border p-3">
                            {photo ? (
                              <span className="relative size-12 shrink-0 overflow-hidden rounded-md">
                                <Image src={photo} alt="" fill className="object-cover" unoptimized />
                              </span>
                            ) : (
                              <span className="grid size-12 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                                <Package className="size-5" />
                              </span>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{title}</p>
                              <p className="text-xs text-muted-foreground">Quantity {item.quantity || 0}</p>
                            </div>
                            <StatusBadge status={item.fulfilmentStatus || "Pending"} />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No active item records are attached to this task.</p>
                  )}
                </DetailSection>

                <DetailSection title="SLA checkpoints" description="Actual completion time against the operational deadline.">
                  <div className="space-y-3">
                    {checkpoints.map(([title, actual, due]) => {
                      const done = Boolean(actual);
                      return (
                        <div key={title} className="flex items-start justify-between gap-3 border-b pb-3 last:border-0 last:pb-0">
                          <div className="flex items-start gap-2.5">
                            {done ? (
                              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                            ) : (
                              <Clock3 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                            )}
                            <div>
                              <p className="text-sm font-medium">{title}</p>
                              <p className="text-xs text-muted-foreground">
                                {done ? formatDate(actual) : due ? `Due ${formatDate(due)}` : "Not yet reached"}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </DetailSection>
              </div>

              <div className="space-y-4">
                <DetailSection title="Order" description="The customer order this task fulfils.">
                  <DefinitionGrid
                    columns={1}
                    items={[
                      { label: "Order", value: detail?.order?.publicId || "-" },
                      { label: "Commerce status", value: label(detail?.order?.commerceStatus) },
                      { label: "Status", value: label(detail?.order?.status) },
                    ]}
                  />
                </DetailSection>

                {task.evidence?.length ? (
                  <DetailSection title="Evidence" description="Photos and notes captured during sourcing.">
                    <div className="space-y-2">
                      {task.evidence.map((item, index) => (
                        <div key={`${item.type || "evidence"}-${index}`} className="rounded-lg border p-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Box className="size-3.5 text-muted-foreground" />
                            <p className="font-medium">{item.type || "Evidence"}</p>
                          </div>
                          {item.note ? <p className="mt-1 text-xs text-muted-foreground">{item.note}</p> : null}
                          {item.url ? (
                            <a
                              className="relative mt-2 block aspect-video w-full overflow-hidden rounded-md border"
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Image src={item.url} alt="" fill className="object-cover" unoptimized />
                            </a>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </DetailSection>
                ) : (
                  <DetailSection title="Evidence" description="Photos and notes captured during sourcing.">
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="size-4" /> No evidence has been captured yet.
                    </p>
                  </DetailSection>
                )}
              </div>
            </div>
          </>
        ) : null}
      </QueryState>
    </div>
  );
}
