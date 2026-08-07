"use client";

import Link from "next/link";
import { ArrowRight, Clock3, PackageCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { HookLoader } from "@/components/shared/HookLoader";
import { useApiQuery } from "@/lib/query";

type Row = {
  id?: string;
  publicId?: string;
  status?: string;
  marketId?: string;
  orderId?: string;
  acceptanceDueAt?: string;
};
type RunnerTasks = { data: Row[]; total: number };
const label = (value?: string) => String(value || "-").replaceAll("_", " ");

export default function RunnerFulfilmentsPage() {
  const query = useApiQuery<RunnerTasks>(["runner", "fulfilments"], "/runner/fulfilments?limit=100");
  const rows = query.data?.data || [];
  if (query.isLoading) return <div className="grid min-h-80 place-items-center"><HookLoader label="Loading assigned fulfilments" /></div>;
  return <div className="space-y-5 pb-24"><PageHeader title="Assigned fulfilments" description="Accept, source, secure, pack, and hand over only the tasks assigned to your Markets." /><Card className="rounded-lg shadow-none"><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">Your task queue</CardTitle><span className="text-xs text-muted-foreground">{query.data?.total || 0} active</span></CardHeader><CardContent className="p-0">{rows.length ? rows.map((task) => <Link key={task.publicId || task.id} href={`/runner/fulfilments/${task.publicId || task.id}`} className="flex items-center justify-between gap-3 border-t p-4 transition-colors hover:bg-muted/40"><div className="min-w-0"><div className="flex items-center gap-2"><PackageCheck className="size-4 shrink-0" /><p className="truncate text-sm font-medium">{task.publicId || task.id}</p><Badge variant={task.status === "BLOCKED" ? "destructive" : "secondary"}>{label(task.status)}</Badge></div><p className="mt-1 truncate text-xs text-muted-foreground">Market {task.marketId || "-"} · Order {task.orderId || "-"}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3" /> Accept by {task.acceptanceDueAt ? new Date(task.acceptanceDueAt).toLocaleString() : "-"}</p></div><ArrowRight className="size-4 shrink-0 text-muted-foreground" /></Link>) : <p className="p-10 text-center text-sm text-muted-foreground">No fulfilment tasks are assigned to you.</p>}</CardContent></Card></div>;
}
