"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Pause, Play, Search, Star, UserPlus, UserRoundX } from "lucide-react";
import { toast } from "sonner";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { HookLoader } from "@/components/shared/HookLoader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { apiPost } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { cn } from "@/lib/utils";

export type MarketAssociateRow = {
  assignmentId: string;
  marketAssociateId: string;
  name: string;
  email?: string;
  phone?: string;
  profileStatus?: string;
  availability?: string;
  status: string;
  isPrimary: boolean;
  priority?: number;
};

type Candidate = { id: string; publicId?: string; firstName?: string; lastName?: string; email?: string; status?: string; availability?: string; activeMarketCount?: number };
type Change = { row: MarketAssociateRow; action: "pause" | "activate" | "end" };

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "MA";
const clean = (error: unknown, fallback: string) => (error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : fallback);

const CHANGE_COPY = {
  pause: { title: "Pause this assignment?", body: "They stop receiving work from this Market until you resume it.", button: "Pause", destructive: false },
  activate: { title: "Resume this assignment?", body: "They will receive work from this Market again.", button: "Resume", destructive: false },
  end: { title: "End this assignment?", body: "They are taken off this Market. You can assign them again later.", button: "End assignment", destructive: true },
} as const;

/**
 * Who works a Market, and the place to add or remove them. Only Market Associates who work in the Market's state can be
 * chosen, so the state rule is never something the admin has to remember.
 */
