"use client";

import { useEffect, useState } from "react";
import { Save, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HookLoader } from "@/components/shared/HookLoader";
import { QueryState } from "@/components/shared/QueryState";
import { apiPatch } from "@/lib/api";
import { useApiQuery } from "@/lib/query";

const naira = (minor: number) => `₦${(minor / 100).toLocaleString("en-NG")}`;

export function CheckoutSettingsSection() {
  const query = useApiQuery<{ minimumCheckoutMinor: number }>(["commerce", "checkout-settings"], "/admin/commerce/checkout-settings");
  const [amount, setAmount] = useState("18000");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (query.data) setAmount(String((query.data.minimumCheckoutMinor ?? 1_800_000) / 100));
  }, [query.data]);

  async function save() {
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 0) return toast.error("Enter an amount of 0 or more");
    if (reason.trim().length < 5) return toast.error("Add a short audit reason");
    setSaving(true);
    try {
      await apiPatch("/admin/commerce/checkout-settings", { minimumCheckoutMinor: Math.round(value * 100), reason: reason.trim() });
      toast.success("Minimum order updated");
      setReason("");
      await query.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Could not update checkout settings");
    } finally {
      setSaving(false);
    }
  }

  if (query.isLoading) return <div className="grid min-h-60 place-items-center"><HookLoader label="Loading checkout settings" /></div>;
  if (query.isError) return <QueryState error={query.error} errorTitle="Checkout settings could not load" onRetry={() => void query.refetch()} />;
  const current = query.data?.minimumCheckoutMinor ?? 1_800_000;
  const typed = Math.round(Number(amount || 0) * 100);

  return (
    <Card className="gap-0 overflow-hidden border-zinc-200 py-0 shadow-sm">
      <CardHeader className="border-b px-5 py-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-lg"><ShoppingCart className="size-5 text-brand-gold" /> Minimum order</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">The smallest cart total customers can check out. Smaller carts can still be saved, but the customer cannot pay.</p>
      </CardHeader>
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm">
          <p className="text-zinc-500">Currently enforced</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{current > 0 ? naira(current) : "No minimum"}</p>
          <p className="mt-1 text-xs text-zinc-500">Measured on the item subtotal, before delivery, VAT and Hook credit. Set 0 to switch the minimum off.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="min-order">Lowest order value (₦)</Label>
            <Input id="min-order" type="number" min={0} step={500} value={amount} onChange={(event) => setAmount(event.target.value)} />
            {typed !== current ? <p className="text-xs text-amber-700">Will change from {naira(current)} to {naira(typed)}.</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="min-reason">Reason (audit log)</Label>
            <Input id="min-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Why are you changing this?" />
          </div>
        </div>
        <div className="flex justify-end border-t pt-4">
          <Button variant="brand" onClick={() => void save()} disabled={saving || typed === current}>{saving ? <HookLoader size="button" label="Saving..." /> : <><Save size={15} /> Save changes</>}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
