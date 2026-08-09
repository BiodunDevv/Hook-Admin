"use client";

import { useState } from "react";
import { AlertTriangle, Check, Clock3, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HookLoader } from "@/components/shared/HookLoader";
import { QueryState } from "@/components/shared/QueryState";
import { apiPost } from "@/lib/api";
import { useApiQuery } from "@/lib/query";

type Check = { publicId: string; title: string; marketId: string; availabilityCheckDueAt?: string; availabilityCheckNote?: string; catalogVersion: number; status: string };

function dueLabel(value?: string) { if (!value) return "Due date pending"; const date = new Date(value); return date < new Date() ? "Overdue" : `Due ${date.toLocaleDateString("en-NG")}`; }

export function AvailabilityChecksWorkspace() {
  const query = useApiQuery<Check[]>(["runner", "availability-checks"], "/runner/availability-checks");
  const [acting, setActing] = useState<string | null>(null);
  async function confirm(item: Check, status: "available" | "limited") {
    setActing(item.publicId);
    try { await apiPost(`/runner/products/${item.publicId}/availability/confirm`, { status, version: item.catalogVersion, note: status === "limited" ? "Runner confirmed limited availability." : "Runner confirmed availability." }); toast.success(`Product marked ${status}`); await query.refetch(); } catch (error) { toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Availability could not be updated"); } finally { setActing(null); }
  }
  async function report(item: Check) {
    const note = window.prompt("Why is this product unavailable?") || "";
    if (note.trim().length < 3) return;
    setActing(item.publicId);
    try { await apiPost(`/runner/products/${item.publicId}/availability/report`, { note: note.trim(), version: item.catalogVersion }); toast.success("Product paused and Admin notified"); await query.refetch(); } catch (error) { toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Availability could not be updated"); } finally { setActing(null); }
  }
  if (query.isLoading) return <div className="grid min-h-80 place-items-center"><HookLoader label="Loading availability checks" /></div>;
  return <div className="space-y-5 pb-24"><div><h1 className="text-2xl font-semibold">Availability checks</h1><p className="mt-1 text-sm text-muted-foreground">Confirm supplier availability before products return to the customer catalog.</p></div><QueryState error={query.error} errorTitle="Availability checks could not load" empty={!query.data?.length} emptyIcon={Check} emptyTitle="You are up to date" emptyDescription="There are no products waiting for your confirmation." onRetry={() => void query.refetch()}><Card className="rounded-xl shadow-none"><CardHeader className="border-b"><CardTitle className="text-base">Products waiting for confirmation <Badge variant="outline" className="ml-2">{query.data?.length || 0}</Badge></CardTitle></CardHeader><CardContent className="p-0">{(query.data || []).map((item) => <div key={item.publicId} className="flex flex-col gap-4 border-b p-4 last:border-0 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{item.title}</p><Badge variant={item.availabilityCheckDueAt && new Date(item.availabilityCheckDueAt) < new Date() ? "destructive" : "outline"}>{item.availabilityCheckDueAt && new Date(item.availabilityCheckDueAt) < new Date() ? <AlertTriangle className="size-3" /> : <Clock3 className="size-3" />}{dueLabel(item.availabilityCheckDueAt)}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{item.publicId} · Market {item.marketId}</p><p className="mt-1 text-xs text-muted-foreground">{item.availabilityCheckNote || "Confirm with the source supplier before choosing an outcome."}</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="brand" disabled={Boolean(acting)} onClick={() => void confirm(item, "available")}><Check /> Available</Button><Button size="sm" variant="outline" disabled={Boolean(acting)} onClick={() => void confirm(item, "limited")}><Clock3 /> Limited</Button><Button size="sm" variant="destructive" disabled={Boolean(acting)} onClick={() => void report(item)}><XCircle /> Unavailable</Button></div></div>)}</CardContent></Card></QueryState></div>;
}
