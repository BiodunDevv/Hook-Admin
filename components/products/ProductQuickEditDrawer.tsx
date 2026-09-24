"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AdminWorkflowSheet } from "@/components/shared/AdminWorkflowSheet";
import { HookLoader } from "@/components/shared/HookLoader";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiPatch } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import type { ProductRow } from "./product-types";

interface ProductPriceDetail {
  id: string;
  costPrice: number;
  sellingPrice: number;
  minAcceptablePrice: number;
  quantity: number;
  status: string;
}

const STATUS_OPTIONS = [
  { value: "published", label: "Active on Hook" },
  { value: "draft", label: "Draft" },
  { value: "paused", label: "Paused" },
  { value: "unpublished", label: "Unpublished" },
  { value: "disabled", label: "Disabled" },
];

/**
 * A fast path for the single most common admin edit — price, stock, or
 * visibility — without leaving the products list. Submits to the same
 * PATCH /admin/products/:id the full edit page uses, so it picks up that
 * endpoint's "reason required when a price actually changes" rule for free.
 */
export function ProductQuickEditDrawer({
  product,
  onOpenChange,
  onSaved,
}: {
  product: ProductRow | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const open = Boolean(product);
  const detail = useApiQuery<ProductPriceDetail>(
    ["admin", "products", product?.id, "quick-edit"],
    `/admin/products/${product?.id}`,
    open && Boolean(product?.id),
  );

  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [minAcceptablePrice, setMinAcceptablePrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [status, setStatus] = useState("draft");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  // Keep the editable draft aligned with whichever product's detail last loaded.
  const [prevData, setPrevData] = useState(detail.data);
  if (detail.data !== prevData) {
    setPrevData(detail.data);
    if (detail.data) {
      setCostPrice(String(detail.data.costPrice ?? ""));
      setSellingPrice(String(detail.data.sellingPrice ?? ""));
      setMinAcceptablePrice(String(detail.data.minAcceptablePrice ?? ""));
      setQuantity(String(detail.data.quantity ?? ""));
      setStatus(detail.data.status || "draft");
      setReason("");
    }
  }

  async function save() {
    if (!product) return;
    setSaving(true);
    try {
      await apiPatch(`/admin/products/${product.id}`, {
        costPrice: Number(costPrice || 0),
        sellingPrice: Number(sellingPrice || 0),
        minAcceptablePrice: Number(minAcceptablePrice || 0),
        quantity: Number(quantity || 0),
        status,
        reason: reason.trim() || undefined,
      });
      toast.success("Product updated");
      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Could not update this product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminWorkflowSheet
      open={open}
      onOpenChange={(next) => { if (!saving) onOpenChange(next); }}
      title={product ? `Quick edit — ${product.title}` : "Quick edit"}
      description="Price, stock, and visibility only. Open the full product page for everything else."
      footer={(
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button variant="brand" onClick={() => void save()} disabled={saving || detail.isLoading}>
            {saving ? <HookLoader size="button" /> : "Save changes"}
          </Button>
        </>
      )}
    >
      {detail.isLoading ? (
        <div className="grid min-h-40 place-items-center"><HookLoader label="Loading product" /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field><FieldLabel>Cost price</FieldLabel><Input type="number" min="1" value={costPrice} onChange={(event) => setCostPrice(event.target.value)} /></Field>
          <Field><FieldLabel>Hook platform price</FieldLabel><Input type="number" min="1" value={sellingPrice} onChange={(event) => setSellingPrice(event.target.value)} /></Field>
          <Field><FieldLabel>Negotiation floor</FieldLabel><Input type="number" min="1" value={minAcceptablePrice} onChange={(event) => setMinAcceptablePrice(event.target.value)} /></Field>
          <Field><FieldLabel>Stock</FieldLabel><Input type="number" min="0" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></Field>
          <Field className="sm:col-span-2">
            <FieldLabel>Visibility</FieldLabel>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{STATUS_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel>Reason for change</FieldLabel>
            <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Required if you change any price above" maxLength={500} />
            <FieldDescription>Recorded in the audit log. Only required when a price is actually changed.</FieldDescription>
          </Field>
        </div>
      )}
    </AdminWorkflowSheet>
  );
}
