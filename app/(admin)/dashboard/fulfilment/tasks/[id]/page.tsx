"use client";

import Link from "next/link";
import { ArrowLeft, Box, Clock3, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HookLoader } from "@/components/shared/HookLoader";
import { PageHeader } from "@/components/shared/PageHeader";
import { useApiQuery } from "@/lib/query";

type TaskDetail = {
  task?: {
    publicId?: string;
    status?: string;
    marketId?: string;
    sourceStateId?: string;
    hubId?: string;
    runnerId?: string;
    version?: number;
    acceptanceDueAt?: string;
    sourcingDueAt?: string;
    hubHandoverDueAt?: string;
    resolutionDueAt?: string;
    actualCostMinor?: number;
    evidence?: Array<{ type?: string; note?: string; url?: string }>;
  };
  order?: { publicId?: string; commerceStatus?: string; status?: string };
  items?: Array<{ id?: string; publicId?: string; quantity?: number; fulfilmentStatus?: string; productSnapshot?: { title?: string } }>;
};

const label = (value?: string) => String(value || "-").replaceAll("_", " ");
const formatDate = (value?: string) => value ? new Date(value).toLocaleString() : "Not set";

export default function FulfilmentTaskDetailPage({ params }: { params: { id: string } }) {
  const query = useApiQuery<TaskDetail>(["admin", "fulfilment", "task", params.id], `/admin/fulfilment/tasks/${params.id}`, Boolean(params.id));
  const detail = query.data;
  const task = detail?.task;

  if (query.isLoading) return <div className="grid min-h-80 place-items-center"><HookLoader label="Loading fulfilment task" /></div>;
  if (query.isError || !task) return <div className="space-y-4"><Button variant="ghost" asChild><Link href="/dashboard/fulfilment"><ArrowLeft /> Back to control tower</Link></Button><div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">This fulfilment task could not be loaded or is outside your scope.</div></div>;

  const deadlines = [
    ["Runner acceptance", task.acceptanceDueAt],
    ["Sourcing", task.sourcingDueAt],
    ["Hub handover", task.hubHandoverDueAt],
    ["Resolution", task.resolutionDueAt],
  ] as const;

  return (
    <div className="space-y-5 pb-10">
      <PageHeader title={task.publicId || params.id} description="Scoped fulfilment task detail. Reassignment remains available from the control tower." actions={<Button variant="outline" asChild><Link href="/dashboard/fulfilment"><ArrowLeft /> Control tower</Link></Button>} />
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card className="rounded-lg shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Box className="size-4" /> Operational snapshot</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><div><p className="text-xs text-muted-foreground">Status</p><Badge className="mt-1">{label(task.status)}</Badge></div><div><p className="text-xs text-muted-foreground">Order</p><p className="mt-1 text-sm font-medium">{detail.order?.publicId || "-"}</p></div><div><p className="text-xs text-muted-foreground">Market</p><p className="mt-1 text-sm font-medium">{task.marketId || "-"}</p></div><div><p className="text-xs text-muted-foreground">Runner</p><p className="mt-1 text-sm font-medium">{task.runnerId || "Unassigned"}</p></div><div><p className="text-xs text-muted-foreground">Dispatch Hub</p><p className="mt-1 text-sm font-medium">{task.hubId || "Unassigned"}</p></div><div><p className="text-xs text-muted-foreground">Task version</p><p className="mt-1 text-sm font-medium">{task.version || 1}</p></div></CardContent></Card>
        <Card className="rounded-lg shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Clock3 className="size-4" /> SLA checkpoints</CardTitle></CardHeader><CardContent className="space-y-3">{deadlines.map(([title, value]) => <div key={title} className="flex items-start justify-between gap-3 border-b pb-3 last:border-0 last:pb-0"><div><p className="text-sm font-medium">{title}</p><p className="text-xs text-muted-foreground">{formatDate(value)}</p></div><Clock3 className="mt-0.5 size-4 text-muted-foreground" /></div>)}</CardContent></Card>
      </div>
      <Card className="rounded-lg shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><MapPin className="size-4" /> Assigned items</CardTitle></CardHeader><CardContent className="space-y-2">{detail.items?.length ? detail.items.map((item, index) => <div key={item.publicId || item.id || index} className="flex items-center justify-between gap-3 rounded-md border p-3"><div><p className="text-sm font-medium">{item.productSnapshot?.title || "Catalog item"}</p><p className="text-xs text-muted-foreground">Quantity {item.quantity || 0}</p></div><Badge variant="outline">{label(item.fulfilmentStatus)}</Badge></div>) : <p className="text-sm text-muted-foreground">No active item records are attached to this task.</p>}</CardContent></Card>
      {task.evidence?.length ? <Card className="rounded-lg shadow-none"><CardHeader><CardTitle className="text-base">Evidence</CardTitle></CardHeader><CardContent className="space-y-2">{task.evidence.map((item, index) => <div key={`${item.type || "evidence"}-${index}`} className="rounded-md border p-3 text-sm"><p className="font-medium">{item.type || "Evidence"}</p>{item.note ? <p className="mt-1 text-xs text-muted-foreground">{item.note}</p> : null}{item.url ? <a className="mt-1 block truncate text-xs text-amber-700 underline" href={item.url} target="_blank" rel="noreferrer">Open evidence</a> : null}</div>)}</CardContent></Card> : null}
    </div>
  );
}
