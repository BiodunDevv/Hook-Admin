"use client";

import { Archive, Ban, KeyRound, Mail, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HookLoader } from "@/components/shared/HookLoader";
import { apiPost } from "@/lib/api";
import type { StaffAction, StaffMember } from "./staff-types";
import { useState } from "react";

const ACTION_META: Record<StaffAction, { title: string; description: string; confirm: string; destructive?: boolean; icon: typeof Ban }> = {
  suspend: { title: "Suspend staff account?", description: "The account will lose access immediately. Existing sessions will be revoked.", confirm: "Suspend account", destructive: true, icon: Ban },
  reactivate: { title: "Reactivate staff account?", description: "The account will be allowed to sign in again within its assigned scope.", confirm: "Reactivate account", icon: RotateCcw },
  archive: { title: "Archive staff account?", description: "The account will be disabled and retained for audit history. This cannot be used to remove a Super Admin.", confirm: "Archive account", destructive: true, icon: Archive },
  "revoke-sessions": { title: "Revoke all sessions?", description: "Every active device for this staff member will need to authenticate again.", confirm: "Revoke sessions", icon: KeyRound },
  "cancel-invitation": { title: "Cancel staff invitation?", description: "The invitation will stop working and the account will remain in the audit history.", confirm: "Cancel invitation", destructive: true, icon: Mail },
};

function cleanError(error: unknown) {
  return error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Unable to complete staff action";
}

export function StaffActionDialog({ member, action, open, onClose, onSuccess }: { member: StaffMember | null; action: StaffAction | null; open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const meta = action ? ACTION_META[action] : null;
  const Icon = meta?.icon || Ban;

  async function submit() {
    if (!member || !action || reason.trim().length < 3) return;
    setSaving(true);
    try {
      await apiPost(`/admin/staff/${member.publicId || member.id}/${action}`, { reason: reason.trim() });
      toast.success(meta?.confirm || "Staff action completed");
      setReason("");
      onClose();
      await onSuccess();
    } catch (error) {
      toast.error(cleanError(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !saving) { setReason(""); onClose(); } }}>
      <DialogContent>
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Icon className={meta?.destructive ? "text-destructive" : "text-brand-gold"} /> {meta?.title}</DialogTitle><DialogDescription>{meta?.description} {member ? `Target: ${member.firstName || ""} ${member.lastName || member.email || "staff account"}`.trim() : ""}</DialogDescription></DialogHeader>
        <div className="space-y-1.5"><Label htmlFor="staff-action-reason">Audit reason</Label><Textarea id="staff-action-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Add a clear operational reason" maxLength={500} /></div>
        <DialogFooter><Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button><Button variant={meta?.destructive ? "destructive" : "brand"} onClick={() => void submit()} disabled={saving || reason.trim().length < 3}>{saving ? <HookLoader size="button" /> : meta?.confirm}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
