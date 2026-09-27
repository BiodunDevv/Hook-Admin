"use client";

import { useMemo, useState } from "react";
import { Check, MapPin, Megaphone, Send, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryState } from "@/components/shared/QueryState";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { UserPicker, type PickedUser } from "@/components/shared/UserPicker";
import { useAdminSession, useApiQuery } from "@/lib/query";
import { apiDelete, apiPost } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import type { Page } from "@/lib/admin-utils";

type AudienceMode = "customers" | "market_associates" | "staff" | "specific";
type Channel = "push" | "email" | "inbox";

type StateOption = { id?: string; publicId?: string; name?: string };
type StateResponse = StateOption[] | { data?: StateOption[] };

type RoleOption = { id?: string; _id?: string; key: string; name?: string };
type RoleResponse = RoleOption[] | { data?: RoleOption[] };

interface RecipientSample {
  name: string;
  email: string;
}

interface BroadcastRecord {
  publicId: string;
  title: string;
  body: string;
  channels: Channel[];
  recipientCount: number;
  sentAt: string;
}

const CHANNEL_OPTIONS: { value: Channel; label: string }[] = [
  { value: "push", label: "Push notification" },
  { value: "email", label: "Email" },
  { value: "inbox", label: "In-app inbox" },
];

const AUDIENCE_OPTIONS: { value: AudienceMode; label: string; description: string }[] = [
  { value: "customers", label: "All customers", description: "Every account with a customer profile" },
  { value: "market_associates", label: "Market associates", description: "Optionally narrowed to specific states" },
  { value: "staff", label: "Staff", description: "Optionally narrowed to a specific platform role" },
  { value: "specific", label: "Specific people", description: "Hand-pick individual accounts" },
];

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : fallback;
}

