"use client";

import { useState } from "react";
import { Check, Copy, Landmark, Mail, Phone, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { HookLoader } from "@/components/shared/HookLoader";
import { MobileButton } from "@/components/mobile/MobileUI";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiPatch, apiPost } from "@/lib/api";

type InviteResponse = {
  vendor: { publicId: string; businessName: string };
  invitation: { inviteUrl: string; expiresAt: string; delivery?: { delivered: boolean; provider: string } };
};

export type VendorFormValue = {
  publicId?: string;
  businessName?: string;
  contactName?: string;
  phone?: string;
  email?: string | null;
  address?: string | null;
  preferredContactChannel?: string;
  notes?: string | null;
  paymentProfile?: { method?: string; bankName?: string | null; accountName?: string | null };
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

function fromVendor(vendor?: VendorFormValue) {
  if (!vendor) return initialForm;
  return {
    ...initialForm,
    businessName: vendor.businessName || "",
    contactName: vendor.contactName || "",
    phone: vendor.phone || "",
    email: vendor.email || "",
    address: vendor.address || "",
    preferredContactChannel: vendor.preferredContactChannel || "phone",
    paymentMethod: vendor.paymentProfile?.method || "cash",
    bankName: vendor.paymentProfile?.bankName || "",
    accountName: vendor.paymentProfile?.accountName || "",
    notes: vendor.notes || "",
  };
}

/** Client-side mirror of marketVendorSchema so errors surface inline, not as a toast. */
function validate(form: typeof initialForm) {
  const errors: Partial<Record<keyof typeof initialForm, string>> = {};
  if (form.businessName.trim().length < 2) errors.businessName = "Enter at least 2 characters";
  if (form.contactName.trim().length < 2) errors.contactName = "Enter at least 2 characters";
  const phone = form.phone.trim();
  if (phone.length < 7 || phone.length > 30) errors.phone = "Enter a valid phone number";
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    errors.email = "Enter a valid email address";
  if (form.paymentMethod === "bank_transfer" && form.accountNumber.trim() && !/^\d{6,20}$/.test(form.accountNumber.trim()))
    errors.accountNumber = "Account number must be 6-20 digits";
  return errors;
}

export function MarketVendorSheet({
  marketId,
  marketName,
  vendor,
  open,
  onClose,
  onSuccess,
}: {
  marketId: string;
  marketName: string;
  /** When provided the sheet edits this vendor instead of creating one. */
  vendor?: VendorFormValue;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const editing = Boolean(vendor?.publicId);
  const [form, setForm] = useState(() => fromVendor(vendor));
  const [errors, setErrors] = useState<Partial<Record<keyof typeof initialForm, string>>>({});
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<InviteResponse | null>(null);

  function update(key: keyof typeof form, value: string) {
    setForm((current) => {
      // Drop bank details when the method no longer uses them.
      if (key === "paymentMethod" && value !== "bank_transfer") {
        return { ...current, paymentMethod: value, bankName: "", bankCode: "", accountName: "", accountNumber: "" };
      }
      return { ...current, [key]: value };
    });
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function paymentProfile() {
    if (form.paymentMethod !== "bank_transfer") return { method: form.paymentMethod };
    return {
      method: form.paymentMethod,
      bankName: form.bankName.trim() || undefined,
      bankCode: form.bankCode.trim() || undefined,
      accountName: form.accountName.trim() || undefined,
      accountNumber: form.accountNumber.trim() || undefined,
    };
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setSaving(true);
    try {
      const body = {
        businessName: form.businessName.trim(),
        contactName: form.contactName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        preferredContactChannel: form.preferredContactChannel,
        paymentProfile: paymentProfile(),
        notes: form.notes.trim() || undefined,
      };
      if (editing) {
        await apiPatch(`/market-associate/market-vendors/${vendor!.publicId}`, {
          ...body,
          reason: "Market Associate updated supplier details",
        });
        toast.success("Supplier updated");
        onSuccess();
        onClose();
      } else {
        const response = await apiPost<InviteResponse>(`/market-associate/markets/${marketId}/vendors`, body);
        setResult(response);
        toast.success("Supplier added");
        onSuccess();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Supplier could not be saved",
      );
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    if (!result?.invitation.inviteUrl) return;
    try {
      await navigator.clipboard.writeText(result.invitation.inviteUrl);
      toast.success("Invitation link copied");
    } catch {
      toast.error("Copy failed — select and copy the link manually");
    }
  }

  return (
    <Sheet open={open} onOpenChange={(next) => { if (!next && !saving) onClose(); }}>
      <SheetContent
        side="bottom"
        className="mx-auto flex max-h-[92dvh] w-full max-w-2xl flex-col rounded-t-2xl border-x bg-[#F5F5F5] p-0"
      >
        <SheetHeader className="shrink-0 px-5 pb-3 pt-5">
          <SheetTitle className="text-[19px] font-bold">
            {result ? "Supplier invitation ready" : editing ? "Edit supplier" : "Onboard a supplier"}
          </SheetTitle>
          <SheetDescription className="text-[13px] leading-5 text-[#8F8F8F]">
            {result
              ? "Share the one-time link. It expires after seven days."
              : `Supplier records belong to ${marketName} only and do not create a login.`}
          </SheetDescription>
        </SheetHeader>

        {result ? (
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <div className="rounded-[10px] bg-white p-5 text-center">
              <span className="mx-auto mb-3 grid size-14 place-items-center rounded-full bg-emerald-50">
                <Check className="size-7 text-emerald-600" />
              </span>
              <p className="text-[17px] font-bold">{result.vendor.businessName} is tracked</p>
              <p className="mt-1.5 text-[13px] leading-5 text-[#8F8F8F]">
                They can consent to the profile through the secure link below.
              </p>
            </div>
            <div className="rounded-[10px] bg-white p-4">
              <Label className="text-[13px] font-semibold">One-time invitation link</Label>
              <div className="mt-2 flex gap-2">
                <Input readOnly value={result.invitation.inviteUrl} className="h-12 rounded-[10px] text-xs" />
                <button
                  type="button"
                  onClick={() => void copyLink()}
                  aria-label="Copy invitation link"
                  className="grid size-12 shrink-0 place-items-center rounded-[10px] bg-[#FFC809]"
                >
                  <Copy size={18} />
                </button>
              </div>
              <p className="mt-2 text-[12px] text-[#8F8F8F]">
                Expires {new Date(result.invitation.expiresAt).toLocaleString("en-NG")}.{" "}
                {result.invitation.delivery?.delivered ? "Email sent." : "Share this link directly."}
              </p>
            </div>
            <MobileButton onClick={onClose}>Done</MobileButton>
          </div>
        ) : (
          <form id="vendor-form" onSubmit={save} className="flex-1 overflow-y-auto p-5">
            <FormGroup icon={UserPlus} title="Supplier identity">
              <FormField label="Business name" error={errors.businessName} required>
                <Input
                  value={form.businessName}
                  onChange={(event) => update("businessName", event.target.value)}
                  placeholder="Business or stall name"
                  className="h-12 rounded-[10px]"
                />
              </FormField>
              <FormField label="Contact name" error={errors.contactName} required>
                <Input
                  value={form.contactName}
                  onChange={(event) => update("contactName", event.target.value)}
                  placeholder="Primary contact"
                  className="h-12 rounded-[10px]"
                />
              </FormField>
              <FormField label="Phone number" error={errors.phone} required>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => update("phone", event.target.value)}
                  placeholder="080..."
                  className="h-12 rounded-[10px]"
                />
              </FormField>
              <FormField label="Email" error={errors.email} hint="Optional — used to email the invite">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(event) => update("email", event.target.value)}
                  placeholder="supplier@example.com"
                  className="h-12 rounded-[10px]"
                />
              </FormField>
              <FormField label="Stall / address" full>
                <Textarea
                  value={form.address}
                  onChange={(event) => update("address", event.target.value)}
                  placeholder="Where to find the supplier"
                  className="min-h-20 rounded-[10px]"
                />
              </FormField>
              <FormField label="Preferred contact">
                <Select
                  value={form.preferredContactChannel}
                  onValueChange={(value) => update("preferredContactChannel", value)}
                >
                  <SelectTrigger className="h-12 rounded-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">
                      <span className="flex items-center gap-2"><Phone className="size-4" /> Phone</span>
                    </SelectItem>
                    <SelectItem value="email">
                      <span className="flex items-center gap-2"><Mail className="size-4" /> Email</span>
                    </SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </FormGroup>

            <FormGroup icon={Landmark} title="Procurement payment">
              <FormField label="Payment method">
                <Select value={form.paymentMethod} onValueChange={(value) => update("paymentMethod", value)}>
                  <SelectTrigger className="h-12 rounded-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              {form.paymentMethod === "bank_transfer" && (
                <>
                  <FormField label="Bank name">
                    <Input value={form.bankName} onChange={(event) => update("bankName", event.target.value)} className="h-12 rounded-[10px]" />
                  </FormField>
                  <FormField label="Bank code">
                    <Input value={form.bankCode} onChange={(event) => update("bankCode", event.target.value)} className="h-12 rounded-[10px]" />
                  </FormField>
                  <FormField label="Account name">
                    <Input value={form.accountName} onChange={(event) => update("accountName", event.target.value)} className="h-12 rounded-[10px]" />
                  </FormField>
                  <FormField label="Account number" error={errors.accountNumber} hint={editing ? "Leave blank to keep the saved number" : undefined}>
                    <Input
                      inputMode="numeric"
                      value={form.accountNumber}
                      onChange={(event) => update("accountNumber", event.target.value.replace(/\D/g, ""))}
                      maxLength={20}
                      className="h-12 rounded-[10px]"
                    />
                  </FormField>
                </>
              )}
              <div className="flex items-start gap-2 rounded-[10px] bg-[#F5F5F5] p-3 text-[12px] leading-5 text-[#8F8F8F] sm:col-span-2">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                Account numbers are encrypted. Only the last 4 digits are ever shown back.
              </div>
            </FormGroup>

            <FormGroup title="Notes">
              <FormField label="Operations notes" full>
                <Textarea
                  value={form.notes}
                  onChange={(event) => update("notes", event.target.value)}
                  placeholder="Useful collection or contact notes"
                  className="min-h-24 rounded-[10px]"
                />
              </FormField>
            </FormGroup>
          </form>
        )}

        {!result && (
          <div className="shrink-0 border-t border-black/5 bg-[#F5F5F5] px-5 py-4">
            <MobileButton type="submit" disabled={saving} onClick={() => {
              const formEl = document.getElementById("vendor-form") as HTMLFormElement | null;
              formEl?.requestSubmit();
            }}>
              {saving ? <HookLoader size="button" /> : editing ? "Save changes" : "Add supplier"}
            </MobileButton>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function FormGroup({
  icon: Icon,
  title,
  children,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <p className="mb-3 flex items-center gap-2 px-1 text-[15px] font-semibold text-black">
        {Icon && <Icon className="size-4 text-[#9a7400]" />}
        {title}
      </p>
      {/* Two columns once there is room; single column on phones. */}
      <div className="grid gap-4 rounded-[10px] bg-white p-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function FormField({
  label,
  error,
  hint,
  required,
  full,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  /** Span both columns on wider screens. */
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label className="text-[13px] font-semibold">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-[12px] font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-[#8F8F8F]">{hint}</p>
      ) : null}
    </div>
  );
}
