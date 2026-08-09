"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/PageHeader";
import { HookLoader } from "@/components/shared/HookLoader";
import { apiPost } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { toast } from "sonner";

type Row = {
  id?: string;
  publicId?: string;
  amountMinor?: number;
  orderId?: string;
  reason?: string;
  status?: string;
  idempotencyKey?: string;
};
const money = (minor?: number) => `₦${(Number(minor || 0) / 100).toLocaleString()}`;
export default function FulfilmentRefundsPage() {
  const query = useApiQuery<Row[]>(["admin", "fulfilment", "refunds"], "/admin/fulfilment/refunds?limit=100");
  const [pending, setPending] = useState<string>();
  const [orderId, setOrderId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  async function process(item: Row) {
    const id = item.publicId || item.id;
    if (!id) return;
    setPending(id);
    try { await apiPost(`/admin/fulfilment/refunds/${id}/process`, { idempotencyKey: item.idempotencyKey }); await query.refetch(); } finally { setPending(undefined); }
  }
  async function createRefund() {
    const amountMinor = Math.round(Number(amount) * 100);
    if (!orderId.trim() || !Number.isFinite(amountMinor) || amountMinor <= 0 || reason.trim().length < 3) {
      toast.error("Enter an Order, a positive amount, and a reason");
      return;
    }
    setPending("create");
    try {
      await apiPost("/admin/fulfilment/refunds", {
        orderId: orderId.trim(),
        amountMinor,
        reason: reason.trim(),
        idempotencyKey: `refund-${orderId.trim()}-${Date.now()}`,
      });
      toast.success("Refund request created");
      setOrderId("");
      setAmount("");
      setReason("");
      await query.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Refund request could not be created");
    } finally {
      setPending(undefined);
    }
  }
  if (query.isLoading) return <div className="grid min-h-80 place-items-center"><HookLoader label="Loading refunds" /></div>;
  return <div className="w-full space-y-5 px-4 py-5"><PageHeader title="Refund processing" description="Refunds are executed against captured Paystack balances and retain provider evidence." /><Card className="rounded-lg shadow-none"><CardHeader><CardTitle className="text-base">Create refund request</CardTitle><p className="text-sm text-muted-foreground">Use the Order public ID. The backend enforces captured balance, return eligibility, scope, and provider idempotency.</p></CardHeader><CardContent className="grid gap-3 md:grid-cols-[1fr_180px_1.5fr_auto] md:items-end"><div className="space-y-1"><label className="text-xs font-medium" htmlFor="refund-order">Order</label><Input id="refund-order" value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder="ORD-2026-..." /></div><div className="space-y-1"><label className="text-xs font-medium" htmlFor="refund-amount">Amount (NGN)</label><Input id="refund-amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))} placeholder="0.00" /></div><div className="space-y-1"><label className="text-xs font-medium" htmlFor="refund-reason">Reason</label><Textarea id="refund-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Why should this captured amount be refunded?" className="min-h-9" /></div><Button onClick={() => void createRefund()} disabled={pending === "create"}>{pending === "create" ? <HookLoader size="button" /> : "Create request"}</Button></CardContent></Card><Card className="rounded-lg shadow-none"><CardHeader><CardTitle className="text-base">Refund queue</CardTitle></CardHeader><CardContent className="p-0">{query.data?.length ? query.data.map((item, index) => { const id = item.publicId || item.id || `refund-${index}`; return <div key={id} className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-4"><div><p className="text-sm font-medium">{id} · {money(item.amountMinor)}</p><p className="mt-1 text-xs text-muted-foreground">Order {item.orderId} · {item.reason}</p></div><div className="flex items-center gap-2"><Badge variant={item.status === "FAILED" ? "destructive" : "secondary"}>{item.status}</Badge>{["REQUESTED", "APPROVED", "FAILED"].includes(item.status ?? "") ? <Button size="sm" onClick={() => void process(item)} disabled={pending === id}>{pending === id ? <HookLoader size="button" /> : "Process refund"}</Button> : null}</div></div>; }) : <p className="p-10 text-center text-sm text-muted-foreground">No refund records.</p>}</CardContent></Card></div>;
}
