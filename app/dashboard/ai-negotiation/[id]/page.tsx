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

interface Negotiation { id: string; status: string; offeredPrice: number; acceptedPrice?: number; message?: string; product?: { title?: string }; user?: { email?: string; firstName?: string; lastName?: string }; updatedAt: string; }

export default function NegotiationDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const query = useApiQuery<Negotiation>(["admin", "negotiations", id], `/admin/negotiations/${id}`, Boolean(id));
  const item = query.data;
  return (
    <div className="space-y-4 px-3 py-3 sm:px-5">
      <PageHeader title={item?.product?.title || "Negotiation Detail"} description={item?.user?.email || "AI negotiation session"} actions={<Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft size={15} /> Back</Button>} />
      {query.error && <Card><CardContent className="p-4 text-sm text-red-600">{cleanError(query.error)}</CardContent></Card>}
      {item && <><CompactStatGrid stats={[{ label: "Offered", value: money(item.offeredPrice), tone: "amber" }, { label: "Accepted", value: money(item.acceptedPrice), tone: "green" }, { label: "Status", value: item.status }]} /><Card className="rounded-lg shadow-none"><CardContent className="space-y-3 p-4 text-sm"><StatusBadge status={item.status} /><p>{item.message || "No customer message recorded."}</p><p className="text-muted-foreground">Updated {new Date(item.updatedAt).toLocaleString()}</p></CardContent></Card></>}
    </div>
  );
}
