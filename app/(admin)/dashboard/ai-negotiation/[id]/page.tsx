"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { CompactStatGrid } from "@/components/shared/CompactStatGrid";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { QueryState } from "@/components/shared/QueryState";
import { DetailSection } from "@/components/shared/DetailSection";
import { DefinitionGrid } from "@/components/shared/DefinitionGrid";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/lib/query";
import { money } from "@/lib/admin-utils";

interface Negotiation { id: string; status: string; offeredPrice: number; acceptedPrice?: number; message?: string; product?: { title?: string }; user?: { email?: string; firstName?: string; lastName?: string }; updatedAt: string; }

export default function NegotiationDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const query = useApiQuery<Negotiation>(["admin", "negotiations", id], `/admin/negotiations/${id}`, Boolean(id));
  const item = query.data;
  return (
    <div className="w-full space-y-5 px-4 py-5">
      <PageHeader title={item?.product?.title || "Negotiation Detail"} description={item?.user?.email || "AI negotiation session"} actions={<Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft size={15} /> Back</Button>} />
      <QueryState loading={query.isLoading} error={query.error} loadingLabel="Loading negotiation" onRetry={() => query.refetch()}>
        {item ? <><CompactStatGrid stats={[{ label: "Customer offer", value: money(item.offeredPrice), tone: "amber" }, { label: "Accepted price", value: money(item.acceptedPrice), tone: "green" }, { label: "Session status", value: item.status }]} /><div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]"><DetailSection title="Conversation outcome" description="Customer-safe negotiation response recorded for this session."><div className="flex items-start gap-3"><StatusBadge status={item.status} /><p className="text-sm leading-6 text-muted-foreground">{item.message || "No customer message recorded."}</p></div></DetailSection><DetailSection title="Session context" description="Customer and lifecycle metadata."><DefinitionGrid columns={1} items={[{ label: "Customer", value: `${item.user?.firstName || ""} ${item.user?.lastName || ""}`.trim() || item.user?.email || "Guest customer" }, { label: "Updated", value: new Date(item.updatedAt).toLocaleString("en-NG") }]} /></DetailSection></div></> : null}
      </QueryState>
    </div>
  );
}
