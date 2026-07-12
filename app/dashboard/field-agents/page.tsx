"use client";

import Link from "next/link";
import { useState } from "react";
import { ShieldAlert, CheckCircle2, XCircle, Camera, MapPin, Phone, Power, Eye } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { HookLoader } from "@/components/shared/HookLoader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentReviewCard } from "@/components/field-agents/AgentReviewCard";
import type { QueueItem } from "@/components/field-agents/AgentReviewCard";
import { useApiQuery } from "@/lib/query";
import { apiPatch } from "@/lib/api";
import { Search } from "lucide-react";
import { StateChip, StateDropdown } from "@/components/operations/StateDropdown";
import { queryString, useUrlFilters } from "@/lib/admin-utils";

interface QaStats {
  pendingReview: number;
  approvedToday: number;
  rejected: number;
  activeAgents: number;
}

interface QueueResponse {
  data: QueueItem[];
  total: number;
  queueSize?: number;
}

interface AgentRow {
  id: string;
  assignedMarket: string;
  stateCode?: string;
  stateName?: string;
  isActive: boolean;
  agent?: { firstName?: string; lastName?: string; email?: string; phone?: string };
  stats?: { productsUploaded: number; pendingApproval: number; approvedToday: number };
}

interface AgentsResponse {
  data: AgentRow[];
  total: number;
}

function agentName(row: AgentRow) {
  return `${row.agent?.firstName || ""} ${row.agent?.lastName || ""}`.trim() || row.agent?.email || "Field agent";
}

function agentInitials(row: AgentRow) {
  return agentName(row).split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";
}

