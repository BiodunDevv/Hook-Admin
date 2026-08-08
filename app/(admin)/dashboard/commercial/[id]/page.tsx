"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Eye, Pause, Radio, Save, Sparkles } from "lucide-react";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { money, type CommercialProduct } from "@/lib/catalog";
import { useAdminSession, useApiQuery } from "@/lib/query";
import { hasPermission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CatalogStatusBadge } from "@/components/catalog/CatalogStatusBadge";
import { HookLoader } from "@/components/shared/HookLoader";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryState } from "@/components/shared/QueryState";
import { DetailSection } from "@/components/shared/DetailSection";
import { AdminWorkflowSheet } from "@/components/shared/AdminWorkflowSheet";

export default function CommercialProductPage() {
  const { id } = useParams<{ id: string }>();
  const query = useApiQuery<CommercialProduct>(["admin", "commercial", id], `/admin/commercial/products/${id}`);
  const { data: session } = useAdminSession();
  const [pending, setPending] = useState("");
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [availabilityReason, setAvailabilityReason] = useState("");
  const product = query.data;
  const canManageAvailability = hasPermission(session, "catalog.availability.manage");

  async function mutate(label: string, request: () => Promise<unknown>) {
    setPending(label);
    try { await request(); toast.success("Commercial product updated"); await query.refetch(); return true; }
    catch (error) { toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Change could not be saved"); return false; }
    finally { setPending(""); }
  }

  function contentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product) return;
    const data = new FormData(event.currentTarget);
    void mutate("content", () => apiPatch(`/admin/commercial/products/${id}`, {
      title: String(data.get("title")),
      slug: String(data.get("slug")),
      description: String(data.get("description")),
      customerAvailabilityNote: String(data.get("availabilityNote")),
      version: product.catalogVersion,
    }));
  }
  function pricingSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product) return;
    const data = new FormData(event.currentTarget);
    void mutate("pricing", () => apiPatch(`/admin/commercial/products/${id}/pricing`, {
      basePriceMinor: Math.round(Number(data.get("basePrice")) * 100),
      sellingPriceMinor: Math.round(Number(data.get("sellingPrice")) * 100),
      discountMinor: Math.round(Number(data.get("discount")) * 100),
      currency: "NGN",
      reason: String(data.get("reason")),
      version: product.catalogVersion,
    }));
  }
  function rulesSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product) return;
    const data = new FormData(event.currentTarget);
    void mutate("rules", () => apiPatch(`/admin/commercial/products/${id}/negotiation-rules`, {
      enabled: data.get("enabled") === "on",
      minimumNegotiablePriceMinor: Math.round(Number(data.get("floor")) * 100),
      maximumDiscountMinor: Math.round(Number(data.get("maximumDiscount")) * 100),
      maximumCustomerOffers: 3,
      acceptedQuoteExpiryMinutes: 30,
      reason: String(data.get("reason")),
      version: product.catalogVersion,
    }));
  }
  async function lifecycle(action: "publish" | "pause" | "unpublish") {
    if (!product) return;
    await mutate(action, () => apiPost(`/admin/commercial/products/${id}/${action}`, {
      reason: `${action} approved by Commercial`,
      version: product.catalogVersion,
    }));
  }
  async function openPreview() {
    setPending("preview");
    try {
      setPreview(await apiGet<Record<string, unknown>>(`/admin/commercial/products/${id}/preview`));
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Preview could not be generated");
    } finally {
      setPending("");
    }
  }
  async function requestAvailabilityCheck(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product || availabilityReason.trim().length < 3) return;
    const saved = await mutate("availability", () => apiPost(`/admin/commercial/products/${id}/availability-unconfirmed`, {
      reason: availabilityReason.trim(),
      version: product.catalogVersion,
    }));
    if (saved) {
      setAvailabilityOpen(false);
      setAvailabilityReason("");
    }
  }
  return <div className="space-y-5 pb-10"><PageHeader title={product?.title || "Commercial product"} description={product?.publicId || "Commercial catalog editor"} actions={product ? <><CatalogStatusBadge status={product.status} /><Button size="sm" variant="outline" onClick={() => void openPreview()} disabled={Boolean(pending)}>{pending === "preview" ? <HookLoader size="button" /> : <><Eye /> Preview</>}</Button>{canManageAvailability && ["published", "paused"].includes(product.status) ? <Button size="sm" variant="outline" onClick={() => setAvailabilityOpen(true)} disabled={Boolean(pending)}><CalendarClock /> Check availability</Button> : null}{product.status === "published" ? <Button size="sm" variant="outline" onClick={() => void lifecycle("pause")} disabled={Boolean(pending)}><Pause /> Pause</Button> : <Button size="sm" className="bg-[#FFC809] text-black hover:bg-[#f0bb00]" onClick={() => void lifecycle("publish")} disabled={Boolean(pending)}><Radio /> Publish</Button>}</> : null} />
    <QueryState loading={query.isLoading} error={query.error} loadingLabel="Loading commercial product" errorTitle="Commercial product unavailable" onRetry={() => query.refetch()}>
    {product ? <div className="grid items-start gap-4 xl:grid-cols-2">
      <DetailSection title="Customer content" description="Public title, description, and availability messaging."><form onSubmit={contentSubmit}><FieldGroup><Field><FieldLabel>Title</FieldLabel><Input name="title" defaultValue={product.title} /></Field><Field><FieldLabel>Slug</FieldLabel><Input name="slug" defaultValue={product.slug} /></Field><Field><FieldLabel>Description</FieldLabel><Textarea name="description" defaultValue={product.description} className="min-h-32" /></Field><Field><FieldLabel>Availability note</FieldLabel><Input name="availabilityNote" defaultValue="" /></Field><Button className="w-fit" disabled={Boolean(pending)}>{pending === "content" ? <HookLoader size="button" /> : <><Save /> Save content</>}</Button></FieldGroup></form></DetailSection>
      <div className="space-y-4">
        <DetailSection title="Commercial pricing" description="Server-derived customer price, discount, and margin controls."><form onSubmit={pricingSubmit}><FieldGroup><div className="grid gap-3 sm:grid-cols-3"><Field><FieldLabel>Base price</FieldLabel><Input name="basePrice" type="number" step="0.01" defaultValue={(product.pricing?.basePriceMinor || 0) / 100} /></Field><Field><FieldLabel>Hook price</FieldLabel><Input name="sellingPrice" type="number" step="0.01" defaultValue={(product.pricing?.sellingPriceMinor || 0) / 100} /></Field><Field><FieldLabel>Discount</FieldLabel><Input name="discount" type="number" step="0.01" defaultValue={(product.pricing?.discountMinor || 0) / 100} /></Field></div><div className="grid grid-cols-3 gap-2 rounded-md bg-muted p-3 text-xs"><Metric label="Effective" value={money(product.pricing?.effectivePriceMinor)} /><Metric label="Margin" value={money(product.pricing?.marginMinor)} /><Metric label="Margin %" value={`${product.pricing?.marginPercentage || 0}%`} /></div><Field><FieldLabel>Audit reason</FieldLabel><Input name="reason" placeholder="Why this price is approved" required minLength={5} /></Field><Button className="w-fit" disabled={Boolean(pending)}>{pending === "pricing" ? <HookLoader size="button" /> : <><Save /> Save pricing</>}</Button></FieldGroup></form></DetailSection>
        <DetailSection title="Negotiation rules" description="Deterministic pricing boundaries used by the negotiation engine." action={<Sparkles className="size-4 text-violet-600" />}><form onSubmit={rulesSubmit}><FieldGroup><Field orientation="horizontal"><FieldLabel>Enable negotiation</FieldLabel><Switch name="enabled" defaultChecked={product.negotiationRules?.enabled} /></Field><div className="grid gap-3 sm:grid-cols-2"><Field><FieldLabel>Approved floor</FieldLabel><Input name="floor" type="number" step="0.01" defaultValue={(product.negotiationRules?.minimumNegotiablePriceMinor || 0) / 100} /></Field><Field><FieldLabel>Maximum discount</FieldLabel><Input name="maximumDiscount" type="number" step="0.01" defaultValue={(product.negotiationRules?.maximumDiscountMinor || 0) / 100} /></Field></div><p className="text-xs text-muted-foreground">Hook allows exactly three customer offers. Azure writes the response, but the Pricing Engine owns every decision.</p><Field><FieldLabel>Audit reason</FieldLabel><Input name="reason" placeholder="Why these boundaries are approved" required minLength={5} /></Field><Button className="w-fit" disabled={Boolean(pending)}>{pending === "rules" ? <HookLoader size="button" /> : <><Save /> Save rules</>}</Button></FieldGroup></form></DetailSection>
      </div>
    </div> : null}
    </QueryState>
    <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Customer-safe preview</DialogTitle>
          <DialogDescription>
            This is the exact public representation. Internal prices, review notes, and source identities are excluded.
          </DialogDescription>
        </DialogHeader>
        <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs leading-5">
          {JSON.stringify(preview, null, 2)}
        </pre>
      </DialogContent>
    </Dialog>
    <AdminWorkflowSheet open={availabilityOpen} onOpenChange={(open) => { if (!open && pending !== "availability") setAvailabilityOpen(false); }} title="Request availability check" description="This Product will immediately leave the customer catalog until an assigned Runner confirms its supplier availability." footer={<><Button type="button" variant="outline" disabled={pending === "availability"} onClick={() => setAvailabilityOpen(false)}>Cancel</Button><Button type="submit" form="availability-check-form" variant="brand" disabled={pending === "availability" || availabilityReason.trim().length < 3}>{pending === "availability" ? <HookLoader size="button" /> : "Notify Runner"}</Button></>}>
      <form id="availability-check-form" onSubmit={requestAvailabilityCheck} className="space-y-4"><div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">The current public status is preserved. A confirmed Product returns only when its commercial publication rules still pass.</div><Field><FieldLabel>Audit reason</FieldLabel><Textarea value={availabilityReason} onChange={(event) => setAvailabilityReason(event.target.value)} placeholder="Why does this Product need a fresh supplier check?" className="min-h-28" required /></Field></form>
    </AdminWorkflowSheet>
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><p className="text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>;
}
