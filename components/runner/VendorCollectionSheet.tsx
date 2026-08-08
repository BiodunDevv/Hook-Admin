"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AdminWorkflowSheet } from "@/components/shared/AdminWorkflowSheet";
import { HookLoader } from "@/components/shared/HookLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { apiPost } from "@/lib/api";

type Submission = {
  publicId: string;
  basicTitle: string;
  marketVendorId?: string;
  marketVendorName?: string;
};

function toMinorUnits(value: string) {
  return Math.round(Number(value || 0) * 100);
}

export function VendorCollectionSheet({
  submission,
  open,
  onClose,
  onSuccess,
}: {
  submission: Submission | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [quantity, setQuantity] = useState("1");
  const [actualCost, setActualCost] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentRecorded, setPaymentRecorded] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentReference, setPaymentReference] = useState("");
  const [saving, setSaving] = useState(false);

  const valid = Boolean(
    submission?.marketVendorId
      && Number.isInteger(Number(quantity))
      && Number(quantity) > 0
      && Number(actualCost) > 0
      && (!paymentRecorded || Number(paymentAmount) > 0),
  );

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!submission || !valid) return;
    setSaving(true);
    try {
      await apiPost(`/runner/product-submissions/${submission.publicId}/collection`, {
        quantity: Number(quantity),
        actualCostMinor: toMinorUnits(actualCost),
        notes: notes.trim() || undefined,
        evidenceAssetIds: [],
        payment: paymentRecorded ? {
          amountMinor: toMinorUnits(paymentAmount),
          method: paymentMethod,
          proofAssetIds: [],
          reference: paymentReference.trim() || undefined,
        } : undefined,
      });
      toast.success("Supplier collection recorded");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Collection could not be recorded");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminWorkflowSheet
      open={open}
      onOpenChange={(next) => { if (!next && !saving) onClose(); }}
      title="Record supplier collection"
      description={submission ? `${submission.basicTitle} · ${submission.marketVendorName || submission.marketVendorId || "Supplier required"}` : "Collection details"}
      footer={<><Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button><Button type="submit" form="vendor-collection-form" variant="brand" disabled={!valid || saving}>{saving ? <HookLoader size="button" /> : "Record collection"}</Button></>}
    >
      <form id="vendor-collection-form" onSubmit={save} className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="collection-quantity">Quantity collected</Label><Input id="collection-quantity" type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="collection-cost">Actual procurement cost</Label><div className="relative"><span className="pointer-events-none absolute left-3 top-2.5 text-sm text-muted-foreground">₦</span><Input id="collection-cost" inputMode="decimal" className="pl-7" value={actualCost} onChange={(event) => setActualCost(event.target.value)} placeholder="0.00" /></div><p className="text-xs text-muted-foreground">Internal only. Customer pricing is unchanged.</p></div>
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="collection-notes">Collection notes</Label><Textarea id="collection-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Condition, stall reference, or sourcing context" className="min-h-24" /></div>
        <div className="flex items-center justify-between gap-4 rounded-xl border bg-muted/20 p-4 sm:col-span-2"><div><p className="text-sm font-medium">Add supplier payment details</p><p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">Save what was paid to the supplier. Finance will check the details later; recording them here does not mark the payment as verified.</p></div><Switch checked={paymentRecorded} onCheckedChange={setPaymentRecorded} aria-label="Add supplier payment details" /></div>
        {paymentRecorded ? <>
          <div className="space-y-2"><Label htmlFor="collection-payment-amount">Amount paid to supplier</Label><div className="relative"><span className="pointer-events-none absolute left-3 top-2.5 text-sm text-muted-foreground">₦</span><Input id="collection-payment-amount" inputMode="decimal" className="pl-7" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} placeholder="0.00" /></div></div>
          <div className="space-y-2"><Label>Payment method</Label><Select value={paymentMethod} onValueChange={setPaymentMethod}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="bank_transfer">Bank transfer</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="collection-payment-reference">Payment reference <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="collection-payment-reference" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="Transfer reference or receipt number" /></div>
        </> : null}
      </form>
    </AdminWorkflowSheet>
  );
}
