"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Ban, KeyRound, Mail, RotateCcw, ShieldX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HookLoader } from "@/components/shared/HookLoader";
import { useApiQuery } from "@/lib/query";
import { apiPost } from "@/lib/api";
import { useState } from "react";

type AccountResource = "staff" | "runners" | "partners";
type LifecycleResource = "states" | "cities" | "zones" | "markets" | "hubs";
type LifecycleAction = {
  suffix: string;
  label: string;
  title: string;
  description: string;
  destructive?: boolean;
};

export function PlatformDetailPage({
  title,
  endpoint,
  invitationAction = false,
  accountResource,
  lifecycleResource,
}: {
  title: string;
  endpoint: string;
  invitationAction?: boolean;
  accountResource?: AccountResource;
  lifecycleResource?: LifecycleResource;
}) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [action, setAction] = useState<LifecycleAction | null>(null);
  const [reason, setReason] = useState("");
  const [acting, setActing] = useState(false);
  const query = useApiQuery<Record<string, unknown>>(["platform-detail", endpoint, params.id], `${endpoint}/${params.id}`);
  const status = String(query.data?.status || "");
  async function resendInvitation() {
    setSending(true);
    try {
      await apiPost(`${endpoint}/${params.id}/resend-invitation`, {});
      toast.success("A new activation link has been sent");
      query.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Unable to resend invitation");
    } finally {
      setSending(false);
    }
  }
  async function runAction() {
    if (!action || reason.trim().length < 3) return;
    setActing(true);
    try {
      await apiPost(`${endpoint}/${params.id}/${action.suffix}`, { reason: reason.trim() });
      toast.success(`${action.label} completed`);
      setAction(null);
      setReason("");
      query.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Unable to complete action");
    } finally {
      setActing(false);
    }
  }

  const accountActions: LifecycleAction[] = accountResource
    ? status === "invited"
      ? [{
          suffix: "cancel-invitation",
          label: "Cancel invitation",
          title: "Cancel this invitation?",
          description: "The activation link will stop working and this account will be disabled.",
          destructive: true,
        }]
      : status === "active"
        ? [
            {
              suffix: "suspend",
              label: "Suspend account",
              title: "Suspend this account?",
              description: "Access will be blocked and all active sessions will be revoked.",
              destructive: true,
            },
            ...(accountResource === "staff" ? [{
              suffix: "revoke-sessions",
              label: "Revoke sessions",
              title: "Revoke all active sessions?",
              description: "The staff member must sign in again on every device.",
            }] : []),
          ]
        : status === "suspended"
          ? [{
              suffix: "reactivate",
              label: "Reactivate account",
              title: "Reactivate this account?",
              description: "The account will regain access within its assigned scope.",
            }]
          : []
    : [];
  const lifecycleActions: LifecycleAction[] = lifecycleResource
    ? status === "active"
      ? [{
          suffix: "deactivate",
          label: "Deactivate",
          title: `Deactivate this ${title.toLowerCase()}?`,
          description: "The record will stop being available for new operational assignments.",
          destructive: true,
        }]
      : status === "inactive"
        ? [{
            suffix: "activate",
            label: "Activate",
            title: `Activate this ${title.toLowerCase()}?`,
            description: "The record will become available within its configured operational scope.",
          }]
        : []
    : [];
  const actions = [...accountActions, ...lifecycleActions];

  return (
    <div className="p-2 md:p-4">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => router.back()}><ArrowLeft /> Back</Button>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {invitationAction && status === "invited" ? (
            <Button variant="outline" disabled={sending} onClick={resendInvitation}>
              {sending ? <HookLoader size="button" /> : <><Mail /> Resend invitation</>}
            </Button>
          ) : null}
          {actions.map((item) => (
            <Button
              key={item.suffix}
              variant={item.destructive ? "destructive" : "outline"}
              onClick={() => setAction(item)}
            >
              {["suspend", "deactivate"].includes(item.suffix) ? <Ban /> : item.suffix === "cancel-invitation" ? <ShieldX /> : item.suffix === "revoke-sessions" ? <KeyRound /> : <RotateCcw />}
              {item.label}
            </Button>
          ))}
        </div>
      </div>
      <Card className="mt-3 rounded-lg shadow-none">
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent>
          {query.isLoading ? <div className="flex min-h-52 items-center justify-center"><HookLoader /></div> : query.isError ? (
            <p className="text-sm text-destructive">The record could not be loaded.</p>
          ) : (
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {Object.entries(query.data || {}).filter(([, value]) => value === null || ["string", "number", "boolean"].includes(typeof value)).map(([key, value]) => (
                <div key={key} className="border-b pb-3"><dt className="text-xs font-medium uppercase text-muted-foreground">{key.replace(/([A-Z])/g, " $1")}</dt><dd className="mt-1 text-sm">{String(value ?? "—")}</dd></div>
              ))}
            </dl>
          )}
        </CardContent>
      </Card>
      <Dialog open={Boolean(action)} onOpenChange={(open) => {
        if (!open && !acting) {
          setAction(null);
          setReason("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action?.title}</DialogTitle>
            <DialogDescription>{action?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="lifecycle-reason">Reason</Label>
            <Textarea
              id="lifecycle-reason"
              value={reason}
              maxLength={500}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Add a clear operational reason for the audit record"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={acting} onClick={() => setAction(null)}>Cancel</Button>
            <Button
              type="button"
              variant={action?.destructive ? "destructive" : "default"}
              disabled={acting || reason.trim().length < 3}
              onClick={runAction}
            >
              {acting ? <HookLoader size="button" /> : action?.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
