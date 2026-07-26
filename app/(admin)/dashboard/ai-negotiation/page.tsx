"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  TrendingDown,
  XCircle,
  Bot,
  Filter,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { HookLoader } from "@/components/shared/HookLoader";
import { Button } from "@/components/ui/button";
import { NegotiationSession } from "@/components/ai-negotiation/NegotiationSession";
import { ChatInterface, type NegotiationDetail } from "@/components/ai-negotiation/ChatInterface";
import type { Session } from "@/components/ai-negotiation/NegotiationSession";
import { useApiQuery } from "@/lib/query";

interface NegotiationRow {
  id: string;
  status: string;
  offeredPrice: number;
  counterPrice: number;
  acceptedPrice?: number;
  costPrice: number;
  sellingPrice: number;
  minAcceptablePrice: number;
  messageHistory?: NegotiationDetail["messageHistory"];
  updatedAt: string;
  product?: { title?: string; images?: string[] };
  user?: { firstName?: string; lastName?: string; email?: string };
}

interface Page<T> { data: T[]; total: number; accepted?: number; conversionRate?: number; }

const STATUS_FILTERS = ["all", "active", "accepted", "declined", "expired"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export default function AINegotiationPage() {
  const [activeSession, setActiveSession] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const query = useApiQuery<Page<NegotiationRow>>(["admin", "negotiations"], "/admin/negotiations");
  const rows = useMemo(() => query.data?.data || [], [query.data]);
  const sessions = useMemo<Session[]>(() => rows.map((item) => {
    const customer = `${item.user?.firstName || ""} ${item.user?.lastName || ""}`.trim()
      || item.user?.email || "Customer";
    const statusColor =
      item.status === "accepted" ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : item.status === "active" ? "text-blue-700 bg-blue-50 border-blue-200"
      : item.status === "declined" ? "text-red-700 bg-red-50 border-red-200"
      : "text-zinc-600 bg-zinc-50 border-zinc-200";
    return {
      id: item.id,
      status: item.status,
      statusColor,
      time: new Date(item.updatedAt).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
      product: item.product?.title || "Product",
      customer,
      amountLabel: item.acceptedPrice ? "Closed at" : "Offered",
      amount: `₦${Number(item.acceptedPrice || item.offeredPrice || 0).toLocaleString()}`,
      amountColor: item.acceptedPrice ? "text-emerald-600" : "text-zinc-700",
      img: item.product?.images?.[0] || "",
      hasIcon: !item.product?.images?.[0],
    };
  }), [rows]);
  const metrics = useMemo(() => ({
    active: rows.filter((item) => item.status === "active").length,
    accepted: query.data?.accepted ?? rows.filter((item) => item.status === "accepted").length,
    declined: rows.filter((item) => item.status === "declined" || item.status === "expired").length,
    conversionRate: query.data?.conversionRate || 0,
  }), [query.data, rows]);
  const isLoading = query.isLoading;
  const error = query.isError;

  const filteredSessions = statusFilter === "all"
    ? sessions
    : sessions.filter((s) => s.status === statusFilter);

  const selectedNegotiation = rows.find((r) => r.id === (activeSession || rows[0]?.id));

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden p-2 sm:p-4">
      <PageHeader
        title="AI Negotiation Engine"
        description="Monitor automated haggling, configure margin floors, and step in when needed."
        actions={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Bot size={15} className="text-zinc-500" />
            <span className="hidden sm:inline">Engine Config</span>
          </Button>
        }
      />

      {/* KPI Row */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={Activity} tone="blue" label="Active Sessions" value={isLoading ? "—" : metrics.active} caption="Live negotiations" />
        <KpiCard icon={CheckCircle2} tone="green" label="Deals Closed" value={isLoading ? "—" : metrics.accepted} caption="Accepted offers" />
        <KpiCard icon={TrendingDown} tone="amber" label="Conversion Rate" value={isLoading ? "—" : `${metrics.conversionRate}%`} caption="Accepted / total" />
        <KpiCard icon={XCircle} tone="red" label="Declined / Expired" value={isLoading ? "—" : metrics.declined} caption="No deal reached" />
      </div>

      {/* Filter pills */}
      <div className="mb-3 flex items-center gap-1.5 overflow-x-auto pb-1">
        <Filter size={13} className="shrink-0 text-zinc-400" />
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => {
              setStatusFilter(f);
              setActiveSession(
                (f === "all" ? sessions : sessions.filter((s) => s.status === f))[0]?.id || "",
              );
            }}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold capitalize transition-colors ${
              statusFilter === f
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-border bg-card text-zinc-500 hover:border-zinc-300 hover:text-zinc-900"
            }`}
          >
            {f === "all" ? `All (${sessions.length})` : `${f} (${sessions.filter((s) => s.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Main workspace */}
      {isLoading && (
        <div className="flex flex-1 items-center justify-center">
          <HookLoader size="page" label="Loading negotiations..." />
        </div>
      )}

      {!isLoading && error && (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-red-200 bg-red-50">
          <p className="text-sm text-red-600">Failed to load negotiations. Please refresh.</p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
          <NegotiationSession
            sessions={filteredSessions}
            activeSession={activeSession}
            onSelect={setActiveSession}
            isLoading={false}
          />
          <ChatInterface negotiation={selectedNegotiation} />
        </div>
      )}
    </div>
  );
}
