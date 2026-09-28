"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ColorPicker } from "@/components/mobile/ColorPicker";

export type ItemResolutionView = {
  publicId?: string; id?: string; version: number; type: string; summary: string; status: string;
  originalSnapshot?: { title?: string; quantity?: number; selectedVariants?: { color?: string; size?: string }; unitPriceMinor?: number };
};

export function ItemResolutionCard({ issue, taskId }: { issue: ItemResolutionView; taskId: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const original = issue.originalSnapshot || {};
  const [title, setTitle] = useState(original.title || "");
  const [color, setColor] = useState(original.selectedVariants?.color || "");
  const [size, setSize] = useState(original.selectedVariants?.size || "");
  const [quantity, setQuantity] = useState(String(original.quantity || 1));
  const [price, setPrice] = useState(String(Number(original.unitPriceMinor || 0) / 100));
  const [reason, setReason] = useState("");
  const canPropose = ["OPEN", "ADMIN_REVIEW", "DECLINED"].includes(issue.status);

  async function submit() {
    setPending(true);
    try {
      await apiPost(`/admin/fulfilment/issues/${issue.publicId || issue.id}/proposals`, {
        version: issue.version, productTitle: title, color, size, quantity: Number(quantity),
        unitPriceMinor: Math.round(Number(price) * 100), reason,
      });
      toast.success("Replacement sent to the customer for approval");
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["admin", "fulfilment", "task", taskId] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Proposal could not be sent");
    } finally { setPending(false); }
  }

  const canSubmit = !pending && title.trim() && color.trim() && size.trim() && quantity && price && reason.trim().length >= 3;

  return <div className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm ring-1 ring-black/5">
    <div className="flex items-start justify-between gap-3 bg-amber-50/70 px-4 py-3.5">
      <div className="flex min-w-0 gap-2.5">
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-amber-100"><AlertTriangle className="size-4 text-amber-700" /></span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-950">{original.title || "Order item"}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{issue.summary}</p>
          <span className="mt-1.5 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800">{issue.type.replaceAll("_", " ")}</span>
        </div>
      </div>
      <StatusBadge status={issue.status} className="shrink-0" />
    </div>

    {canPropose && (
      <div className="px-4 py-3">
        <Button size="sm" variant={open ? "outline" : "default"} onClick={() => setOpen((value) => !value)}>{open ? "Close" : "Propose replacement"}</Button>
      </div>
    )}

    {open && (
      <div className="space-y-4 border-t bg-zinc-50/60 px-4 py-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor={`${issue.publicId || issue.id}-title`}>Replacement product</Label>
            <Input id={`${issue.publicId || issue.id}-title`} className="bg-white" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${issue.publicId || issue.id}-color`}>Colour</Label>
            <ColorPicker value={color} onChange={setColor} className="bg-white" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${issue.publicId || issue.id}-size`}>Size</Label>
            <Input id={`${issue.publicId || issue.id}-size`} className="bg-white" value={size} onChange={(event) => setSize(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${issue.publicId || issue.id}-qty`}>Quantity</Label>
            <Input id={`${issue.publicId || issue.id}-qty`} className="bg-white" inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value.replace(/\D/g, ""))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${issue.publicId || issue.id}-price`}>Unit price (NGN)</Label>
            <Input id={`${issue.publicId || issue.id}-price`} className="bg-white" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value.replace(/[^0-9.]/g, ""))} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor={`${issue.publicId || issue.id}-reason`}>Reason shown to customer</Label>
            <Textarea id={`${issue.publicId || issue.id}-reason`} className="min-h-24 bg-white" placeholder="Explain why this replacement is being offered" value={reason} onChange={(event) => setReason(event.target.value)} />
          </div>
        </div>
        <Button className="w-full sm:w-auto" disabled={!canSubmit} onClick={() => void submit()}>{pending ? "Sending…" : "Send for customer approval"}</Button>
      </div>
    )}

    {["PAYMENT_PENDING", "REFUND_PENDING"].includes(issue.status) && (
      <div className="border-t bg-white px-4 py-3.5 text-sm text-zinc-800">
        <p className="font-semibold">{issue.status === "PAYMENT_PENDING" ? "Waiting for the customer’s secure Paystack top-up" : "Paystack refund is being verified"}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">This task resumes automatically after signed provider verification. No manual transaction reference is required.</p>
      </div>
    )}
  </div>;
}
