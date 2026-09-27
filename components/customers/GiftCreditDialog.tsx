"use client";

import { useState } from "react";
import { Check, Gift, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { apiGet, apiPost } from "@/lib/api";

interface CustomerMatch {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : fallback;
}

function customerName(customer: CustomerMatch) {
  return `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || customer.email;
}

/** Search any customer and gift Hook credit directly, without opening their record first. */
export function GiftCreditDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<CustomerMatch[]>([]);
  const [selected, setSelected] = useState<CustomerMatch | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  function reset() {
    setQuery("");
    setResults([]);
    setSelected(null);
    setAmount("");
    setReason("");
  }

  async function search() {
    const term = query.trim();
    if (term.length < 2) return toast.error("Enter at least 2 characters");
    setSearching(true);
    try {
      const page = await apiGet<{ data: CustomerMatch[] }>(`/admin/customers?search=${encodeURIComponent(term)}&limit=10`);
      setResults(page.data || []);
      if (!page.data?.length) toast.info("No customers matched that search");
    } catch (error) {
      toast.error(errorMessage(error, "Search failed"));
    } finally {
      setSearching(false);
    }
  }

  async function gift() {
    if (!selected) return;
    const amountMinor = Math.round(Number(amount) * 100);
    if (!amountMinor || amountMinor <= 0) return toast.error("Enter an amount greater than zero");
    if (reason.trim().length < 5) return toast.error("Add a short reason");
    setBusy(true);
    try {
      await apiPost(`/admin/users/${selected.id}/gift-credit`, {
        amountMinor,
        reason: reason.trim(),
        idempotencyKey: crypto.randomUUID(),
      });
      toast.success(`Gifted ₦${Number(amount).toLocaleString()} to ${selected.email}`);
      onOpenChange(false);
      reset();
    } catch (error) {
      toast.error(errorMessage(error, "Could not gift Hook credit"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!busy) { onOpenChange(next); if (!next) reset(); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gift Hook credit</DialogTitle>
          <DialogDescription>Search for any customer by email, then add credit to their account with a reason.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="gift-search">Customer email</Label>
          <div className="flex gap-2">
            <Input
              id="gift-search"
              value={query}
              onChange={(event) => { setQuery(event.target.value); setSelected(null); }}
              onKeyDown={(event) => { if (event.key === "Enter") void search(); }}
              placeholder="Search by email or name"
            />
            <Button type="button" variant="outline" disabled={searching} onClick={() => void search()}><Search size={15} /></Button>
          </div>
        </div>

        {!selected && results.length ? (
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-1.5">
            {results.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => setSelected(customer)}
                className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm hover:bg-zinc-100"
              >
                <span className="min-w-0"><span className="block truncate font-medium text-foreground">{customerName(customer)}</span><span className="block truncate text-xs text-muted-foreground">{customer.email}</span></span>
              </button>
            ))}
          </div>
        ) : null}

        {selected ? (
          <>
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              <Check size={15} /> {customerName(selected)} <span className="text-emerald-600">({selected.email})</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="gift-amount">Amount (₦)</Label><Input id="gift-amount" type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="1000" /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="gift-reason">Reason</Label><Input id="gift-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Goodwill credit for a delivery issue" /></div>
            </div>
          </>
        ) : null}

        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="brand" disabled={busy || !selected} onClick={() => void gift()}>{busy ? "Gifting..." : <><Gift /> Gift credit</>}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
