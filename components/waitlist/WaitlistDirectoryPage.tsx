"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Gift, Mail, Search, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryState } from "@/components/shared/QueryState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useAdminSession, useApiQuery } from "@/lib/query";
import { apiDelete, apiPost } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import type { Page } from "@/lib/admin-utils";

interface WaitlistEntry {
  id: string;
  publicId: string;
  email: string;
  name: string;
  redeemedByUserId?: string;
  pendingCreditMinor?: number;
  creditGrantedAt?: string;
  unsubscribedAt?: string;
  createdAt: string;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : fallback;
}

function entryStatus(entry: WaitlistEntry) {
  if (entry.unsubscribedAt) return "unsubscribed";
  if (entry.creditGrantedAt) return "credited";
  if (entry.redeemedByUserId) return "has account";
  if (entry.pendingCreditMinor) return "gift queued";
  return "pending";
}

export function WaitlistDirectoryPage() {
  const { data: session } = useAdminSession();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [messaging, setMessaging] = useState(false);
  const [gifting, setGifting] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const allowed = hasPermission(session, "waitlist.view");
  const canManage = hasPermission(session, "waitlist.manage");
  const query = useApiQuery<Page<WaitlistEntry> & { redeemed: number }>(
    ["admin", "waitlist", search],
    `/admin/waitlist${search ? `?search=${encodeURIComponent(search)}` : ""}`,
    Boolean(session && allowed),
  );

  const entries = useMemo(() => query.data?.data || [], [query.data?.data]);
  const total = query.data?.total || 0;
  const redeemed = query.data?.redeemed || 0;
  const targetIds = selected.size ? [...selected] : undefined;
  const targetCount = selected.size || total;

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(entries.map((entry) => entry.publicId)) : new Set());
  }

  async function remove(entry: WaitlistEntry) {
    try {
      await apiDelete(`/admin/waitlist/${entry.publicId}`);
      toast.success(`Removed ${entry.email}`);
      await query.refetch();
    } catch (error) {
      toast.error(errorMessage(error, "Could not remove this entry"));
    }
  }

  async function sendMessage() {
    if (subject.trim().length < 3 || message.trim().length < 3) return toast.error("Add a subject and message");
    setBusy(true);
    try {
      const result = await apiPost<{ sent: number; failed: number }>("/admin/waitlist/broadcast", {
        subject: subject.trim(),
        message: message.trim(),
        targetIds,
      });
      toast.success(`Sent to ${result.sent} recipient${result.sent === 1 ? "" : "s"}${result.failed ? `, ${result.failed} failed` : ""}`);
      setMessaging(false);
      setSubject("");
      setMessage("");
    } catch (error) {
      toast.error(errorMessage(error, "Could not send this message"));
    } finally {
      setBusy(false);
    }
  }

  async function giftCredit() {
    const amountMinor = Math.round(Number(amount) * 100);
    if (!amountMinor || amountMinor <= 0) return toast.error("Enter an amount greater than zero");
    if (reason.trim().length < 5) return toast.error("Add a short reason");
    setBusy(true);
    try {
      const result = await apiPost<{ grantedNow: number; pendingForSignup: number }>("/admin/waitlist/gift", {
        amountMinor,
        reason: reason.trim(),
        targetIds,
      });
      toast.success(`${result.grantedNow} credited now, ${result.pendingForSignup} queued for when they sign up`);
      setGifting(false);
      setAmount("");
      setReason("");
      await query.refetch();
    } catch (error) {
      toast.error(errorMessage(error, "Could not gift credit"));
    } finally {
      setBusy(false);
    }
  }

  if (session && !allowed) {
    return (
      <div className="mx-auto flex min-h-96 max-w-2xl items-center justify-center p-6 text-center">
        <div>
          <Users className="mx-auto size-10 text-muted-foreground" />
          <h1 className="mt-4 text-lg font-semibold">Waitlist access is restricted</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your current role does not include permission to view the waitlist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 px-4 py-5">
      <PageHeader
        title="Waitlist"
        description="Everyone who signed up before launch. Message them, or gift Hook credit that lands automatically when they create an account."
        actions={
          <PermissionGuard permission="waitlist.manage">
            <Button variant="outline" size="sm" onClick={() => setMessaging(true)}><Mail /> Message {selected.size ? `${selected.size} selected` : "everyone"}</Button>
            <Button variant="brand" size="sm" onClick={() => setGifting(true)}><Gift /> Gift credit</Button>
          </PermissionGuard>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Card className="rounded-xl shadow-none"><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><span className="grid size-9 place-items-center rounded-lg bg-[#fff8dc] text-[#8a6900]"><Users className="size-4" /></span><span className="text-2xl font-semibold tabular-nums text-foreground">{total}</span></div><p className="mt-3 text-xs font-semibold text-foreground">On the waitlist</p></CardContent></Card>
        <Card className="rounded-xl shadow-none"><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><span className="grid size-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><CheckCircle2 className="size-4" /></span><span className="text-2xl font-semibold tabular-nums text-foreground">{redeemed}</span></div><p className="mt-3 text-xs font-semibold text-foreground">Already have an account</p></CardContent></Card>
        <Card className="rounded-xl shadow-none"><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><span className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-700"><Gift className="size-4" /></span><span className="text-2xl font-semibold tabular-nums text-foreground">{total - redeemed}</span></div><p className="mt-3 text-xs font-semibold text-foreground">Not signed up yet</p></CardContent></Card>
      </div>

      <Card className="rounded-xl shadow-none">
        <CardContent className="p-3">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search email or name" className="h-9 pl-9" />
          </div>
        </CardContent>
      </Card>

      <QueryState
        loading={query.isLoading}
        error={query.error}
        loadingLabel="Loading waitlist"
        errorTitle="Waitlist unavailable"
        empty={!query.isLoading && !query.isError && !entries.length}
        emptyIcon={Users}
        emptyTitle="No one on the waitlist yet"
        emptyDescription="Share your public waitlist page to start collecting signups."
        onRetry={() => query.refetch()}
      >
        <Card className="overflow-hidden rounded-xl shadow-none">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-zinc-50 text-left text-xs text-muted-foreground">
                  <th className="w-10 px-3 py-2.5"><Checkbox checked={entries.length > 0 && entries.every((entry) => selected.has(entry.publicId))} onCheckedChange={(value) => toggleAll(Boolean(value))} /></th>
                  <th className="px-3 py-2.5 font-medium">Email</th>
                  <th className="px-3 py-2.5 font-medium">Name</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Joined</th>
                  <th className="w-10 px-2 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {entries.map((entry) => (
                  <tr key={entry.publicId} className={selected.has(entry.publicId) ? "bg-amber-50/60" : ""}>
                    <td className="px-3 py-2"><Checkbox checked={selected.has(entry.publicId)} onCheckedChange={() => toggle(entry.publicId)} /></td>
                    <td className="px-3 py-2 font-medium text-foreground">{entry.email}</td>
                    <td className="px-3 py-2 text-muted-foreground">{entry.name}</td>
                    <td className="px-3 py-2"><StatusBadge status={entryStatus(entry)} /></td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td className="px-2 py-2">
                      {canManage ? <Button variant="ghost" size="icon-sm" aria-label={`Remove ${entry.email}`} onClick={() => void remove(entry)}><Trash2 className="size-4 text-destructive" /></Button> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </QueryState>

      <Dialog open={messaging} onOpenChange={(open) => { if (!busy) setMessaging(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message {targetCount} {targetCount === 1 ? "person" : "people"}</DialogTitle>
            <DialogDescription>Sent as an email to every {selected.size ? "selected" : ""} waitlist entry. Anyone who unsubscribed is skipped automatically, even if selected.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label htmlFor="wl-subject">Subject</Label><Input id="wl-subject" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="We're launching soon!" /></div>
            <div className="space-y-2"><Label htmlFor="wl-message">Message</Label><Textarea id="wl-message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write your announcement..." className="min-h-32" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setMessaging(false)}>Cancel</Button>
            <Button variant="brand" disabled={busy} onClick={() => void sendMessage()}>{busy ? "Sending..." : "Send"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={gifting} onOpenChange={(open) => { if (!busy) setGifting(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gift Hook credit to {targetCount} {targetCount === 1 ? "person" : "people"}</DialogTitle>
            <DialogDescription>Anyone who already has an account is credited immediately. Anyone who hasn&apos;t signed up yet gets it automatically the moment they do.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="wl-amount">Amount (₦)</Label><Input id="wl-amount" type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="500" /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="wl-reason">Reason</Label><Input id="wl-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Launch week welcome credit" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setGifting(false)}>Cancel</Button>
            <Button variant="brand" disabled={busy} onClick={() => void giftCredit()}>{busy ? "Gifting..." : "Gift credit"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
