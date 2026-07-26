"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, Pause, Radio, Save, Sparkles } from "lucide-react";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { money, type CommercialProduct } from "@/lib/catalog";
import { useApiQuery } from "@/lib/query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function CommercialProductPage() {
  const { id } = useParams<{ id: string }>();
  const query = useApiQuery<CommercialProduct>(["admin", "commercial", id], `/admin/commercial/products/${id}`);
  const [pending, setPending] = useState("");
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  if (query.isLoading) return <div className="grid min-h-80 place-items-center"><HookLoader label="Loading commercial product" /></div>;
  if (query.isError || !query.data) return <p className="p-4 text-sm text-destructive">Commercial product not found or outside your scope.</p>;
  const product = query.data;

  async function mutate(label: string, request: () => Promise<unknown>) {
    setPending(label);
    try { await request(); toast.success("Commercial product updated"); await query.refetch(); }
    catch (error) { toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Change could not be saved"); }
    finally { setPending(""); }
  }

  function contentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
  return <div className="p-2 md:p-4"><PageHeader title={product.title} description={product.publicId} actions={<><CatalogStatusBadge status={product.status} /><Button variant="outline" onClick={() => void openPreview()} disabled={Boolean(pending)}>{pending === "preview" ? <HookLoader size="button" /> : <><Eye /> Preview</>}</Button>{product.status === "published" ? <Button variant="outline" onClick={() => void lifecycle("pause")} disabled={Boolean(pending)}><Pause /> Pause</Button> : <Button className="bg-[#FFC809] text-black hover:bg-[#f0bb00]" onClick={() => void lifecycle("publish")} disabled={Boolean(pending)}><Radio /> Publish</Button>}</>} />
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="rounded-lg shadow-none"><CardHeader><CardTitle className="text-base">Customer content</CardTitle></CardHeader><CardContent><form onSubmit={contentSubmit}><FieldGroup><Field><FieldLabel>Title</FieldLabel><Input name="title" defaultValue={product.title} /></Field><Field><FieldLabel>Slug</FieldLabel><Input name="slug" defaultValue={product.slug} /></Field><Field><FieldLabel>Description</FieldLabel><Textarea name="description" defaultValue={product.description} className="min-h-32" /></Field><Field><FieldLabel>Availability note</FieldLabel><Input name="availabilityNote" defaultValue="" /></Field><Button disabled={Boolean(pending)}>{pending === "content" ? <HookLoader size="button" /> : <><Save /> Save content</>}</Button></FieldGroup></form></CardContent></Card>
      <div className="space-y-4">
        <Card className="rounded-lg shadow-none"><CardHeader><CardTitle className="text-base">Commercial pricing</CardTitle></CardHeader><CardContent><form onSubmit={pricingSubmit}><FieldGroup><div className="grid gap-3 sm:grid-cols-3"><Field><FieldLabel>Base price</FieldLabel><Input name="basePrice" type="number" step="0.01" defaultValue={(product.pricing?.basePriceMinor || 0) / 100} /></Field><Field><FieldLabel>Hook price</FieldLabel><Input name="sellingPrice" type="number" step="0.01" defaultValue={(product.pricing?.sellingPriceMinor || 0) / 100} /></Field><Field><FieldLabel>Discount</FieldLabel><Input name="discount" type="number" step="0.01" defaultValue={(product.pricing?.discountMinor || 0) / 100} /></Field></div><div className="grid grid-cols-3 gap-2 rounded-md bg-muted p-3 text-xs"><Metric label="Effective" value={money(product.pricing?.effectivePriceMinor)} /><Metric label="Margin" value={money(product.pricing?.marginMinor)} /><Metric label="Margin %" value={`${product.pricing?.marginPercentage || 0}%`} /></div><Field><FieldLabel>Audit reason</FieldLabel><Input name="reason" placeholder="Why this price is approved" required minLength={5} /></Field><Button disabled={Boolean(pending)}>{pending === "pricing" ? <HookLoader size="button" /> : <><Save /> Save pricing</>}</Button></FieldGroup></form></CardContent></Card>
        <Card className="rounded-lg shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="size-4" /> Negotiation rules</CardTitle></CardHeader><CardContent><form onSubmit={rulesSubmit}><FieldGroup><Field orientation="horizontal"><FieldLabel>Enable negotiation</FieldLabel><Switch name="enabled" defaultChecked={product.negotiationRules?.enabled} /></Field><div className="grid gap-3 sm:grid-cols-2"><Field><FieldLabel>Approved floor</FieldLabel><Input name="floor" type="number" step="0.01" defaultValue={(product.negotiationRules?.minimumNegotiablePriceMinor || 0) / 100} /></Field><Field><FieldLabel>Maximum discount</FieldLabel><Input name="maximumDiscount" type="number" step="0.01" defaultValue={(product.negotiationRules?.maximumDiscountMinor || 0) / 100} /></Field></div><p className="text-xs text-muted-foreground">Hook allows exactly three customer offers. Azure writes the response, but the Pricing Engine owns every decision.</p><Field><FieldLabel>Audit reason</FieldLabel><Input name="reason" placeholder="Why these boundaries are approved" required minLength={5} /></Field><Button disabled={Boolean(pending)}>{pending === "rules" ? <HookLoader size="button" /> : <><Save /> Save rules</>}</Button></FieldGroup></form></CardContent></Card>
      </div>
    </div>
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
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><p className="text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>;
}
