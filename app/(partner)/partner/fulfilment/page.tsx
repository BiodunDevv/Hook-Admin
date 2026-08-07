"use client";

import { useState } from "react";
import { PackageCheck, ShieldAlert } from "lucide-react";
import { HookLoader } from "@/components/shared/HookLoader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiPost } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { toast } from "sonner";

type CustodyRecord = {
  publicId?: string;
  orderId?: string;
  status?: string;
  customerEmailSnapshot?: string;
  expiresAt?: string;
  receivedAt?: string;
  releasedAt?: string;
};

const statusLabel: Record<string, string> = {
  AWAITING_RECEIPT: "Awaiting receipt",
  IN_CUSTODY: "Ready for collection",
  RELEASED: "Collected",
  OVERDUE: "Overdue",
  RECOVERY: "Recovery required",
};

function formatDate(value?: string) {
  return value ? new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(value)) : "Not set";
}

export default function PartnerFulfilmentPage() {
  const custody = useApiQuery<CustodyRecord[]>(["partner", "custody"], "/partner/fulfilment/custody");
  const [releaseCodes, setReleaseCodes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  async function receive(record: CustodyRecord) {
    if (!record.publicId) return;
    setBusyId(record.publicId);
    try {
      await apiPost(`/partner/fulfilment/custody/${record.publicId}/receive`, { idempotencyKey: `partner-receive:${record.publicId}` });
      await custody.refetch();
      toast.success("Package received into Partner custody");
    } catch {
      toast.error("The package could not be received");
    } finally {
      setBusyId(null);
    }
  }

  async function release(record: CustodyRecord) {
    if (!record.publicId) return;
    const code = releaseCodes[record.publicId] || "";
    if (!/^\d{6}$/.test(code)) {
      toast.error("Enter the customer's six-digit collection code");
      return;
    }
    setBusyId(record.publicId);
    try {
      await apiPost(`/partner/fulfilment/custody/${record.publicId}/release`, { code, idempotencyKey: `partner-release:${record.publicId}:${code}` });
      await custody.refetch();
      toast.success("Order released to the customer");
    } catch {
      toast.error("The order could not be released");
    } finally {
      setBusyId(null);
    }
  }

  if (custody.isLoading) {
    return <div className="flex min-h-[55vh] items-center justify-center"><HookLoader size="page" label="Loading Partner custody" /></div>;
  }

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Partner custody</h1>
        <p className="text-muted-foreground">Receive and release only packages addressed to this Hook Partner location.</p>
      </div>
      {custody.isError ? (
        <Card><CardContent className="flex items-center gap-3 p-6 text-sm text-destructive"><ShieldAlert className="size-5" />Custody records are temporarily unavailable.</CardContent></Card>
      ) : !(custody.data || []).length ? (
        <Card><CardContent className="space-y-2 p-6"><PackageCheck className="size-6 text-muted-foreground" /><p className="font-medium">No incoming packages</p><p className="text-sm text-muted-foreground">Packages for this location will appear here after dispatch.</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {(custody.data || []).map((record) => (
            <Card key={String(record.publicId || record.orderId)}>
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base">{record.orderId || record.publicId}</CardTitle>
                  <p className="text-sm text-muted-foreground">{record.customerEmailSnapshot || "Customer details protected"}</p>
                </div>
                <Badge variant={record.status === "OVERDUE" ? "destructive" : "secondary"}>{statusLabel[record.status || ""] || record.status || "Pending"}</Badge>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Custody window</span><span>{formatDate(record.expiresAt)}</span></div>
                {record.receivedAt ? <div className="flex justify-between gap-4"><span className="text-muted-foreground">Received</span><span>{formatDate(record.receivedAt)}</span></div> : null}
                {record.releasedAt ? <div className="flex justify-between gap-4"><span className="text-muted-foreground">Released</span><span>{formatDate(record.releasedAt)}</span></div> : null}
                {record.status === "AWAITING_RECEIPT" ? <Button className="w-full" variant="brand" disabled={busyId === record.publicId} onClick={() => receive(record)}>{busyId === record.publicId ? "Receiving..." : "Confirm package receipt"}</Button> : null}
                {record.status === "IN_CUSTODY" ? (
                  <div className="space-y-2">
                    <Input inputMode="numeric" maxLength={6} placeholder="6-digit collection code" value={releaseCodes[record.publicId || ""] || ""} onChange={(event) => setReleaseCodes((current) => ({ ...current, [record.publicId || ""]: event.target.value.replace(/\D/g, "").slice(0, 6) }))} />
                    <Button className="w-full" variant="brand" disabled={busyId === record.publicId} onClick={() => release(record)}>{busyId === record.publicId ? "Releasing..." : "Release to customer"}</Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
