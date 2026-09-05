"use client";

import { useState } from "react";
import { Ban, Mail, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HookLoader } from "@/components/shared/HookLoader";
import { apiPost } from "@/lib/api";
import type { MarketAssociateAction, MarketAssociateMember } from "./market-associate-types";

const ACTION_META: Partial<Record<MarketAssociateAction, { title: string; description: string; confirm: string; destructive?: boolean; icon: typeof Ban }>> = {
  suspend: { title: "Suspend Market Associate account?", description: "Access will be blocked immediately and active sessions will be revoked.", confirm: "Suspend account", destructive: true, icon: Ban },
  reactivate: { title: "Reactivate Market Associate account?", description: "The account will be allowed to sign in again within its assigned Markets and states.", confirm: "Reactivate account", icon: RotateCcw },
  "cancel-invitation": { title: "Cancel Market Associate invitation?", description: "The activation link will stop working and the invited account will be disabled.", confirm: "Cancel invitation", destructive: true, icon: Mail },
};

function cleanError(error: unknown) {
  return error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Unable to complete Market Associate action";
}

export function MarketAssociateActionDialog({ member, action, open, onClose, onSuccess }: { member: MarketAssociateMember | null; action: MarketAssociateAction | null; open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const meta = action ? ACTION_META[action] : null;
  const Icon = meta?.icon || Ban;

  async function submit() {
    if (!member || !action || reason.trim().length < 3) return;
    setSaving(true);
    try {
      await apiPost(`/admin/market-associates/${member.publicId || member.id}/${action}`, { reason: reason.trim() });
      toast.success(meta?.confirm || "Market Associate action completed");
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
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Icon className={meta?.destructive ? "text-destructive" : "text-brand-gold"} /> {meta?.title}</DialogTitle><DialogDescription>{meta?.description} {member ? `Target: ${member.firstName || ""} ${member.lastName || member.email || "Market Associate account"}`.trim() : ""}</DialogDescription></DialogHeader>
        <div className="space-y-1.5"><Label htmlFor="ma-action-reason">Audit reason</Label><Textarea id="ma-action-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Add a clear operational reason" maxLength={500} /></div>
        <DialogFooter><Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button><Button variant={meta?.destructive ? "destructive" : "brand"} onClick={() => void submit()} disabled={saving || reason.trim().length < 3}>{saving ? <HookLoader size="button" /> : meta?.confirm}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
