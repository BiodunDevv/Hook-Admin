"use client";

import { useState } from "react";
import { AlertTriangle, Check, PackageCheck } from "lucide-react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { HookLoader } from "@/components/shared/HookLoader";
import { apiPost } from "@/lib/api";
import { useApiQuery } from "@/lib/query";

type TaskItem = {
  id?: string;
  _id?: string;
  productSnapshot?: { title?: string };
  productTitle?: string;
  quantity?: number;
};
type Task = {
  id?: string;
  publicId?: string;
  orderId?: string;
  marketId?: string;
  status?: string;
  version?: number;
  items?: TaskItem[];
  package?: { scanCredential?: string };
};
const label = (value?: string) => String(value || "-").replaceAll("_", " ");
const actions: Record<string, { label: string; action: string }> = { ALERTED: { label: "Accept task", action: "accept" }, ACCEPTED: { label: "Start sourcing", action: "start_sourcing" }, SOURCING: { label: "Mark product secured", action: "secure" }, PRODUCT_SECURED: { label: "Begin packing", action: "begin_packing" }, PACKING: { label: "Pack and create Hub label", action: "pack" } };

export default function RunnerFulfilmentDetailPage() {
  const params = useParams<{ id: string }>();
  const query = useApiQuery<Task>(["runner", "fulfilment", params.id], `/runner/fulfilments/${params.id}`, Boolean(params.id));
  const [pending, setPending] = useState(false);
  const [issue, setIssue] = useState("");
  const [credential, setCredential] = useState<string>();
  const [actualCost, setActualCost] = useState("");
  async function runAction(action: string) {
    if (action === "secure" && (!actualCost.trim() || !Number.isFinite(Number(actualCost)) || Number(actualCost) < 0)) return;
    setPending(true);
    try { const result = await apiPost<Task>(`/runner/fulfilments/${params.id}/${action}`, { version: query.data?.version, actualCostMinor: action === "secure" ? Math.round(Number(actualCost) * 100) : undefined }); setCredential(result.package?.scanCredential); if (action === "secure") setActualCost(""); await query.refetch(); } finally { setPending(false); }
  }
  async function reportIssue() { if (!issue.trim()) return; setPending(true); try { await apiPost(`/runner/fulfilments/${params.id}/issues`, { summary: issue.trim(), type: "ITEM_UNAVAILABLE" }); await query.refetch(); setIssue(""); } finally { setPending(false); } }
  if (query.isLoading) return <div className="grid min-h-80 place-items-center"><HookLoader label="Loading fulfilment task" /></div>;
  const task = query.data;
  if (!task) return <p className="text-sm text-destructive">This fulfilment task could not be found.</p>;
  const next = task.status ? actions[task.status] : undefined;
  const taskTitle = task.publicId || task.id || params.id || "Fulfilment task";
  return <div className="space-y-5 pb-24"><PageHeader title={taskTitle} description={`Order ${task.orderId || "-"} · Market ${task.marketId || "-"}`} actions={<Badge variant={task.status === "BLOCKED" ? "destructive" : "secondary"}>{label(task.status)}</Badge>} /><div className="grid gap-4 lg:grid-cols-[1fr_340px]"><Card className="rounded-lg shadow-none"><CardHeader><CardTitle className="text-base">Task items</CardTitle></CardHeader><CardContent className="space-y-3">{task.items?.map((item, index) => <div key={item.id || item._id || index} className="flex items-center justify-between rounded-md border p-3"><div><p className="text-sm font-medium">{item.productSnapshot?.title || item.productTitle || "Product item"}</p><p className="text-xs text-muted-foreground">Quantity {item.quantity}</p></div><PackageCheck className="size-4 text-muted-foreground" /></div>) || <p className="text-sm text-muted-foreground">Item details are not available.</p>}</CardContent></Card><div className="space-y-4"><Card className="rounded-lg shadow-none"><CardHeader><CardTitle className="text-base">Next action</CardTitle></CardHeader><CardContent>{next?.action === "secure" ? <div className="mb-3 space-y-2"><label className="text-xs font-medium" htmlFor="actual-cost">Actual sourcing cost (NGN)</label><Input id="actual-cost" inputMode="decimal" value={actualCost} onChange={(event) => setActualCost(event.target.value.replace(/[^0-9.]/g, ""))} placeholder="Amount paid at the Market" /></div> : null}{next ? <Button className="w-full bg-[#FFC809] text-black hover:bg-[#f0bb00]" onClick={() => void runAction(next.action)} disabled={pending || (next.action === "secure" && !actualCost.trim())}>{pending ? <HookLoader size="button" /> : <><Check /> {next.label}</>}</Button> : <p className="text-sm text-muted-foreground">No action is available in this state.</p>}{credential ? <div className="mt-4 rounded-md bg-amber-50 p-3 text-sm"><p className="font-medium">Hub scan credential</p><p className="mt-1 font-mono text-lg tracking-[0.3em]">{credential}</p><p className="mt-1 text-xs text-muted-foreground">Show this once to the Hub officer. It will not be displayed again.</p></div> : null}</CardContent></Card><Card className="rounded-lg shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="size-4" /> Report an issue</CardTitle></CardHeader><CardContent className="space-y-3"><Textarea value={issue} onChange={(event) => setIssue(event.target.value)} placeholder="Describe an unavailable, damaged, or sourcing issue" /><Button variant="outline" className="w-full" onClick={() => void reportIssue()} disabled={pending || !issue.trim()}>Report issue</Button></CardContent></Card></div></div></div>;
}
