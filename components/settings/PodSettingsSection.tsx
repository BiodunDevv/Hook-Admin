"use client";

import { useEffect, useMemo, useState } from "react";
import { Save, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { HookLoader } from "@/components/shared/HookLoader";
import { QueryState } from "@/components/shared/QueryState";
import { apiPatch } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { cn } from "@/lib/utils";

type PodConfig = {
  podEnabled: boolean;
  podMinimumOrderMinor: number;
  podSurchargeType: "flat" | "percent";
  podSurchargeValue: number;
  defaultPodLimitMinor: number;
  podAutoApproveEnabled: boolean;
  podRefusalSuspendCount: number;
  vatRatePercent: number;
  defaultDeliveryFeeMinor: number;
};

const naira = (minor: number) => `₦${Math.round(minor / 100).toLocaleString("en-NG")}`;

/**
 * Pay on Delivery and VAT. The customer pays the delivery fee (plus the surcharge set here) online first and the rest
 * at the door. Everything here is audited with a reason and reaches the app instantly.
 */
export function PodSettingsSection() {
  const query = useApiQuery<PodConfig>(["commerce", "pod-config"], "/admin/commerce/pod-config");
  const [form, setForm] = useState<PodConfig | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (query.data) setForm(query.data);
  }, [query.data]);

  const changes = useMemo(() => {
    if (!form || !query.data) return {} as Partial<PodConfig>;
    return Object.fromEntries((Object.keys(form) as Array<keyof PodConfig>).filter((key) => key !== "defaultDeliveryFeeMinor" && form[key] !== query.data[key]).map((key) => [key, form[key]])) as Partial<PodConfig>;
  }, [form, query.data]);
  const dirty = Object.keys(changes).length > 0;

  // Live example so the numbers are easy to check before saving.
  const example = useMemo(() => {
    if (!form) return null;
    const subtotal = Math.max(form.podMinimumOrderMinor, 5_000_000);
    const surcharge = form.podSurchargeType === "percent" ? Math.round((subtotal * form.podSurchargeValue) / 100) : Math.round(form.podSurchargeValue);
    const vat = Math.round((subtotal * form.vatRatePercent) / 100);
    const feeNow = form.defaultDeliveryFeeMinor + surcharge;
    return { subtotal, surcharge, vat, feeNow, atDoor: subtotal + vat };
  }, [form]);

  async function save() {
    if (!form || !dirty) return;
    if (reason.trim().length < 5) return toast.error("Add a short audit reason");
    setSaving(true);
    try {
      await apiPatch("/admin/commerce/pod-config", { ...changes, reason: reason.trim() });
      toast.success("Pay on Delivery settings saved");
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
  const set = <K extends keyof PodConfig>(key: K, value: PodConfig[K]) => setForm((current) => (current ? { ...current, [key]: value } : current));
  const nairaField = (id: string, label: string, key: keyof PodConfig, help: string) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span>
        <Input id={id} type="number" min={0} step={500} className="pl-7" value={String((form[key] as number) / 100)} onChange={(event) => set(key, Math.round(Number(event.target.value || 0) * 100) as never)} />
      </div>
      <p className="text-xs text-zinc-500">{help}</p>
    </div>
  );

  return (
    <Card className="gap-0 overflow-hidden border-zinc-200 py-0 shadow-sm">
      <CardHeader className="border-b px-5 py-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-lg"><Truck className="size-5 text-brand-gold" /> Pay on Delivery &amp; VAT</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">Customers pay the delivery fee (plus a surcharge) online first, and the rest at the door through a secure Paystack link. A failed or refused delivery keeps the fee; a cancellation before dispatch refunds it.</p>
      </CardHeader>
      <CardContent className="space-y-8 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4 rounded-xl border bg-zinc-50 p-4">
          <div className="min-w-0">
            <p className="font-semibold text-zinc-900">Offer Pay on Delivery</p>
            <p className="mt-0.5 text-xs leading-5 text-zinc-500">{form.podEnabled ? "On. Customers see it at checkout in States where it is enabled (Delivery States & Fees)." : "Off. Nobody can choose it, in any State."}</p>
          </div>
          <Switch checked={form.podEnabled} onCheckedChange={(value) => set("podEnabled", value)} aria-label="Offer Pay on Delivery" />
        </div>

        <section className={cn("space-y-4", !form.podEnabled && "opacity-60")}>
          <div><h3 className="text-sm font-semibold text-zinc-900">Who can use it</h3><p className="text-xs text-zinc-500">Order size and behaviour rules.</p></div>
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            {nairaField("pod-min", "Smallest order total", "podMinimumOrderMinor", "Judged on the whole order: goods after discount, VAT and delivery. Smaller orders must be paid in full online. Default ₦30,000.")}
            {nairaField("pod-limit", "Highest order without extra review", "defaultPodLimitMinor", "Above this, a confirmation call and Super Admin override are needed. A State can set its own.")}
            <div className="space-y-2">
              <Label htmlFor="pod-suspend">Suspend after refusals</Label>
              <Input id="pod-suspend" type="number" min={1} max={20} value={form.podRefusalSuspendCount} onChange={(event) => set("podRefusalSuspendCount", Math.max(1, Math.min(20, Number(event.target.value || 1))))} />
              <p className="text-xs text-zinc-500">A customer who refuses this many parcels loses the option until you restore it.</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900">Approve automatically once the fee is paid</p>
              <p className="mt-0.5 text-xs leading-5 text-zinc-500">Orders under the review limit, from customers in good standing, go straight to sourcing. Others wait for a confirmation call.</p>
            </div>
            <Switch checked={form.podAutoApproveEnabled} onCheckedChange={(value) => set("podAutoApproveEnabled", value)} aria-label="Approve automatically" />
          </div>
        </section>

        <section className="space-y-4 border-t pt-6">
          <div><h3 className="text-sm font-semibold text-zinc-900">Charges</h3><p className="text-xs text-zinc-500">What the customer pays on top of the goods.</p></div>
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Pay on Delivery surcharge</Label>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-zinc-100 p-1">
                {(["flat", "percent"] as const).map((type) => (
                  <button key={type} type="button" onClick={() => set("podSurchargeType", type)} className={cn("rounded-md py-1.5 text-xs font-medium transition", form.podSurchargeType === type ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800")}>{type === "flat" ? "Flat amount (₦)" : "Percent of order (%)"}</button>
                ))}
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{form.podSurchargeType === "flat" ? "₦" : "%"}</span>
                <Input type="number" min={0} step={form.podSurchargeType === "flat" ? 100 : 0.5} className="pl-7" value={form.podSurchargeType === "flat" ? String(form.podSurchargeValue / 100) : String(form.podSurchargeValue)} onChange={(event) => set("podSurchargeValue", form.podSurchargeType === "flat" ? Math.round(Number(event.target.value || 0) * 100) : Number(event.target.value || 0))} aria-label="Surcharge amount" />
              </div>
              <p className="text-xs text-zinc-500">Paid online with the delivery fee. Percent is of the order subtotal (max 50%).</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vat">VAT on products</Label>
              <div className="relative">
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                <Input id="vat" type="number" min={0} max={30} step={0.5} className="pr-7" value={String(form.vatRatePercent)} onChange={(event) => set("vatRatePercent", Number(event.target.value || 0))} />
              </div>
              <p className="text-xs text-zinc-500">Applies to every order (Nigeria&apos;s standard rate is 7.5%). The app updates straight away.</p>
            </div>
          </div>
        </section>

        {example ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Example: a {naira(example.subtotal)} order</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg bg-white/70 p-3"><p className="text-xs text-amber-800">Pay now online</p><p className="text-lg font-semibold">{naira(example.feeNow)}</p><p className="text-xs text-amber-800">Delivery {naira(form.defaultDeliveryFeeMinor)} + surcharge {naira(example.surcharge)}</p></div>
              <div className="rounded-lg bg-white/70 p-3"><p className="text-xs text-amber-800">Pay at the door</p><p className="text-lg font-semibold">{naira(example.atDoor)}</p><p className="text-xs text-amber-800">Goods + {form.vatRatePercent}% VAT {naira(example.vat)}</p></div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 border-t pt-5 sm:grid-cols-[1fr_auto] sm:items-start">
          <div className="space-y-2">
            <Label htmlFor="pod-reason">Reason (audit log)</Label>
            <Input id="pod-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Why are you changing this?" />
            {dirty ? <p className="text-xs text-amber-700">Unsaved: {Object.keys(changes).length} change{Object.keys(changes).length === 1 ? "" : "s"}.</p> : null}
          </div>
          <Button variant="brand" onClick={() => void save()} disabled={saving || !dirty}>{saving ? <HookLoader size="button" label="Saving..." /> : <><Save size={15} /> Save changes</>}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
