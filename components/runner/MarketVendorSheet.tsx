"use client";

import { useState } from "react";
import { Check, Copy, Mail, Phone, Save, Send, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { AdminWorkflowSheet } from "@/components/shared/AdminWorkflowSheet";
import { HookLoader } from "@/components/shared/HookLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiPost } from "@/lib/api";

type InviteResponse = {
  vendor: { publicId: string; businessName: string };
  invitation: { inviteUrl: string; expiresAt: string; delivery?: { delivered: boolean; provider: string } };
};

const initialForm = {
  businessName: "",
  contactName: "",
  phone: "",
  email: "",
  address: "",
  preferredContactChannel: "phone",
  paymentMethod: "cash",
  bankName: "",
  bankCode: "",
  accountName: "",
  accountNumber: "",
  notes: "",
};

export function MarketVendorSheet({
  marketId,
  marketName,
  open,
  onClose,
  onSuccess,
}: {
  marketId: string;
  marketName: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<InviteResponse | null>(null);

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.businessName.trim() || !form.contactName.trim() || !form.phone.trim()) return;
    setSaving(true);
    try {
      const response = await apiPost<InviteResponse>(`/runner/markets/${marketId}/vendors`, {
        businessName: form.businessName.trim(),
        contactName: form.contactName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        preferredContactChannel: form.preferredContactChannel,
        paymentProfile: {
          method: form.paymentMethod,
          bankName: form.bankName.trim() || undefined,
          bankCode: form.bankCode.trim() || undefined,
          accountName: form.accountName.trim() || undefined,
          accountNumber: form.accountNumber.trim() || undefined,
        },
        notes: form.notes.trim() || undefined,
      });
      setResult(response);
      toast.success("Supplier added and invitation prepared");
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Supplier could not be added");
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    if (!result?.invitation.inviteUrl) return;
    await navigator.clipboard.writeText(result.invitation.inviteUrl);
    toast.success("Invitation link copied");
  }

  const valid = Boolean(form.businessName.trim() && form.contactName.trim() && form.phone.trim());
  return (
    <AdminWorkflowSheet
      open={open}
      onOpenChange={(next) => { if (!next && !saving) onClose(); }}
      title={result ? "Supplier invitation ready" : "Add Market supplier"}
      description={result ? "Share the one-time link with the supplier. It expires after seven days." : `Track a supplier connected to ${marketName}. Supplier records are Market-specific and do not create a login account.`}
      footer={result ? <Button variant="brand" onClick={onClose}>Done</Button> : <><Button variant="outline" disabled={saving} onClick={onClose}>Cancel</Button><Button form="vendor-form" type="submit" variant="brand" disabled={!valid || saving}>{saving ? <HookLoader size="button" /> : <><Send className="size-4" /> Add and invite</>}</Button></>}
    >
      {result ? (
        <div className="space-y-5">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5"><div className="flex items-center gap-2 font-semibold text-emerald-800"><Check className="size-5" /> {result.vendor.businessName} is now tracked</div><p className="mt-2 text-sm leading-6 text-emerald-900/75">The supplier can review and consent to the profile through the secure link below. No supplier account was created.</p></div>
          <div className="space-y-2"><Label>One-time invitation link</Label><div className="flex gap-2"><Input readOnly value={result.invitation.inviteUrl} /><Button type="button" variant="outline" size="icon" onClick={() => void copyLink()} aria-label="Copy invitation link"><Copy /></Button></div><p className="text-xs text-muted-foreground">Expires {new Date(result.invitation.expiresAt).toLocaleString("en-NG")}. {result.invitation.delivery?.delivered ? "Brevo email sent." : "Share this link directly."}</p></div>
        </div>
      ) : (
        <form id="vendor-form" onSubmit={save} className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2"><p className="flex items-center gap-2 text-sm font-semibold"><UserPlus className="size-4 text-brand-gold" /> Supplier identity</p><p className="text-xs leading-5 text-muted-foreground">This supplier belongs to this Market only. The same person can be tracked separately in another Market.</p></div>
          <div className="space-y-2"><Label htmlFor="vendor-business">Business name</Label><Input id="vendor-business" value={form.businessName} onChange={(event) => update("businessName", event.target.value)} placeholder="Business or stall name" required /></div>
          <div className="space-y-2"><Label htmlFor="vendor-contact">Contact name</Label><Input id="vendor-contact" value={form.contactName} onChange={(event) => update("contactName", event.target.value)} placeholder="Primary contact" required /></div>
          <div className="space-y-2"><Label htmlFor="vendor-phone">Phone number</Label><Input id="vendor-phone" type="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="080..." required /></div>
          <div className="space-y-2"><Label htmlFor="vendor-email">Email <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="vendor-email" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="supplier@example.com" /></div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="vendor-address">Market address or stall reference</Label><Textarea id="vendor-address" value={form.address} onChange={(event) => update("address", event.target.value)} placeholder="Where the Runner can find the supplier" className="min-h-20" /></div>
          <div className="space-y-2"><Label>Preferred contact channel</Label><Select value={form.preferredContactChannel} onValueChange={(value) => update("preferredContactChannel", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="phone"><span className="flex items-center gap-2"><Phone className="size-4" /> Phone</span></SelectItem><SelectItem value="email"><span className="flex items-center gap-2"><Mail className="size-4" /> Email</span></SelectItem><SelectItem value="whatsapp">WhatsApp</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>Procurement payment method</Label><Select value={form.paymentMethod} onValueChange={(value) => update("paymentMethod", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="bank_transfer">Bank transfer</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
          {form.paymentMethod === "bank_transfer" ? <><div className="space-y-2"><Label htmlFor="vendor-bank">Bank name</Label><Input id="vendor-bank" value={form.bankName} onChange={(event) => update("bankName", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="vendor-bank-code">Bank code</Label><Input id="vendor-bank-code" value={form.bankCode} onChange={(event) => update("bankCode", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="vendor-account-name">Account name</Label><Input id="vendor-account-name" value={form.accountName} onChange={(event) => update("accountName", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="vendor-account">Account number</Label><Input id="vendor-account" inputMode="numeric" value={form.accountNumber} onChange={(event) => update("accountNumber", event.target.value.replace(/\D/g, ""))} maxLength={20} /></div></> : null}
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="vendor-notes">Operations notes</Label><Textarea id="vendor-notes" value={form.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Useful collection or contact notes" className="min-h-24" /></div>
          <div className="flex items-start gap-2 rounded-lg bg-muted/40 p-3 text-xs leading-5 text-muted-foreground sm:col-span-2"><Save className="mt-0.5 size-4 shrink-0" />Bank account numbers are encrypted by the backend and only a masked suffix is returned to Runner and general Admin views.</div>
        </form>
      )}
    </AdminWorkflowSheet>
  );
}
