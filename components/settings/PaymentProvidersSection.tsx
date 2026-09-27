"use client";

import { useState } from "react";
import { CheckCircle2, CreditCard, Save, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { HookLoader } from "@/components/shared/HookLoader";
import { QueryState } from "@/components/shared/QueryState";
import { PaymentProviderMark } from "@/components/payments/PaymentProviderMark";
import { apiPatch } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { cn } from "@/lib/utils";

type Provider = { provider: "paystack" | "monnify"; enabled: boolean; displayOrder: number; isDefault: boolean; configured: boolean; mode: "test" | "live"; reason?: string };
type ProvidersResponse = { providers: Provider[]; updatedAt?: string };

/** Default-first, same order customers actually see it in at checkout — this list has nothing else to sort by. */
function sorted(providers: Provider[]) {
  return [...providers].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
}

/** The subset of a provider row that's actually sent back on save — used to detect unsaved changes. */
function draft(providers: Provider[]) {
  return sorted(providers).map(({ provider, enabled, displayOrder, isDefault }) => ({ provider, enabled, displayOrder, isDefault }));
}

export function PaymentProvidersSection() {
  const query = useApiQuery<ProvidersResponse>(["commerce", "payment-providers"], "/admin/commerce/payment-providers");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  // Keep the editable draft aligned with the server response as it arrives or changes.
  const [prevData, setPrevData] = useState(query.data);
  if (query.data !== prevData) {
    setPrevData(query.data);
    if (query.data) setProviders(query.data.providers);
  }

  const dirty = JSON.stringify(draft(providers)) !== JSON.stringify(query.data ? draft(query.data.providers) : []);

  function update(name: Provider["provider"], patch: Partial<Provider>) {
    setProviders((current) => current.map((provider) => provider.provider === name ? { ...provider, ...patch } : provider));
  }

  function setDefault(name: Provider["provider"]) {
    setProviders((current) => current.map((provider) => ({ ...provider, isDefault: provider.provider === name })));
  }

  async function save() {
    if (reason.trim().length < 5) return toast.error("Add a short audit reason");
    setSaving(true);
    try {
      await apiPatch("/admin/commerce/payment-providers", { providers: draft(providers), reason: reason.trim() });
      toast.success("Payment providers updated");
      setReason("");
      await query.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Could not update payment providers");
    } finally { setSaving(false); }
  }

  function discard() {
    if (query.data) setProviders(query.data.providers);
    setReason("");
  }

  if (query.isLoading) return <div className="grid min-h-60 place-items-center"><HookLoader label="Loading payment providers" /></div>;
  if (query.isError) return <QueryState error={query.error} errorTitle="Payment providers could not load" onRetry={() => void query.refetch()} />;

  return <Card className="gap-0 overflow-hidden border-zinc-200 py-0 shadow-sm">
    <CardHeader className="border-b px-5 py-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-lg"><CreditCard className="size-5 text-brand-gold" /> Payment providers</CardTitle>
        {query.data?.updatedAt && <span className="text-xs text-muted-foreground">Last updated {new Date(query.data.updatedAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</span>}
      </div>
      <p className="text-sm leading-6 text-muted-foreground">The default shows first at checkout and is what a new order uses automatically.</p>
    </CardHeader>
    <CardContent className="space-y-5 p-5 sm:p-6">
      <div className="overflow-hidden rounded-lg border border-zinc-200">
        {sorted(providers).map((provider, index) => (
          <div
            key={provider.provider}
            className={cn(
              "flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:px-5",
              index > 0 && "border-t border-zinc-200",
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <PaymentProviderMark provider={provider.provider} size="lg" />
              <p className="text-xs text-zinc-500">{provider.configured ? "Ready to accept payments" : provider.reason || "Missing configuration"}</p>
            </div>
            <div className="flex items-center justify-between gap-6 sm:justify-end">
              <div className="flex items-center gap-2">
                <Label htmlFor={`${provider.provider}-enabled`} className="text-sm text-zinc-600">Enabled</Label>
                <Switch id={`${provider.provider}-enabled`} checked={provider.enabled} disabled={!provider.configured} onCheckedChange={(enabled) => update(provider.provider, { enabled, isDefault: enabled ? provider.isDefault : false })} />
              </div>
              <button
                type="button"
                disabled={!provider.enabled}
                onClick={() => setDefault(provider.provider)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40",
                  provider.isDefault ? "border-brand-gold bg-brand-gold/10 text-[#8a6900]" : "border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700",
                )}
              >
                <CheckCircle2 size={14} className={provider.isDefault ? "fill-brand-gold text-white" : ""} />
                {provider.isDefault ? "Default" : "Set as default"}
              </button>
            </div>
          </div>
        ))}
      </div>
      {providers.some((provider) => !provider.configured) && <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><TriangleAlert className="mt-0.5 size-4 shrink-0" /> Providers with missing backend credentials cannot be enabled. Credentials are never displayed here.</div>}
      {dirty && (
        <div className="grid gap-4 rounded-lg border bg-zinc-50 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="provider-reason">Audit reason</Label>
            <Input id="provider-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Why are payment options changing?" />
          </div>
          <Button variant="outline" disabled={saving} onClick={discard}>Discard</Button>
          <Button variant="brand" disabled={saving} onClick={() => void save()}>{saving ? <HookLoader size="button" /> : <><Save /> Save changes</>}</Button>
        </div>
      )}
    </CardContent>
  </Card>;
}
