"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AdminWorkflowSheet } from "@/components/shared/AdminWorkflowSheet";
import { HookLoader } from "@/components/shared/HookLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiPatch } from "@/lib/api";
import type { MarketVendorRecord } from "./market-types";

type FormState = {
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  preferredContactChannel: string;
  status: string;
  notes: string;
  reason: string;
};

function initialForm(vendor: MarketVendorRecord): FormState {
  return {
    businessName: vendor.businessName,
    contactName: vendor.contactName,
    phone: vendor.phone,
    email: vendor.email || "",
    address: vendor.address || "",
    preferredContactChannel: vendor.preferredContactChannel || "phone",
    status: vendor.status || "pending",
    notes: vendor.notes || "",
    reason: "",
  };
}

export function MarketVendorEditSheet({
  vendor,
  open,
  onClose,
  onSuccess,
}: {
  vendor: MarketVendorRecord | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => (vendor ? initialForm(vendor) : initialForm({} as MarketVendorRecord)));
  const [saving, setSaving] = useState(false);

  function update(key: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!vendor || form.businessName.trim().length < 2 || form.contactName.trim().length < 2 || form.phone.trim().length < 7 || form.reason.trim().length < 3) return;
    setSaving(true);
    try {
      await apiPatch(`/admin/market-vendors/${vendor.publicId}`, {
        businessName: form.businessName.trim(),
        contactName: form.contactName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        preferredContactChannel: form.preferredContactChannel,
        status: form.status,
        notes: form.notes.trim() || undefined,
        reason: form.reason.trim(),
      });
      toast.success("Supplier details updated");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Supplier details could not be updated");
    } finally {
      setSaving(false);
    }
  }

  const valid = Boolean(vendor && form.businessName.trim().length >= 2 && form.contactName.trim().length >= 2 && form.phone.trim().length >= 7 && form.reason.trim().length >= 3);
  return (
    <AdminWorkflowSheet
      open={open}
      onOpenChange={(next) => { if (!next && !saving) onClose(); }}
      title="Edit Market supplier"
      description={vendor ? `${vendor.businessName} · ${vendor.publicId}` : "Supplier details"}
      footer={<><Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button><Button form="market-vendor-edit-form" type="submit" variant="brand" disabled={!valid || saving}>{saving ? <HookLoader size="button" /> : "Save changes"}</Button></>}
    >
      <form id="market-vendor-edit-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="market-vendor-business">Business name</Label><Input id="market-vendor-business" value={form.businessName} onChange={(event) => update("businessName", event.target.value)} required /></div>
        <div className="space-y-2"><Label htmlFor="market-vendor-contact">Contact name</Label><Input id="market-vendor-contact" value={form.contactName} onChange={(event) => update("contactName", event.target.value)} required /></div>
        <div className="space-y-2"><Label htmlFor="market-vendor-phone">Phone number</Label><Input id="market-vendor-phone" type="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} required /></div>
        <div className="space-y-2"><Label htmlFor="market-vendor-email">Email <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="market-vendor-email" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} /></div>
        <div className="space-y-2"><Label>Preferred contact</Label><Select value={form.preferredContactChannel} onValueChange={(value) => update("preferredContactChannel", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="phone">Phone</SelectItem><SelectItem value="email">Email</SelectItem><SelectItem value="whatsapp">WhatsApp</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={(value) => update("status", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Pending consent</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="blocked">Blocked</SelectItem></SelectContent></Select></div>
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="market-vendor-address">Market address or stall reference</Label><Textarea id="market-vendor-address" value={form.address} onChange={(event) => update("address", event.target.value)} className="min-h-20" /></div>
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="market-vendor-notes">Operations notes</Label><Textarea id="market-vendor-notes" value={form.notes} onChange={(event) => update("notes", event.target.value)} className="min-h-20" /></div>
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="market-vendor-reason">Audit reason</Label><Textarea id="market-vendor-reason" value={form.reason} onChange={(event) => update("reason", event.target.value)} placeholder="Why is this supplier record being changed?" className="min-h-20" required /><p className="text-xs text-muted-foreground">Bank account numbers remain encrypted and are never editable from this general Admin form.</p></div>
      </form>
    </AdminWorkflowSheet>
  );
}
