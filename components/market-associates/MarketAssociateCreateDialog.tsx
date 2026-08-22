"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminWorkflowSheet } from "@/components/shared/AdminWorkflowSheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HookLoader } from "@/components/shared/HookLoader";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { RelatedMultiSelect, type DirectoryField } from "@/components/platform/PlatformDirectoryPage";
import { apiPost } from "@/lib/api";

const stateField: DirectoryField = { key: "stateIds", label: "Operation states", type: "multi-select", optionsEndpoint: "/admin/states" };

export function MarketAssociateCreateDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => Promise<unknown> | unknown }) {
  const [stateIds, setStateIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function reset() {
    setStateIds([]);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!stateIds.length) return toast.error("Select at least one operation state");
    setSaving(true);
    try {
      await apiPost("/admin/market-associates", {
        firstName: String(form.get("firstName") || "").trim(),
        lastName: String(form.get("lastName") || "").trim(),
        email: String(form.get("email") || "").trim().toLowerCase(),
        phone: String(form.get("phone") || "").trim(),
        stateIds,
      });
      toast.success("Market Associate invitation created");
      reset();
      onClose();
      await onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Unable to create Market Associate invitation");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PermissionGuard permission="runners.manage">
      <AdminWorkflowSheet
        open={open}
        onOpenChange={(next) => { if (!next && !saving) { reset(); onClose(); } }}
        title="Add Market Associate"
        description="Create an invitation and assign the operation states this Market Associate will source from."
        footer={<><Button type="button" variant="outline" onClick={() => { reset(); onClose(); }} disabled={saving}>Cancel</Button><Button type="submit" form="market-associate-create-form" variant="brand" disabled={saving || !stateIds.length}>{saving ? <HookLoader size="button" /> : "Create invitation"}</Button></>}
      >
        <form id="market-associate-create-form" onSubmit={submit} className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="ma-first-name">First name</Label><Input id="ma-first-name" name="firstName" placeholder="Chidi" required /></div>
            <div className="space-y-1.5"><Label htmlFor="ma-last-name">Last name</Label><Input id="ma-last-name" name="lastName" placeholder="Eze" required /></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="ma-email">Email</Label><Input id="ma-email" name="email" type="email" placeholder="name@hook.africa" required /></div>
            <div className="space-y-1.5"><Label htmlFor="ma-phone">Phone number</Label><Input id="ma-phone" name="phone" type="tel" placeholder="+234 801 234 5678" required /></div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stateIds">Operation states</Label>
            <RelatedMultiSelect field={stateField} value={stateIds} values={{}} onChange={setStateIds} />
            <p className="text-xs text-muted-foreground">Markets and Dispatch Hub assignments are managed from the Market Associate&apos;s profile after activation.</p>
          </div>
        </form>
      </AdminWorkflowSheet>
    </PermissionGuard>
  );
}
