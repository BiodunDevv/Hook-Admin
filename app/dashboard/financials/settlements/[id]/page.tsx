"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { CompactStatGrid } from "@/components/shared/CompactStatGrid";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApiQuery } from "@/lib/query";
import { cleanError, money } from "@/lib/admin-utils";

interface Settlement { id: string; itemTotal: number; commissionAmount: number; netAmount: number; status: string; escrowReleaseAt?: string; vendor?: { businessName?: string }; }

export default function SettlementDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const query = useApiQuery<Settlement>(["admin", "settlements", id], `/admin/financials/settlements/${id}`, Boolean(id));
  const settlement = query.data;
  return (
    <div className="space-y-4 px-3 py-3 sm:px-5">
      <PageHeader title="Settlement Detail" description={settlement?.vendor?.businessName || "Vendor payout record"} actions={<Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft size={15} /> Back</Button>} />
      {query.error && <Card><CardContent className="p-4 text-sm text-red-600">{cleanError(query.error)}</CardContent></Card>}
      {settlement && <><CompactStatGrid stats={[{ label: "Item Total", value: money(settlement.itemTotal), tone: "blue" }, { label: "Commission", value: money(settlement.commissionAmount), tone: "amber" }, { label: "Net", value: money(settlement.netAmount), tone: "green" }]} /><Card className="rounded-lg shadow-none"><CardContent className="grid gap-4 p-4 text-sm md:grid-cols-2"><div><p className="text-muted-foreground">Status</p><StatusBadge status={settlement.status} /></div><div><p className="text-muted-foreground">Release</p><p>{settlement.escrowReleaseAt ? new Date(settlement.escrowReleaseAt).toLocaleString() : "Not scheduled"}</p></div></CardContent></Card></>}
    </div>
  );
}
