"use client";

import { useState } from "react";
import { Archive, Ban, KeyRound, Mail, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HookLoader } from "@/components/shared/HookLoader";
import { Input } from "@/components/ui/input";
import { apiPost, apiRequest } from "@/lib/api";
import type { Partner, PartnerAction } from "./partner-types";

const ACTION_META: Partial<Record<PartnerAction, { title: string; description: string; confirm: string; destructive?: boolean; icon: typeof Ban }>> = {
  suspend: { title: "Suspend this Hook Partner location?", description: "Access will be blocked immediately and active sessions will be revoked.", confirm: "Suspend location", destructive: true, icon: Ban },
  reactivate: { title: "Reactivate this Hook Partner location?", description: "The account will be allowed to sign in again and resume assisted checkouts.", confirm: "Reactivate location", icon: RotateCcw },
  archive: { title: "Archive this Hook Partner?", description: "Sign-in stops and sessions end. It is refused while a customer's order is still in custody at this location. You can restore it later.", confirm: "Archive location", destructive: true, icon: Archive },
  restore: { title: "Restore this Hook Partner?", description: "They can sign in again immediately.", confirm: "Restore location", icon: RotateCcw },
  "revoke-sessions": { title: "Revoke all sessions?", description: "Every active device will need to sign in again.", confirm: "Revoke sessions", icon: KeyRound },
  delete: { title: "Delete this location permanently?", description: "The account is removed for good and cannot be recovered. Only archived locations with no order or custody history can be deleted.", confirm: "Delete permanently", destructive: true, icon: Trash2 },
  "cancel-invitation": { title: "Cancel Hook Partner invitation?", description: "The activation link stops working and the account is removed, so the email can be invited again.", confirm: "Cancel invitation", destructive: true, icon: Mail },
};

function cleanError(error: unknown) {
  return error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Unable to complete this Hook Partner action";
}

export function PartnerActionDialog({ partner, action, open, onClose, onSuccess }: { partner: Partner | null; action: PartnerAction | null; open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [typed, setTyped] = useState("");
  const expected = `DELETE ${partner?.publicId || partner?.id || ""}`;
  const meta = action ? ACTION_META[action] : null;
  const Icon = meta?.icon || Ban;

  async function submit() {
    if (!partner || !action || reason.trim().length < 3) return;
    setSaving(true);
    try {
      if (action === "delete") await apiRequest(`/admin/partners/${partner.publicId || partner.id}`, { method: "DELETE", body: JSON.stringify({ reason: reason.trim(), confirmation: typed.trim() }) });
      else await apiPost(`/admin/partners/${partner.publicId || partner.id}/${action}`, { reason: reason.trim() });
      toast.success(meta?.confirm || "Hook Partner action completed");
      setReason("");
      setTyped("");
      onClose();
      await onSuccess();
    } catch (error) {
      toast.error(cleanError(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !saving) { setReason(""); setTyped(""); onClose(); } }}>
      <DialogContent>
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Icon className={meta?.destructive ? "text-destructive" : "text-brand-gold"} /> {meta?.title}</DialogTitle><DialogDescription>{meta?.description} {partner ? `Target: ${partner.name || partner.email || "Hook Partner location"}` : ""}</DialogDescription></DialogHeader>
        <div className="space-y-1.5"><Label htmlFor="partner-action-reason">Audit reason</Label><Textarea id="partner-action-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Add a clear operational reason" maxLength={500} /></div>
        {action === "delete" ? <div className="space-y-1.5"><Label htmlFor="partner-delete-confirm">Type <span className="font-mono font-semibold">{expected}</span> to confirm</Label><Input id="partner-delete-confirm" value={typed} onChange={(event) => setTyped(event.target.value)} autoComplete="off" /></div> : null}
        <DialogFooter><Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button><Button variant={meta?.destructive ? "destructive" : "brand"} onClick={() => void submit()} disabled={saving || reason.trim().length < 3 || (action === "delete" && typed.trim() !== expected)}>{saving ? <HookLoader size="button" /> : meta?.confirm}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
