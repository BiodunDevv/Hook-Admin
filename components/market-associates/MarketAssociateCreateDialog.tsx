"use client";

import { useMemo, useState } from "react";
import { Check, MailCheck, Store } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminWorkflowSheet } from "@/components/shared/AdminWorkflowSheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HookLoader } from "@/components/shared/HookLoader";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { RelatedMultiSelect, type DirectoryField } from "@/components/platform/PlatformDirectoryPage";
import { apiPost } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { cn } from "@/lib/utils";

const stateField: DirectoryField = { key: "stateIds", label: "Operation states", type: "multi-select", optionsEndpoint: "/admin/states" };

type MarketOption = { id: string; publicId?: string; name: string; status?: string; stateId?: { publicId?: string; _id?: string } | string; stateName?: string | null; hubName?: string | null };
const stateOf = (market: MarketOption) => (typeof market.stateId === "string" ? market.stateId : market.stateId?.publicId || market.stateId?._id || "");

/**
 * Invites a Market Associate. Choosing states says where they may work; choosing Markets here assigns them straight
 * away, so there is nothing left to do on their profile. The first Market picked becomes their primary one.
 */
export function MarketAssociateCreateDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => Promise<unknown> | unknown }) {
  const [stateIds, setStateIds] = useState<string[]>([]);
  const [marketIds, setMarketIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const marketsQuery = useApiQuery<{ data: MarketOption[] }>(["admin", "markets", "for-associate-create"], "/admin/markets?limit=200", open && stateIds.length > 0);
  const eligible = useMemo(
    () => (marketsQuery.data?.data || []).filter((market) => market.status === "active" && stateIds.includes(stateOf(market))),
    [marketsQuery.data, stateIds],
  );
  // A Market picked earlier is dropped if its state is no longer selected.
  const chosen = marketIds.filter((id) => eligible.some((market) => (market.publicId || market.id) === id));

  function reset() {
    setStateIds([]);
    setMarketIds([]);
    setError("");
  }

  function toggleMarket(id: string) {
    setMarketIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    if (!stateIds.length) return setError("Choose at least one state this person will work in.");
    setSaving(true);
    try {
      await apiPost("/admin/market-associates", {
        firstName: String(form.get("firstName") || "").trim(),
        lastName: String(form.get("lastName") || "").trim(),
        email: String(form.get("email") || "").trim().toLowerCase(),
        phone: String(form.get("phone") || "").trim(),
        stateIds,
        ...(chosen.length ? { marketIds: chosen } : {}),
      });
      toast.success(chosen.length ? `Invitation sent and assigned to ${chosen.length} Market${chosen.length === 1 ? "" : "s"}` : "Invitation sent");
      reset();
      onClose();
      await onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message.replace(/^\d+:\s*/, "") : "Unable to create the invitation");
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
        description="They get an email invitation to set a password. Choose where they work and, if you like, the Markets they start on."
        footer={<><Button type="button" variant="outline" onClick={() => { reset(); onClose(); }} disabled={saving}>Cancel</Button><Button type="submit" form="market-associate-create-form" variant="brand" disabled={saving || !stateIds.length}>{saving ? <HookLoader size="button" /> : <><MailCheck /> Send invitation</>}</Button></>}
      >
        <form id="market-associate-create-form" onSubmit={submit} className="space-y-7">
          {error ? <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div> : null}

          <section className="space-y-3">
            <div><h3 className="text-sm font-semibold">Who they are</h3><p className="text-xs text-muted-foreground">The invitation goes to this email address.</p></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="ma-first-name">First name</Label><Input id="ma-first-name" name="firstName" placeholder="Chidi" autoComplete="off" required /></div>
              <div className="space-y-1.5"><Label htmlFor="ma-last-name">Last name</Label><Input id="ma-last-name" name="lastName" placeholder="Eze" autoComplete="off" required /></div>
              <div className="space-y-1.5"><Label htmlFor="ma-email">Email</Label><Input id="ma-email" name="email" type="email" placeholder="name@example.com" autoComplete="off" required /></div>
              <div className="space-y-1.5"><Label htmlFor="ma-phone">Phone number</Label><Input id="ma-phone" name="phone" type="tel" placeholder="+234 801 234 5678" autoComplete="off" required /></div>
            </div>
          </section>

          <section className="space-y-3">
            <div><h3 className="text-sm font-semibold">Where they work</h3><p className="text-xs text-muted-foreground">They can only be given Markets in these states.</p></div>
            <RelatedMultiSelect field={stateField} value={stateIds} values={{}} onChange={setStateIds} />
          </section>

          <section className="space-y-3">
            <div><h3 className="flex items-center gap-2 text-sm font-semibold">Markets to start on <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">Optional</span></h3><p className="text-xs text-muted-foreground">The first one you pick is their primary Market. You can change this any time from their profile or the Market page.</p></div>
            {!stateIds.length ? (
              <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">Choose a state above to see its Markets.</p>
            ) : marketsQuery.isLoading ? (
              <div className="grid min-h-24 place-items-center"><HookLoader label="Loading Markets" /></div>
            ) : !eligible.length ? (
              <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">No active Markets in the chosen state{stateIds.length === 1 ? "" : "s"} yet.</p>
            ) : (
              <ul className="max-h-64 divide-y overflow-y-auto rounded-xl border bg-white">
                {eligible.map((market) => {
                  const id = market.publicId || market.id;
                  const on = chosen.includes(id);
                  const position = chosen.indexOf(id);
                  return (
                    <li key={id}>
                      <button type="button" onClick={() => toggleMarket(id)} aria-pressed={on} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-zinc-50">
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-600"><Store className="size-4" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{market.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">{[market.stateName, market.hubName].filter(Boolean).join(" · ") || "No Dispatch Hub yet"}</span>
                        </span>
                        {on && position === 0 ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">Primary</span> : null}
                        <span className={cn("grid size-5 shrink-0 place-items-center rounded-md border", on ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300")}>{on ? <Check size={13} /> : null}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </form>
      </AdminWorkflowSheet>
    </PermissionGuard>
  );
}
