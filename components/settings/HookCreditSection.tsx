"use client";

import { useState } from "react";
import { Coins, Gift, Percent, Save, ShoppingBag, Users } from "lucide-react";
import { toast } from "sonner";
import { HookLoader } from "@/components/shared/HookLoader";
import { QueryState } from "@/components/shared/QueryState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { apiPatch } from "@/lib/api";
import { useApiQuery } from "@/lib/query";

type CreditSettings = {
  orderEarnEnabled: boolean;
  orderEarnPercent: number;
  orderEarnMaxMinor: number;
  creditSpendCapPercent: number;
  welcomeBonusMinor: number;
  referralSignupBonusMinor: number;
  referralReferrerBonusMinor: number;
};

type Draft = {
  earnEnabled: boolean;
  earnPercent: string;
  earnMax: string;
  spendCap: string;
  welcome: string;
  referralFriend: string;
  referralReferrer: string;
};

const naira = (value: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 }).format(value);
const toDraft = (data: CreditSettings): Draft => ({
  earnEnabled: data.orderEarnEnabled,
  earnPercent: String(data.orderEarnPercent),
  earnMax: String(data.orderEarnMaxMinor / 100),
  spendCap: String(data.creditSpendCapPercent),
  welcome: String(data.welcomeBonusMinor / 100),
  referralFriend: String(data.referralSignupBonusMinor / 100),
  referralReferrer: String(data.referralReferrerBonusMinor / 100),
});

function Field({ id, label, hint, prefix, suffix, value, onChange }: { id: string; label: string; hint: string; prefix?: string; suffix?: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {prefix ? <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{prefix}</span> : null}
        <Input
          id={id}
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/[^\d.]/g, ""))}
          className={`tabular-nums ${prefix ? "pl-7" : ""} ${suffix ? "pr-9" : ""}`}
        />
        {suffix ? <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{suffix}</span> : null}
      </div>
      <p className="text-xs leading-5 text-muted-foreground">{hint}</p>
    </div>
  );
}

function Group({ icon: Icon, title, description, children }: { icon: React.ElementType; title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="gap-0 overflow-hidden border-zinc-200 py-0 shadow-sm">
      <CardHeader className="border-b px-5 py-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-base"><Icon className="size-5 text-brand-gold" /> {title}</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-5 p-5 sm:p-6">{children}</CardContent>
    </Card>
  );
}

