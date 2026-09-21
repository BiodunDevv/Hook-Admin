"use client";

import { FormEvent, useState } from "react";
import { CalendarClock, CheckCircle2, PauseCircle, PlayCircle, ScaleIcon, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { HookLoader } from "@/components/shared/HookLoader";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useApiPost } from "@/lib/query";
import { money } from "@/lib/admin-utils";
import { cn } from "@/lib/utils";

interface NegotiationRules {
  enabled: boolean;
  minimumNegotiablePriceMinor?: number;
  maximumDiscountMinor?: number;
  maximumCustomerOffers: number;
  acceptedQuoteExpiryMinutes: number;
}

interface ProductLifecycleData {
  id: string;
  status: string;
  catalogVersion?: number;
  sellingPriceMinor?: number;
  basePriceMinor?: number;
  negotiationRules?: NegotiationRules;
  availabilityStatus?: string;
  availabilityCheckDueAt?: string;
  availabilityCheckNote?: string;
  lastAvailabilityConfirmedAt?: string;
}

const MIN_REASON = 5;
const QUICK_REASONS: Record<string, string[]> = {
  lifecycle: ["Stock confirmed with supplier", "Price or details updated", "Supplier out of stock", "Quality issue reported"],
  rules: ["Adjusting margin", "Seasonal promotion", "Competitor pricing", "Supplier price change"],
  availability: ["Supplier stock unclear", "Customer reported unavailable", "Routine recheck", "Price changed at market"],
};

const shortDate = (value?: string) => (value ? new Date(value).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "Not yet");

/** Reason field with one-tap suggestions; every action here is audited. */
function ReasonField({ id, value, onChange, kind, placeholder }: { id: string; value: string; onChange: (value: string) => void; kind: keyof typeof QUICK_REASONS; placeholder: string }) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>Reason <span className="font-normal text-muted-foreground">(recorded in the audit log)</span></FieldLabel>
      <Textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-16" maxLength={1000} />
      <div className="flex flex-wrap gap-1.5">
        {QUICK_REASONS[kind].map((reason) => (
          <button key={reason} type="button" onClick={() => onChange(reason)} className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-900">
            {reason}
          </button>
        ))}
      </div>
      {value.trim().length > 0 && value.trim().length < MIN_REASON ? <FieldDescription>Add a little more detail (at least {MIN_REASON} characters).</FieldDescription> : null}
    </Field>
  );
}

function StatTile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-muted/30 px-3.5 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1.5 text-sm font-medium text-foreground">{children}</div>
    </div>
  );
}

/**
 * Publish, negotiate and availability controls for one live product. Each tab
 * shows the current state first, then the action with an audited reason; every
 * change is version-checked so two admins cannot overwrite each other.
 */
