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
import type { MarketAssociateAction, MarketAssociateMember } from "./market-associate-types";

const ACTION_META: Partial<Record<MarketAssociateAction, { title: string; description: string; confirm: string; destructive?: boolean; icon: typeof Ban }>> = {
  suspend: { title: "Suspend Market Associate account?", description: "Access will be blocked immediately and active sessions will be revoked.", confirm: "Suspend account", destructive: true, icon: Ban },
  reactivate: { title: "Reactivate Market Associate account?", description: "The account will be allowed to sign in again within its assigned Markets and states.", confirm: "Reactivate account", icon: RotateCcw },
  archive: { title: "Archive this Market Associate?", description: "Sign-in stops, sessions end, and their Market assignments are closed. It is refused while orders are still in progress with them. You can restore the account later.", confirm: "Archive account", destructive: true, icon: Archive },
  restore: { title: "Restore this Market Associate?", description: "They can sign in again. Their old Market assignments stay closed, so assign Markets again.", confirm: "Restore account", icon: RotateCcw },
  "revoke-sessions": { title: "Revoke all sessions?", description: "Every active device will need to sign in again.", confirm: "Revoke sessions", icon: KeyRound },
  delete: { title: "Delete this account permanently?", description: "The account is removed for good and cannot be recovered. Only archived accounts with no order or product history can be deleted.", confirm: "Delete permanently", destructive: true, icon: Trash2 },
  "cancel-invitation": { title: "Cancel Market Associate invitation?", description: "The activation link will stop working and the invited account will be disabled.", confirm: "Cancel invitation", destructive: true, icon: Mail },
};

function cleanError(error: unknown) {
  return error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Unable to complete Market Associate action";
}

export function MarketAssociateActionDialog({ member, action, open, onClose, onSuccess }: { member: MarketAssociateMember | null; action: MarketAssociateAction | null; open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [typed, setTyped] = useState("");
  const expected = `DELETE ${member?.publicId || member?.id || ""}`;
  const meta = action ? ACTION_META[action] : null;
  const Icon = meta?.icon || Ban;

  async function submit() {
    if (!member || !action || reason.trim().length < 3) return;
    setSaving(true);
    try {
      if (action === "delete") await apiRequest(`/admin/market-associates/${member.publicId || member.id}`, { method: "DELETE", body: JSON.stringify({ reason: reason.trim(), confirmation: typed.trim() }) });
      else await apiPost(`/admin/market-associates/${member.publicId || member.id}/${action}`, { reason: reason.trim() });
      toast.success(meta?.confirm || "Market Associate action completed");
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
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Icon className={meta?.destructive ? "text-destructive" : "text-brand-gold"} /> {meta?.title}</DialogTitle><DialogDescription>{meta?.description} {member ? `Target: ${member.firstName || ""} ${member.lastName || member.email || "Market Associate account"}`.trim() : ""}</DialogDescription></DialogHeader>
        <div className="space-y-1.5"><Label htmlFor="ma-action-reason">Audit reason</Label><Textarea id="ma-action-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Add a clear operational reason" maxLength={500} /></div>
        {action === "delete" ? <div className="space-y-1.5"><Label htmlFor="ma-delete-confirm">Type <span className="font-mono font-semibold">{expected}</span> to confirm</Label><Input id="ma-delete-confirm" value={typed} onChange={(event) => setTyped(event.target.value)} autoComplete="off" /></div> : null}
        <DialogFooter><Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button><Button variant={meta?.destructive ? "destructive" : "brand"} onClick={() => void submit()} disabled={saving || reason.trim().length < 3 || (action === "delete" && typed.trim() !== expected)}>{saving ? <HookLoader size="button" /> : meta?.confirm}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
