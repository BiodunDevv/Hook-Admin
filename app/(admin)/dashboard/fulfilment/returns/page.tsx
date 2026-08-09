"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { HookLoader } from "@/components/shared/HookLoader";
import { PageHeader } from "@/components/shared/PageHeader";
import { apiPatch } from "@/lib/api";
import { useApiQuery } from "@/lib/query";

type Row = {
  id?: string;
  _id?: string;
  publicId?: string;
  orderId?: string;
  reasonType?: string;
  reason?: string;
  status?: string;
};

const label = (value?: string) => String(value || "-").replaceAll("_", " ");

export default function FulfilmentReturnsPage() {
  const query = useApiQuery<Row[]>(["admin", "fulfilment", "returns"], "/admin/fulfilment/returns?limit=100");
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<string>();

  async function review(item: Row, decision: "APPROVED" | "REJECTED") {
    const id = item.publicId || item.id || item._id;
    if (!id || !reasons[id]?.trim()) return;
    setPending(id);
    try {
      await apiPatch(`/admin/fulfilment/returns/${id}/review`, { decision, reason: reasons[id].trim() });
      await query.refetch();
    } finally {
      setPending(undefined);
    }
  }

  if (query.isLoading) return <div className="grid min-h-80 place-items-center"><HookLoader label="Loading returns" /></div>;
  if (query.isError) return <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">Return requests could not be loaded. Refresh and try again.</div>;

  return (
    <div className="w-full space-y-5 px-4 py-5">
      <PageHeader title="Returns review" description="Review customer issues within the 24-hour delivery or collection policy window, with a recorded decision reason." />
      <Card className="rounded-lg shadow-none">
        <CardHeader><CardTitle className="text-base">Return requests</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {query.data?.length ? query.data.map((item, index) => {
            const id = item.publicId || item.id || item._id || `return-${index}`;
            const open = ["REQUESTED", "UNDER_REVIEW"].includes(String(item.status));
            return <div key={id} className="space-y-3 rounded-md border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-medium">{id}</p><p className="mt-1 text-xs text-muted-foreground">Order {item.orderId || "-"} · {label(item.reasonType)}</p><p className="mt-2 max-w-2xl text-sm text-muted-foreground">{item.reason || "No customer explanation provided."}</p></div><Badge variant={item.status === "REJECTED" ? "destructive" : "secondary"}>{label(item.status || "REQUESTED")}</Badge></div>{open ? <><Textarea value={reasons[id] || ""} onChange={(event) => setReasons((current) => ({ ...current, [id]: event.target.value }))} placeholder="Decision reason" maxLength={1000} /><div className="flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={() => void review(item, "REJECTED")} disabled={pending === id || !reasons[id]?.trim()}><X /> Reject</Button><Button onClick={() => void review(item, "APPROVED")} disabled={pending === id || !reasons[id]?.trim()}>{pending === id ? <HookLoader size="button" /> : <><Check /> Approve return</>}</Button></div></> : null}</div>;
          }) : <p className="py-10 text-center text-sm text-muted-foreground">No return requests require review.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