export function ComposeBroadcastPage() {
  const { data: session } = useAdminSession();
  const allowed = hasPermission(session, "communications.send");

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [channels, setChannels] = useState<Channel[]>(["push", "inbox"]);
  const [mode, setMode] = useState<AudienceMode>("customers");
  const [stateIds, setStateIds] = useState<string[]>([]);
  const [roleKey, setRoleKey] = useState<string>("");
  const [people, setPeople] = useState<PickedUser[]>([]);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewSample, setPreviewSample] = useState<RecipientSample[]>([]);
  const [previewing, setPreviewing] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BroadcastRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const statesQuery = useApiQuery<StateResponse>(["admin", "states", "communications"], "/admin/states?limit=100", allowed && mode === "market_associates");
  const states = useMemo(() => {
    const rows = Array.isArray(statesQuery.data) ? statesQuery.data : statesQuery.data?.data || [];
    return rows.flatMap((state) => {
      const id = state.id || state.publicId;
      return id ? [{ id: String(id), name: state.name || String(id) }] : [];
    });
  }, [statesQuery.data]);

  const rolesQuery = useApiQuery<RoleResponse>(["admin", "roles", "communications"], "/admin/roles?limit=100", allowed && mode === "staff");
  const roles = useMemo(() => {
    const rows = Array.isArray(rolesQuery.data) ? rolesQuery.data : rolesQuery.data?.data || [];
    return rows.flatMap((role) => {
      const key = role.key;
      return key ? [{ key, name: role.name || key.replaceAll("_", " ") }] : [];
    });
  }, [rolesQuery.data]);

  const historyQuery = useApiQuery<Page<BroadcastRecord>>(["admin", "communications"], "/admin/communications", allowed);
  const history = historyQuery.data?.data || [];

  function audiencePayload(): Record<string, unknown> {
    // Defensive: never let a malformed picker entry reach the API as a null in the array.
    if (mode === "specific") return { userIds: people.map((user) => user.id).filter((id): id is string => Boolean(id)) };
    if (mode === "market_associates") return { segment: "market_associates", ...(stateIds.length ? { stateIds } : {}) };
    if (mode === "staff") return { segment: "staff", ...(roleKey ? { roleKey } : {}) };
    return { segment: "customers" };
  }

  function resetPreview() {
    setPreviewCount(null);
    setPreviewSample([]);
  }

  function toggleChannel(channel: Channel, checked: boolean) {
    setChannels((current) => (checked ? [...new Set([...current, channel])] : current.filter((value) => value !== channel)));
    resetPreview();
  }

  function toggleState(id: string) {
    setStateIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
    resetPreview();
  }

  function resetAudienceInputs(next: AudienceMode) {
    setMode(next);
    resetPreview();
  }

  async function preview() {
    if (mode === "specific" && !people.length) return toast.error("Pick at least one person");
    setPreviewing(true);
    try {
      const result = await apiPost<{ recipientCount: number; sample: RecipientSample[] }>("/admin/communications/preview", { audience: audiencePayload() });
      setPreviewCount(result.recipientCount);
      setPreviewSample(result.sample || []);
      if (!result.recipientCount) toast.info("No accounts match this audience");
    } catch (error) {
      toast.error(errorMessage(error, "Could not resolve this audience"));
    } finally {
      setPreviewing(false);
    }
  }

  async function send() {
    if (title.trim().length < 3 || body.trim().length < 3) return toast.error("Add a title and message");
    if (!channels.length) return toast.error("Choose at least one channel");
    if (previewCount === null) return toast.error("Preview the recipients before sending");
    setSending(true);
    try {
      const result = await apiPost<{ recipientCount: number }>("/admin/communications/send", {
        title: title.trim(),
        body: body.trim(),
        channels,
        audience: audiencePayload(),
      });
      toast.success(`Sent to ${result.recipientCount} recipient${result.recipientCount === 1 ? "" : "s"}`);
      setTitle("");
      setBody("");
      setPeople([]);
      resetPreview();
      await historyQuery.refetch();
    } catch (error) {
      toast.error(errorMessage(error, "Could not send this broadcast"));
    } finally {
      setSending(false);
    }
  }

  async function deleteHistoryEntry() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDelete(`/admin/communications/${deleteTarget.publicId}`);
      toast.success("Removed from send history");
      setDeleteTarget(null);
      await historyQuery.refetch();
    } catch (error) {
      toast.error(errorMessage(error, "Could not remove this from history"));
    } finally {
      setDeleting(false);
    }
  }

  if (session && !allowed) {
    return (
      <div className="mx-auto flex min-h-96 max-w-2xl items-center justify-center p-6 text-center">
        <div>
          <Megaphone className="mx-auto size-10 text-muted-foreground" />
          <h1 className="mt-4 text-lg font-semibold">Communications access is restricted</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your current role does not include permission to send communications.</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permission="communications.send">
      <div className="w-full space-y-5 px-4 py-5">
        <PageHeader title="Communications" description="Send a targeted push, email, or in-app message to customers, market associates, staff, or specific accounts." />

        <Card className="rounded-xl shadow-none">
          <CardContent className="space-y-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="broadcast-title">Title</Label>
              <Input id="broadcast-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="We're launching a new feature!" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="broadcast-body">Message</Label>
              <Textarea id="broadcast-body" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write your announcement..." className="min-h-28" />
            </div>

            <div className="space-y-2">
              <Label>Channels</Label>
              <div className="flex flex-wrap gap-4">
                {CHANNEL_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 text-sm text-foreground">
                    <Checkbox checked={channels.includes(option.value)} onCheckedChange={(value) => toggleChannel(option.value, Boolean(value))} />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Audience</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {AUDIENCE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => resetAudienceInputs(option.value)}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${mode === option.value ? "border-foreground bg-zinc-50" : "border-border hover:bg-zinc-50"}`}
                  >
                    <span className="flex items-center gap-1.5 font-medium text-foreground">{mode === option.value ? <Check className="size-3.5" /> : null}{option.label}</span>
                    <span className="block text-xs text-muted-foreground">{option.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {mode === "market_associates" ? (
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><MapPin className="size-3.5" /> States (leave empty for every state)</Label>
                <QueryState loading={statesQuery.isLoading} error={statesQuery.error} loadingLabel="Loading states">
                  <div className="flex flex-wrap gap-2">
                    {states.map((state) => (
                      <button
                        key={state.id}
                        type="button"
                        onClick={() => toggleState(state.id)}
                        className={`rounded-full border px-3 py-1 text-xs ${stateIds.includes(state.id) ? "border-foreground bg-zinc-100 text-foreground" : "border-border text-muted-foreground hover:bg-zinc-50"}`}
                      >
                        {state.name}
                      </button>
                    ))}
                  </div>
                </QueryState>
              </div>
            ) : null}

            {mode === "staff" ? (
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Users className="size-3.5" /> Role (leave unset for every staff member)</Label>
                <Select value={roleKey || "__any"} onValueChange={(value) => { setRoleKey(value === "__any" ? "" : value); resetPreview(); }}>
                  <SelectTrigger className="w-full sm:w-72"><SelectValue placeholder="Any role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__any">Any role</SelectItem>
                    {roles.map((role) => <SelectItem key={role.key} value={role.key}>{role.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {mode === "specific" ? (
              <UserPicker selected={people} onChange={(users) => { setPeople(users); resetPreview(); }} />
            ) : null}

            <div className="space-y-3 border-t pt-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" disabled={previewing} onClick={() => void preview()}>{previewing ? "Checking..." : "Preview recipients"}</Button>
                {previewCount !== null ? <span className="text-sm text-muted-foreground">{previewCount} recipient{previewCount === 1 ? "" : "s"} will be reached</span> : null}
                <Button variant="brand" disabled={sending || previewCount === null || !previewCount} onClick={() => void send()} className="ml-auto">
                  <Send /> {sending ? "Sending..." : "Send broadcast"}
                </Button>
              </div>

              {previewSample.length ? (
                <div className="rounded-lg border bg-zinc-50/60 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Includes</p>
                  <ul className="mt-1.5 space-y-1">
                    {previewSample.map((recipient) => (
                      <li key={recipient.email} className="flex items-baseline gap-2 text-sm">
                        <span className="font-medium text-foreground">{recipient.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{recipient.email}</span>
                      </li>
                    ))}
                  </ul>
                  {previewCount !== null && previewCount > previewSample.length ? (
                    <p className="mt-1.5 text-xs text-muted-foreground">+{previewCount - previewSample.length} more</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-xl shadow-none">
          <CardContent className="p-0">
            <div className="border-b px-4 py-3"><h2 className="text-sm font-semibold text-foreground">Send history</h2></div>
            <QueryState
              loading={historyQuery.isLoading}
              error={historyQuery.error}
              loadingLabel="Loading history"
              empty={!historyQuery.isLoading && !historyQuery.isError && !history.length}
              emptyIcon={Megaphone}
              emptyTitle="No broadcasts sent yet"
              onRetry={() => historyQuery.refetch()}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-zinc-50 text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">Title</th>
                    <th className="px-3 py-2.5 font-medium">Channels</th>
                    <th className="px-3 py-2.5 font-medium">Recipients</th>
                    <th className="px-3 py-2.5 font-medium">Sent</th>
                    <th className="w-10 px-2 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {history.map((record) => (
                    <tr key={record.publicId}>
                      <td className="px-4 py-2 font-medium text-foreground">{record.title}</td>
                      <td className="px-3 py-2 text-muted-foreground">{record.channels.join(", ")}</td>
                      <td className="px-3 py-2 tabular-nums text-foreground">{record.recipientCount}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(record.sentAt).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</td>
                      <td className="px-2 py-2 text-right">
                        <Button variant="ghost" size="icon-sm" aria-label={`Remove ${record.title} from history`} onClick={() => setDeleteTarget(record)}><Trash2 className="size-4 text-destructive" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </QueryState>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open && !deleting) setDeleteTarget(null); }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this send from history?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? `"${deleteTarget.title}" will be removed from this list. This only removes the record — it does not recall or unsend anything already delivered to its ${deleteTarget.recipientCount} recipient${deleteTarget.recipientCount === 1 ? "" : "s"}.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(event) => { event.preventDefault(); void deleteHistoryEntry(); }} disabled={deleting}>
              {deleting ? "Removing..." : "Remove from history"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PermissionGuard>
  );
}