/** Admin control of Hook credit: what customers earn on orders, spend, and get for referrals. */
export function HookCreditSection() {
  const query = useApiQuery<CreditSettings>(["commerce", "credit-settings"], "/admin/commerce/hook-coin-settings");
  const [edits, setEdits] = useState<Partial<Draft>>({});
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const base = query.data ? toDraft(query.data) : undefined;
  const draft = base ? { ...base, ...edits } : undefined;
  const set = (key: keyof Draft) => (value: string) => setEdits((current) => ({ ...current, [key]: value }));
  const dirty = Boolean(base && Object.keys(edits).some((key) => edits[key as keyof Draft] !== base[key as keyof Draft]));

  async function save() {
    if (!draft) return;
    if (reason.trim().length < 5) return toast.error("Add a short audit reason");
    const num = (value: string) => Number(value);
    const percent = num(draft.earnPercent);
    const cap = num(draft.spendCap);
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) return toast.error("The earn rate must be between 0 and 100%");
    if (!Number.isFinite(cap) || cap < 0 || cap > 100 || !Number.isInteger(cap)) return toast.error("The spend cap must be a whole number from 0 to 100%");
    const amounts = [draft.earnMax, draft.welcome, draft.referralFriend, draft.referralReferrer].map(num);
    if (amounts.some((value) => !Number.isFinite(value) || value < 0)) return toast.error("Amounts must be zero or more");
    setSaving(true);
    try {
      await apiPatch("/admin/commerce/hook-coin-settings", {
        orderEarnEnabled: draft.earnEnabled,
        orderEarnPercent: percent,
        orderEarnMaxMinor: Math.round(amounts[0] * 100),
        creditSpendCapPercent: cap,
        welcomeBonusMinor: Math.round(amounts[1] * 100),
        referralSignupBonusMinor: Math.round(amounts[2] * 100),
        referralReferrerBonusMinor: Math.round(amounts[3] * 100),
        reason: reason.trim(),
      });
      toast.success("Hook credit settings saved. Customers see them straight away.");
      setEdits({});
      setReason("");
      await query.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Could not save Hook credit settings");
    } finally {
      setSaving(false);
    }
  }

  if (query.isLoading) return <div className="grid min-h-60 place-items-center"><HookLoader label="Loading Hook credit settings" /></div>;
  if (query.isError || !draft) return <QueryState error={query.error} errorTitle="Hook credit settings could not load" onRetry={() => void query.refetch()} />;

  const sample = 50_000;
  const rawEarn = draft.earnEnabled ? (sample * Number(draft.earnPercent || 0)) / 100 : 0;
  const maxEarn = Number(draft.earnMax || 0);
  const earned = maxEarn > 0 ? Math.min(rawEarn, maxEarn) : rawEarn;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Coins className="size-5 text-brand-gold" /> Hook credit</h2>
        <p className="text-sm text-muted-foreground">The credit customers earn, spend and are given. Changes reach the app in real time.</p>
      </div>

      <Group icon={ShoppingBag} title="Earning on orders" description="Credit added to a customer's wallet after an order is paid.">
        <div className="flex items-center justify-between rounded-lg border bg-zinc-50 p-3">
          <div>
            <p className="text-sm font-medium">Reward customers for orders</p>
            <p className="text-xs text-muted-foreground">Turn off to stop earning on new orders.</p>
          </div>
          <Switch checked={draft.earnEnabled} onCheckedChange={(value) => setEdits((current) => ({ ...current, earnEnabled: value }))} aria-label="Reward customers for orders" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="earn-percent" label="Earn rate" suffix="%" value={draft.earnPercent} onChange={set("earnPercent")} hint="Share of the order's item total given back as credit." />
          <Field id="earn-max" label="Maximum per order" prefix="₦" value={draft.earnMax} onChange={set("earnMax")} hint="Caps what one order can earn. Use 0 for no cap." />
        </div>
        <p className="rounded-lg bg-zinc-50 px-3 py-2 text-sm text-muted-foreground">
          {draft.earnEnabled ? <>A {naira(sample)} order earns the customer <span className="font-semibold text-foreground">{naira(earned)}</span> in credit.</> : "Earning is off, so orders earn nothing."}
        </p>
      </Group>

      <Group icon={Percent} title="Spending" description="How much of an order credit is allowed to pay for.">
        <div className="max-w-xs">
          <Field id="spend-cap" label="Spend cap" suffix="%" value={draft.spendCap} onChange={set("spendCap")} hint="The most of an order's item total that credit can cover." />
        </div>
      </Group>

      <Group icon={Gift} title="Welcome credit" description="Given to every new customer when they create an account.">
        <div className="max-w-xs">
          <Field id="welcome" label="Welcome credit" prefix="₦" value={draft.welcome} onChange={set("welcome")} hint="Use 0 to give nothing." />
        </div>
      </Group>

      <Group icon={Users} title="Referrals" description="Rewards when a customer invites a friend with their code. New rates apply to referrals made from now on.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="ref-friend" label="New customer gets" prefix="₦" value={draft.referralFriend} onChange={set("referralFriend")} hint="Given when a friend signs up with a referral code." />
          <Field id="ref-referrer" label="Referrer gets" prefix="₦" value={draft.referralReferrer} onChange={set("referralReferrer")} hint="Given once that friend completes their first order." />
        </div>
      </Group>

      <Card className="gap-0 overflow-hidden border-zinc-200 py-0 shadow-sm">
        <CardContent className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-5">
          <div className="space-y-2">
            <Label htmlFor="credit-reason">Audit reason</Label>
            <Input id="credit-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Why are the rates changing?" />
          </div>
          <Button variant="brand" disabled={saving || !dirty} onClick={() => void save()}>
            {saving ? <HookLoader size="button" /> : <><Save /> Save changes</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