export function ProductLifecycleWorkspace({ product, onSaved }: { product: ProductLifecycleData; onSaved: () => void }) {
  const [reason, setReason] = useState("");
  const [rulesEnabled, setRulesEnabled] = useState(product.negotiationRules?.enabled || false);

  const version = product.catalogVersion || 1;
  const publish = useApiPost<unknown, { reason: string; version: number }>(`/admin/products/${product.id}/publish`, ["admin", "products"], { successMessage: "Product published" });
  const pause = useApiPost<unknown, { reason: string; version: number }>(`/admin/products/${product.id}/pause`, ["admin", "products"], { successMessage: "Product paused" });
  const unpublish = useApiPost<unknown, { reason: string; version: number }>(`/admin/products/${product.id}/unpublish`, ["admin", "products"], { successMessage: "Product unpublished" });
  const availabilityCheck = useApiPost<unknown, { reason: string; version: number }>(`/admin/products/${product.id}/availability-check`, ["admin", "products"], { successMessage: "Availability check requested" });

  const pending = publish.isPending || pause.isPending || unpublish.isPending;
  const reasonOk = reason.trim().length >= MIN_REASON;
  const live = product.status === "published";

  function runLifecycle(action: "publish" | "pause" | "unpublish") {
    if (!reasonOk) return;
    const mutation = action === "publish" ? publish : action === "pause" ? pause : unpublish;
    mutation.mutate({ reason: reason.trim(), version }, { onSuccess: () => { setReason(""); onSaved(); } });
  }

  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold">Manage product</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Change what customers see, how negotiation behaves and when stock is rechecked.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" /> Audited · version {version}
        </span>
      </div>

      <Tabs defaultValue="lifecycle" className="gap-0" onValueChange={() => setReason("")}>
        <div className="border-b bg-muted/20 px-5 py-3">
          <TabsList className="h-auto gap-1.5 p-1">
            <TabsTrigger value="lifecycle" className="px-3.5 py-1.5"><PlayCircle className="size-4" /> Publish &amp; status</TabsTrigger>
            <TabsTrigger value="negotiation" className="px-3.5 py-1.5"><ScaleIcon className="size-4" /> Negotiation</TabsTrigger>
            <TabsTrigger value="availability" className="px-3.5 py-1.5"><CalendarClock className="size-4" /> Availability</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="lifecycle" className="space-y-5 p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Current status"><StatusBadge status={product.status} /></StatTile>
            <StatTile label="Visible to customers">
              <span className={cn("inline-flex items-center gap-1.5", live ? "text-emerald-600" : "text-muted-foreground")}>
                {live ? <><CheckCircle2 className="size-4" /> Yes, live on Hook</> : "No"}
              </span>
            </StatTile>
            <StatTile label="Last confirmed">{shortDate(product.lastAvailabilityConfirmedAt)}</StatTile>
          </div>
          <PermissionGuard permission="catalog.product.publish">
            <div className="space-y-4 rounded-lg border p-4">
              <ReasonField id="lifecycle-reason" kind="lifecycle" value={reason} onChange={setReason} placeholder="Why is this status changing?" />
              <div className="flex flex-wrap gap-2">
                {!live ? (
                  <Button type="button" variant="brand" size="sm" disabled={pending || !reasonOk} onClick={() => runLifecycle("publish")}>
                    {publish.isPending ? <HookLoader size="button" /> : <><PlayCircle /> Publish to customers</>}
                  </Button>
                ) : (
                  <Button type="button" variant="outline" size="sm" disabled={pending || !reasonOk} onClick={() => runLifecycle("pause")}>
                    {pause.isPending ? <HookLoader size="button" /> : <><PauseCircle /> Pause</>}
                  </Button>
                )}
                {["published", "paused"].includes(product.status) ? (
                  <Button type="button" variant="outline" size="sm" className="text-destructive" disabled={pending || !reasonOk} onClick={() => runLifecycle("unpublish")}>
                    {unpublish.isPending ? <HookLoader size="button" /> : <><XCircle /> Unpublish</>}
                  </Button>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">Pause hides the product temporarily. Unpublish takes it off Hook until you publish it again.</p>
            </div>
          </PermissionGuard>
        </TabsContent>

        <TabsContent value="negotiation" className="p-5">
          <NegotiationRulesForm productId={product.id} version={version} rules={product.negotiationRules} enabled={rulesEnabled} onEnabledChange={setRulesEnabled} onSaved={onSaved} sellingPriceMinor={product.sellingPriceMinor} basePriceMinor={product.basePriceMinor} />
        </TabsContent>

        <TabsContent value="availability" className="space-y-5 p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Availability"><StatusBadge status={product.availabilityStatus || "unconfirmed"} /></StatTile>
            <StatTile label="Last confirmed">{shortDate(product.lastAvailabilityConfirmedAt)}</StatTile>
            <StatTile label="Next check due">{shortDate(product.availabilityCheckDueAt)}</StatTile>
          </div>
          {product.availabilityCheckNote ? <p className="rounded-lg border border-dashed px-3.5 py-3 text-sm text-muted-foreground">{product.availabilityCheckNote}</p> : null}
          <PermissionGuard permission="catalog.availability.manage">
            <div className="space-y-4 rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Ask the market associate to confirm this item is still available and correctly priced.</p>
              <ReasonField id="availability-reason" kind="availability" value={reason} onChange={setReason} placeholder="Why does this product need re-confirmation?" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={availabilityCheck.isPending || !reasonOk}
                onClick={() => availabilityCheck.mutate({ reason: reason.trim(), version }, { onSuccess: () => { setReason(""); onSaved(); } })}
              >
                {availabilityCheck.isPending ? <HookLoader size="button" /> : <><CalendarClock /> Request availability check</>}
              </Button>
            </div>
          </PermissionGuard>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

function NegotiationRulesForm({
  productId,
  version,
  rules,
  enabled,
  onEnabledChange,
  onSaved,
  sellingPriceMinor,
  basePriceMinor,
}: {
  productId: string;
  version: number;
  rules?: NegotiationRules;
  enabled: boolean;
  onEnabledChange: (value: boolean) => void;
  onSaved: () => void;
  sellingPriceMinor?: number;
  basePriceMinor?: number;
}) {
  const [reason, setReason] = useState("");
  const [floor, setFloor] = useState(rules?.minimumNegotiablePriceMinor ? String(rules.minimumNegotiablePriceMinor / 100) : "");
  const [maxDiscount, setMaxDiscount] = useState(rules?.maximumDiscountMinor ? String(rules.maximumDiscountMinor / 100) : "");
  const saveRules = useApiPost<unknown, Record<string, unknown>>(`/admin/products/${productId}/negotiation-rules`, ["admin", "products"], { successMessage: "Negotiation rules updated" });
  const price = (sellingPriceMinor || 0) / 100;
  const cost = (basePriceMinor || 0) / 100;
  const floorValue = Number(floor || 0);
  const floorProblem = enabled && floorValue > 0 && ((price && floorValue > price) || (cost && floorValue < cost));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveRules.mutate(
      {
        enabled,
        // The form is in naira; the API stores kobo.
        minimumNegotiablePriceMinor: enabled ? Math.round(floorValue * 100) : undefined,
        maximumDiscountMinor: enabled ? Math.round(Number(maxDiscount || 0) * 100) : undefined,
        reason: reason.trim(),
        version,
      },
      { onSuccess: () => { setReason(""); onSaved(); } },
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3.5">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-background"><ScaleIcon className="size-4 text-muted-foreground" /></span>
          <div>
            <p className="text-sm font-medium text-foreground">AI negotiation</p>
            <p className="text-xs text-muted-foreground">{enabled ? "Customers can haggle within the limits below." : "Customers pay the listed price."}</p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={onEnabledChange} />
      </div>

      {enabled ? (
        <div className="space-y-4 rounded-lg border p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Lowest price the AI may accept (₦)</FieldLabel>
              <Input type="number" min="1" value={floor} onChange={(event) => setFloor(event.target.value)} required />
              <FieldDescription>Between your cost {cost ? money(cost) : "price"} and the Hook price {price ? money(price) : ""}.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel>Largest discount (₦)</FieldLabel>
              <Input type="number" min="0" value={maxDiscount} onChange={(event) => setMaxDiscount(event.target.value)} required />
              <FieldDescription>Off the Hook price, across all offers.</FieldDescription>
            </Field>
          </div>
          {price && floorValue > 0 ? (
            <p className={cn("rounded-md px-3 py-2 text-xs", floorProblem ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700")}>
              {floorProblem
                ? "The lowest price must sit between the cost price and the Hook price."
                : `Customers can negotiate from ${money(price)} down to ${money(floorValue)} (${Math.round(((price - floorValue) / price) * 100)}% off at most).`}
            </p>
          ) : null}
        </div>
      ) : null}

      <PermissionGuard permission="catalog.negotiation_rules.edit">
        <div className="space-y-4 rounded-lg border p-4">
          <ReasonField id="rules-reason" kind="rules" value={reason} onChange={setReason} placeholder="Why are the negotiation rules changing?" />
          <Button type="submit" variant="brand" size="sm" disabled={saveRules.isPending || reason.trim().length < MIN_REASON || Boolean(floorProblem)}>
            {saveRules.isPending ? <HookLoader size="button" /> : "Save negotiation rules"}
          </Button>
        </div>
      </PermissionGuard>
    </form>
  );
}
