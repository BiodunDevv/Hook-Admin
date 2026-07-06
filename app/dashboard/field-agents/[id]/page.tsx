"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Power } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApiPatch, useApiQuery } from "@/lib/query";
import { cleanError, number } from "@/lib/admin-utils";

interface FieldAgent { id: string; assignedMarket: string; isActive: boolean; stats?: { productsUploaded?: number; pendingApproval?: number; approvedToday?: number }; agent?: { email?: string; firstName?: string; lastName?: string }; }

export default function FieldAgentDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const query = useApiQuery<FieldAgent>(["admin", "field-agents", id], `/admin/field-agents/${id}`, Boolean(id));
  const toggle = useApiPatch<{ id: string; isActive: boolean }, undefined>(`/admin/field-agents/${id}/toggle`, ["admin", "field-agents"], { successMessage: "Field agent status updated" });
  const agent = query.data;
  const name = `${agent?.agent?.firstName || ""} ${agent?.agent?.lastName || ""}`.trim() || agent?.agent?.email || "Field agent";
  return (
    <div className="space-y-4 px-3 py-3 sm:px-5">
      <PageHeader title={name} description={agent?.assignedMarket || "Field agent profile"} actions={<><Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft size={15} /> Back</Button>{agent && <Button variant="outline" size="sm" onClick={() => toggle.mutate(undefined)}><Power size={15} /> {agent.isActive ? "Deactivate" : "Activate"}</Button>}</>} />
      {query.error && <Card><CardContent className="p-4 text-sm text-red-600">{cleanError(query.error)}</CardContent></Card>}
      {agent && <Card className="rounded-lg shadow-none"><CardContent className="grid gap-4 p-4 text-sm md:grid-cols-2"><div><p className="text-muted-foreground">Status</p><StatusBadge status={agent.isActive ? "Active" : "Inactive"} /></div><div><p className="text-muted-foreground">Market</p><p>{agent.assignedMarket}</p></div><div><p className="text-muted-foreground">Uploaded</p><p>{number(agent.stats?.productsUploaded)}</p></div><div><p className="text-muted-foreground">Pending QA</p><p>{number(agent.stats?.pendingApproval)}</p></div></CardContent></Card>}
    </div>
  );
}