export function MarketAssociatePanel({ marketId, marketName, marketStateId, marketActive, associates, onChanged }: {
  marketId: string;
  marketName: string;
  marketStateId: string;
  marketActive: boolean;
  associates: MarketAssociateRow[];
  onChanged: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [change, setChange] = useState<Change | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState("");
  const [primary, setPrimary] = useState(false);
  const [note, setNote] = useState("");

  const candidatesQuery = useApiQuery<{ data: Candidate[] }>(
    ["admin", "market-associates", "for-market", marketStateId],
    `/admin/market-associates?limit=200&stateId=${encodeURIComponent(marketStateId)}`,
    adding && Boolean(marketStateId),
  );
  const assignedIds = useMemo(() => new Set(associates.map((row) => row.marketAssociateId)), [associates]);
  const candidates = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (candidatesQuery.data?.data || [])
      .filter((person) => ["active", "invited"].includes(String(person.status)))
      .filter((person) => !assignedIds.has(person.publicId || person.id))
      .filter((person) => !term || `${person.firstName || ""} ${person.lastName || ""} ${person.email || ""}`.toLowerCase().includes(term));
  }, [candidatesQuery.data, assignedIds, search]);

  function closeAdd() {
    if (busy) return;
    setAdding(false);
    setSearch("");
    setPicked("");
    setPrimary(false);
    setNote("");
  }

  async function assign() {
    if (!picked) return;
    setBusy(true);
    try {
      await apiPost("/admin/market-associate-assignments", {
        marketAssociateId: picked,
        marketId,
        priority: 100,
        isPrimary: primary,
        activeFrom: new Date().toISOString(),
        assignmentReason: note.trim() || `Assigned from the ${marketName} page`,
      });
      toast.success("Market Associate assigned");
      setBusy(false);
      closeAdd();
      onChanged();
    } catch (error) {
      toast.error(clean(error, "Could not assign this Market Associate"));
      setBusy(false);
    }
  }

  async function applyChange() {
    if (!change) return;
    setBusy(true);
    try {
      await apiPost(`/admin/market-associate-assignments/${change.row.assignmentId}/${change.action}`, { reason: reason.trim() });
      toast.success(change.action === "end" ? "Assignment ended" : change.action === "pause" ? "Assignment paused" : "Assignment resumed");
      setChange(null);
      setReason("");
      onChanged();
    } catch (error) {
      toast.error(clean(error, "Could not update this assignment"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <p className="text-sm text-muted-foreground">{associates.length ? `${associates.length} Market Associate${associates.length === 1 ? "" : "s"} work${associates.length === 1 ? "s" : ""} this Market.` : "Nobody works this Market yet."}</p>
        <PermissionGuard permission="runners.assign">
          <Button size="sm" variant="brand" onClick={() => setAdding(true)} disabled={!marketActive} title={marketActive ? undefined : "Activate this Market before assigning people"}><UserPlus /> Assign Market Associate</Button>
        </PermissionGuard>
      </div>

      {!associates.length ? (
        <div className="px-6 py-12 text-center">
          <span className="mx-auto grid size-11 place-items-center rounded-full bg-zinc-100 text-zinc-500"><UserPlus className="size-5" /></span>
          <p className="mt-3 text-sm font-medium">No Market Associates yet</p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">Products from this Market can&apos;t be captured until someone is assigned to it.</p>
        </div>
      ) : (
        <ul className="divide-y">
          {associates.map((row) => (
            <li key={row.assignmentId} className="flex items-center gap-3 px-4 py-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-amber-100 text-sm font-semibold text-amber-900">{initials(row.name)}</span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  <Link href={`/dashboard/market-associates/${row.marketAssociateId}`} className="truncate hover:underline">{row.name}</Link>
                  {row.isPrimary ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800"><Star className="size-3" /> Primary</span> : null}
                </p>
                <p className="truncate text-xs text-muted-foreground">{[row.email, row.phone].filter(Boolean).join(" · ")}</p>
              </div>
              <StatusBadge status={row.status === "active" ? row.profileStatus || "active" : row.status} />
              <PermissionGuard permission="runners.assign">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`Actions for ${row.name}`}><MoreHorizontal /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {row.status === "paused"
                      ? <DropdownMenuItem onSelect={() => setChange({ row, action: "activate" })}><Play /> Resume</DropdownMenuItem>
                      : <DropdownMenuItem onSelect={() => setChange({ row, action: "pause" })}><Pause /> Pause</DropdownMenuItem>}
                    <DropdownMenuItem variant="destructive" onSelect={() => setChange({ row, action: "end" })}><UserRoundX /> End assignment</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </PermissionGuard>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={adding} onOpenChange={(next) => { if (!next) closeAdd(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign a Market Associate</DialogTitle>
            <DialogDescription>Only people who work in this Market&apos;s state are listed.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or email" className="pl-9" />
            </div>
            {candidatesQuery.isLoading ? (
              <div className="grid min-h-32 place-items-center"><HookLoader label="Loading people" /></div>
            ) : candidatesQuery.isError ? (
              <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">People could not load. Close this and try again.</p>
            ) : !candidates.length ? (
              <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">{search ? "Nobody matches that search." : "Everyone in this state is already assigned, or no Market Associates work here yet. Add the state to a person's profile, or invite someone new."}</p>
            ) : (
              <ul className="max-h-64 divide-y overflow-y-auto rounded-xl border">
                {candidates.map((person) => {
                  const id = person.publicId || person.id;
                  const name = `${person.firstName || ""} ${person.lastName || ""}`.trim() || person.email || id;
                  const on = picked === id;
                  return (
                    <li key={id}>
                      <button type="button" onClick={() => setPicked(id)} aria-pressed={on} className={cn("flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-zinc-50", on && "bg-amber-50/70")}>
                        <span className={cn("grid size-4 shrink-0 place-items-center rounded-full border", on ? "border-zinc-900 bg-zinc-900" : "border-zinc-300")}>{on ? <span className="size-1.5 rounded-full bg-white" /> : null}</span>
                        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{name}</span><span className="block truncate text-xs text-muted-foreground">{person.email} · {person.activeMarketCount || 0} Market{person.activeMarketCount === 1 ? "" : "s"}</span></span>
                        <StatusBadge status={person.status || "active"} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div><Label htmlFor="assign-primary" className="cursor-pointer text-sm">Make this their primary Market</Label><p className="text-xs text-muted-foreground">Their preferred Market in this state.</p></div>
              <Switch id="assign-primary" checked={primary} onCheckedChange={setPrimary} />
            </div>
            <div className="space-y-1.5"><Label htmlFor="assign-note">Note <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="assign-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Why are you assigning them?" maxLength={500} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAdd} disabled={busy}>Cancel</Button>
            <Button variant="brand" onClick={() => void assign()} disabled={busy || !picked}>{busy ? <HookLoader size="button" /> : "Assign"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(change)} onOpenChange={(next) => { if (!next && !busy) { setChange(null); setReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{change ? CHANGE_COPY[change.action].title : ""}</DialogTitle>
            <DialogDescription>{change ? `${change.row.name}. ${CHANGE_COPY[change.action].body}` : ""}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5"><Label htmlFor="assign-change-reason">Reason</Label><Input id="assign-change-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Recorded in the audit log" maxLength={500} /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setChange(null); setReason(""); }} disabled={busy}>Cancel</Button>
            <Button variant={change && CHANGE_COPY[change.action].destructive ? "destructive" : "brand"} onClick={() => void applyChange()} disabled={busy || reason.trim().length < 3}>{busy ? <HookLoader size="button" /> : change ? CHANGE_COPY[change.action].button : "Confirm"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