function AgentDirectoryCard({ row, onRefresh }: { row: AgentRow; onRefresh: () => void }) {
  const [busy, setBusy] = useState(false);

  async function handleToggle() {
    setBusy(true);
    try {
      await apiPatch(`/admin/field-agents/${row.id}/toggle`);
      toast.success(row.isActive ? "Agent deactivated" : "Agent activated");
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message.replace(/^\d+:\s*/, "") : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="rounded-xl border-zinc-200 py-0 shadow-card">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
            {agentInitials(row)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold text-zinc-900">{agentName(row)}</p>
              <span className={`size-2 shrink-0 rounded-full ${row.isActive ? "bg-emerald-500" : "bg-zinc-300"}`} />
            </div>
            <p className="flex items-center gap-1 truncate text-xs text-zinc-500">
              <MapPin size={11} className="shrink-0 text-zinc-400" /> {row.assignedMarket}
            </p>
            <div className="mt-1"><StateChip name={row.stateName} /></div>
          </div>
        </div>

        {row.agent?.phone && (
          <a href={`tel:${row.agent.phone}`} className="mt-2.5 flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-900">
            <Phone size={11} /> {row.agent.phone}
          </a>
        )}

        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-dashed border-border pt-3 text-center">
          <div>
            <p className="text-lg font-bold text-zinc-900">{row.stats?.productsUploaded ?? 0}</p>
            <p className="text-[10px] uppercase tracking-wide text-zinc-400">Uploaded</p>
          </div>
          <div>
            <p className="text-lg font-bold text-amber-600">{row.stats?.pendingApproval ?? 0}</p>
            <p className="text-[10px] uppercase tracking-wide text-zinc-400">Pending</p>
          </div>
          <div>
            <p className="text-lg font-bold text-emerald-600">{row.stats?.approvedToday ?? 0}</p>
            <p className="text-[10px] uppercase tracking-wide text-zinc-400">Today</p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="flex-1 gap-1.5">
            <Link href={`/dashboard/field-agents/${row.id}`}>
              <Eye size={13} /> View
            </Link>
          </Button>
          <Button variant="outline" size="sm" disabled={busy} onClick={handleToggle} className="gap-1.5">
            <Power size={13} className={row.isActive ? "text-red-500" : "text-emerald-500"} />
            {row.isActive ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FieldAgentsPage() {
  const [search, setSearch] = useState("");
  const filters = useUrlFilters({ stateCode: "all" });
  const stateCode = filters.get("stateCode") || "all";
  const [busyId, setBusyId] = useState<string | null>(null);

  const stats = useApiQuery<QaStats>(["admin", "field-agents", "stats"], "/admin/field-agents/stats");
  const queue = useApiQuery<QueueResponse>(["admin", "field-agents", "queue"], "/admin/field-agents/queue?limit=50");
  const agents = useApiQuery<AgentsResponse>(["admin", "field-agents", stateCode], `/admin/field-agents${queryString({ limit: 50, stateCode })}`);

  const queueItems = (queue.data?.data ?? []).filter((item) =>
    !search || [item.title, item.market, item.agentName, item.category].some((v) =>
      v?.toLowerCase().includes(search.toLowerCase()),
    ),
  );

  const agentRows = (agents.data?.data ?? []).filter((row) =>
    !search || [agentName(row), row.assignedMarket, row.agent?.email].some((v) =>
      v?.toLowerCase().includes(search.toLowerCase()),
    ),
  );

  function refreshAll() {
    stats.refetch();
    queue.refetch();
    agents.refetch();
  }

  async function review(id: string, status: "approved" | "rejected") {
    setBusyId(id);
    try {
      await apiPatch(`/admin/products/${id}/review`, { status });
      toast.success(status === "approved" ? "Listing approved and published" : "Listing rejected");
      refreshAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message.replace(/^\d+:\s*/, "") : "Review action failed");
    } finally {
      setBusyId(null);
    }
  }

  const isLoading = stats.isLoading || queue.isLoading;

  return (
    <div className="p-2 sm:p-4">
      <PageHeader
        title="Field Agents & QA"
        description="Review catalog uploads from the field and manage market-assigned agents."
        actions={
          <>
            <div className="relative hidden sm:block">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search items or agents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-52 pl-8 lg:w-72"
              />
            </div>
            <StateDropdown value={stateCode} onChange={(value) => filters.set({ stateCode: value })} />
          </>
        }
      />

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={ShieldAlert} tone="amber" label="Pending QA Review" value={stats.data?.pendingReview ?? 0} caption="Awaiting approval" />
        <KpiCard icon={CheckCircle2} tone="green" label="Approved Today" value={stats.data?.approvedToday ?? 0} caption="Field uploads cleared" />
        <KpiCard icon={XCircle} tone="red" label="Rejected Items" value={stats.data?.rejected ?? 0} caption="Sent back for changes" />
        <KpiCard icon={Camera} tone="blue" label="Active Field Agents" value={stats.data?.activeAgents ?? 0} caption="In the markets" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="qa-queue">
        <TabsList variant="line" className="mb-4 w-full justify-start border-b border-zinc-200 bg-transparent p-0">
          <TabsTrigger
            value="qa-queue"
            className="rounded-none border-b-2 border-transparent pb-3 font-medium text-zinc-500 data-active:border-brand-gold data-active:font-semibold data-active:text-zinc-900"
          >
            QA Review Queue
            <span className="ml-2 rounded-full bg-brand-gold px-2 py-0.5 text-[11px] font-bold text-zinc-900">
              {queue.data?.queueSize ?? 0}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="agents"
            className="rounded-none border-b-2 border-transparent pb-3 font-medium text-zinc-500 data-active:border-brand-gold data-active:font-semibold data-active:text-zinc-900"
          >
            Agents Directory
            <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-600">
              {agents.data?.total ?? 0}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* ── QA queue ── */}
        <TabsContent value="qa-queue">
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <HookLoader size="page" label="Loading review queue..." />
            </div>
          )}

          {!isLoading && queueItems.length === 0 && (
            <EmptyState
              icon={CheckCircle2}
              title={search ? "No matching uploads" : "Queue is clear"}
              description={search ? `No pending uploads match "${search}".` : "No field uploads waiting for QA review."}
            />
          )}

          {!isLoading && queueItems.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {queueItems.map((item) => (
                <AgentReviewCard
                  key={item.id}
                  item={item}
                  busy={busyId === item.id}
                  onApprove={(id) => review(id, "approved")}
                  onReject={(id) => review(id, "rejected")}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Agents directory ── */}
        <TabsContent value="agents">
          {agents.isLoading && (
            <div className="flex items-center justify-center py-16">
              <HookLoader size="page" label="Loading agents..." />
            </div>
          )}

          {!agents.isLoading && agentRows.length === 0 && (
            <EmptyState
              icon={Camera}
              title={search ? "No matching agents" : "No field agents yet"}
              description={search ? `No agents match "${search}".` : "Field agents will appear here once onboarded."}
            />
          )}

          {!agents.isLoading && agentRows.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {agentRows.map((row) => (
                <AgentDirectoryCard key={row.id} row={row} onRefresh={refreshAll} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
