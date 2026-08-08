"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AdminWorkflowSheet } from "@/components/shared/AdminWorkflowSheet";
import { HookLoader } from "@/components/shared/HookLoader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiPost } from "@/lib/api";

export type ReconcileCollection = {
  publicId: string;
  productTitleSnapshot?: string;
  paymentStatus?: string;
};

export function VendorCollectionReconcileSheet({
  collection,
  open,
  onClose,
  onSuccess,
}: {
  collection: ReconcileCollection | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [status, setStatus] = useState<"reconciled" | "disputed">("reconciled");
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const valid = Boolean(collection && reason.trim().length >= 3);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!collection || !valid) return;
    setSaving(true);
    try {
      await apiPost(`/admin/vendor-collections/${collection.publicId}/reconcile`, {
        status,
        notes: notes.trim() || undefined,
        reason: reason.trim(),
      });
      toast.success(status === "reconciled" ? "Supplier payment marked as checked" : "Supplier payment marked as having an issue");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Payment check failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminWorkflowSheet
      open={open}
      onOpenChange={(next) => { if (!next && !saving) onClose(); }}
      title="Check supplier payment"
      description={collection ? `Confirm the payment record matches the supplier collection. ${collection.productTitleSnapshot || "Supplier collection"} · ${collection.publicId}` : "Payment review"}
      footer={<><Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button><Button type="submit" form="vendor-payment-reconcile-form" variant={status === "disputed" ? "destructive" : "brand"} disabled={!valid || saving}>{saving ? <HookLoader size="button" /> : status === "reconciled" ? "Confirm payment check" : "Mark payment issue"}</Button></>}
    >
      <form id="vendor-payment-reconcile-form" onSubmit={save} className="space-y-5">
        <div className="space-y-2"><Label>Payment result</Label><Select value={status} onValueChange={(value) => setStatus(value as "reconciled" | "disputed")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="reconciled">Payment matches the record</SelectItem><SelectItem value="disputed">There is a payment problem</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label htmlFor="vendor-payment-notes">Finance notes</Label><Textarea id="vendor-payment-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Reference checks or discrepancy details" className="min-h-28" /></div>
        <div className="space-y-2"><Label htmlFor="vendor-payment-reason">Audit reason</Label><Textarea id="vendor-payment-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Why is this outcome being recorded?" className="min-h-24" required /></div>
      </form>
    </AdminWorkflowSheet>
  );
}
