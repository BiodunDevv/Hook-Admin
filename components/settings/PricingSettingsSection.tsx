"use client";

import { useEffect, useMemo, useState } from "react";
import { Receipt, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HookLoader } from "@/components/shared/HookLoader";
import { QueryState } from "@/components/shared/QueryState";
import { apiPatch } from "@/lib/api";
import { useApiQuery } from "@/lib/query";

type PricingConfig = {
  vatRatePercent: number;
  defaultDeliveryFeeMinor: number;
};

const naira = (minor: number) => `₦${Math.round(minor / 100).toLocaleString("en-NG")}`;

/** VAT and the platform default delivery fee. Changes are audited with a reason and reach the app instantly. */
export function PricingSettingsSection() {
  const query = useApiQuery<PricingConfig>(["commerce", "pricing-config"], "/admin/commerce/pricing-config");
  const [form, setForm] = useState<PricingConfig | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (query.data) setForm(query.data);
  }, [query.data]);

  const changes = useMemo(() => {
    if (!form || !query.data) return {} as Partial<PricingConfig>;
    return Object.fromEntries(
      (Object.keys(form) as Array<keyof PricingConfig>).filter((key) => form[key] !== query.data[key]).map((key) => [key, form[key]]),
    ) as Partial<PricingConfig>;
  }, [form, query.data]);
  const dirty = Object.keys(changes).length > 0;

  // A worked example so the numbers are easy to check before saving.
  const example = useMemo(() => {
    if (!form) return null;
    const subtotal = 5_000_000;
    const vat = Math.round((subtotal * form.vatRatePercent) / 100);
    return { subtotal, vat, delivery: form.defaultDeliveryFeeMinor, total: subtotal + vat + form.defaultDeliveryFeeMinor };
  }, [form]);

  async function save() {
    if (!form || !dirty) return;
    if (reason.trim().length < 5) return toast.error("Add a short audit reason");
    setSaving(true);
    try {
      await apiPatch("/admin/commerce/pricing-config", { ...changes, reason: reason.trim() });
      toast.success("Pricing settings saved");
      setReason("");
      await query.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  if (query.isLoading || (!form && !query.isError)) return <div className="grid min-h-60 place-items-center"><HookLoader label="Loading settings" /></div>;
  if (query.isError || !form) return <QueryState error={query.error} errorTitle="Settings could not load" onRetry={() => void query.refetch()} />;

  return (
    <Card className="gap-0 overflow-hidden border-zinc-200 py-0 shadow-sm">
      <CardHeader className="border-b px-5 py-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-lg"><Receipt className="size-5 text-brand-gold" /> VAT &amp; delivery pricing</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">VAT is added to the products in every order. The default delivery fee applies wherever a State has no fee of its own (set State fees under Delivery States &amp; Fees).</p>
      </CardHeader>
      <CardContent className="space-y-8 p-5 sm:p-6">
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="vat">VAT on products</Label>
            <div className="relative">
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              <Input id="vat" type="number" min={0} max={30} step={0.5} className="pr-7" value={String(form.vatRatePercent)} onChange={(event) => setForm({ ...form, vatRatePercent: Number(event.target.value || 0) })} />
            </div>
            <p className="text-xs text-zinc-500">Nigeria&apos;s standard rate is 7.5%. The app updates straight away.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="delivery-fee">Default delivery fee</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span>
              <Input id="delivery-fee" type="number" min={0} step={100} className="pl-7" value={String(form.defaultDeliveryFeeMinor / 100)} onChange={(event) => setForm({ ...form, defaultDeliveryFeeMinor: Math.round(Number(event.target.value || 0) * 100) })} />
            </div>
            <p className="text-xs text-zinc-500">Used when a State has no delivery fee set.</p>
          </div>
        </div>

        {example ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Example: a {naira(example.subtotal)} order</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg bg-white/70 p-3"><p className="text-xs text-amber-800">VAT</p><p className="text-lg font-semibold">{naira(example.vat)}</p></div>
              <div className="rounded-lg bg-white/70 p-3"><p className="text-xs text-amber-800">Delivery</p><p className="text-lg font-semibold">{naira(example.delivery)}</p></div>
              <div className="rounded-lg bg-white/70 p-3"><p className="text-xs text-amber-800">Customer pays</p><p className="text-lg font-semibold">{naira(example.total)}</p></div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 border-t pt-5 sm:grid-cols-[1fr_auto] sm:items-start">
          <div className="space-y-2">
            <Label htmlFor="pricing-reason">Reason (audit log)</Label>
            <Input id="pricing-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Why are you changing this?" />
            {dirty ? <p className="text-xs text-amber-700">Unsaved: {Object.keys(changes).length} change{Object.keys(changes).length === 1 ? "" : "s"}.</p> : null}
          </div>
          <Button variant="brand" onClick={() => void save()} disabled={saving || !dirty}>{saving ? <HookLoader size="button" label="Saving..." /> : <><Save size={15} /> Save changes</>}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
