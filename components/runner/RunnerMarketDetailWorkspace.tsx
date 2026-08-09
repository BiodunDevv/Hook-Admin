"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3, Package, Plus, ReceiptText, UserRound, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HookLoader } from "@/components/shared/HookLoader";
import { QueryState } from "@/components/shared/QueryState";
import { useApiQuery } from "@/lib/query";
import { MarketVendorSheet } from "@/components/runner/MarketVendorSheet";
import { VendorCollectionSheet } from "@/components/runner/VendorCollectionSheet";
import { MarketImage } from "@/components/markets/MarketImage";

type Vendor = { id?: string; publicId: string; businessName: string; contactName: string; phone: string; status: string; paymentProfile?: { method?: string; accountNumberLast4?: string | null } };
type Submission = { publicId: string; basicTitle: string; status: string; marketVendorId?: string; marketVendorName?: string };
type Collection = { publicId: string; productTitleSnapshot: string; quantity: number; actualCostMinor: number; paymentStatus: string; marketVendorName?: string; collectedAt?: string };
type Detail = { market: { publicId?: string; id?: string; name: string; address?: string; imageUrl?: string }; vendors: Vendor[]; products: Array<{ publicId: string; title: string; status: string; availabilityStatus?: string; sourceMarketVendorId?: string; marketVendorName?: string }>; submissions: Submission[]; collections?: Collection[]; summary?: { vendors: number; assignedRunners: number; products: number; pendingAvailability: number; collections?: number } };

const label = (value?: string) => String(value || "-").replaceAll("_", " ");

export function RunnerMarketDetailWorkspace({ id }: { id: string }) {
  const query = useApiQuery<Detail>(["runner", "market", id], `/runner/markets/${id}`);
  const [vendorOpen, setVendorOpen] = useState(false);
  const [collectionSubmission, setCollectionSubmission] = useState<Submission | null>(null);
  const detail = query.data;
  if (query.isLoading) return <div className="grid min-h-80 place-items-center"><HookLoader label="Loading Market operations" /></div>;
  if (query.isError || !detail) return <QueryState error={query.error} errorTitle="Market operations could not load" onRetry={() => void query.refetch()} />;

  const vendorMap = new Map(detail.vendors.map((vendor) => [vendor.id || vendor.publicId, vendor.businessName]));
  const marketId = detail.market.publicId || detail.market.id || id;
  const metrics: Array<[string, number, LucideIcon]> = [
    ["Suppliers", detail.summary?.vendors ?? detail.vendors.length, UserRound],
    ["Products", detail.summary?.products ?? detail.products.length, Package],
    ["Availability checks", detail.summary?.pendingAvailability ?? 0, Clock3],
    ["Assignments", detail.summary?.assignedRunners ?? 0, CheckCircle2],
  ];

  return (
    <div className="space-y-5 pb-24">
      <Link href="/runner/markets" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Assigned Markets</Link>
      <Card className="overflow-hidden rounded-xl shadow-none">
        <div className="relative h-44 bg-muted">
          <MarketImage src={detail.market.imageUrl} alt={`${detail.market.name} market`} className="size-full" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-5 pb-5 pt-12 text-white"><p className="text-xs uppercase tracking-[0.16em] text-white/75">Runner Market</p><h1 className="mt-1 text-2xl font-semibold">{detail.market.name}</h1><p className="mt-1 text-sm text-white/85">{detail.market.address || "Address pending"}</p></div>
        </div>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{metrics.map(([name, value, Icon]) => <div key={name} className="rounded-lg bg-muted/40 px-3 py-2"><p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Icon className="size-3.5" />{name}</p><p className="mt-1 text-lg font-semibold">{value}</p></div>)}</div>
          <Button variant="brand" onClick={() => setVendorOpen(true)}><Plus /> Add supplier</Button>
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="rounded-xl shadow-none"><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">Market suppliers</CardTitle><Badge variant="outline">{detail.vendors.length}</Badge></CardHeader><CardContent className="p-0">{detail.vendors.length ? detail.vendors.map((vendor) => <div key={vendor.publicId} className="flex items-center justify-between gap-3 border-t p-4"><div className="min-w-0"><p className="truncate font-medium">{vendor.businessName}</p><p className="mt-1 truncate text-xs text-muted-foreground">{vendor.contactName} · {vendor.phone}</p><p className="mt-1 text-xs text-muted-foreground">Payment: {label(vendor.paymentProfile?.method)}{vendor.paymentProfile?.accountNumberLast4 ? ` · •••• ${vendor.paymentProfile.accountNumberLast4}` : ""}</p></div><Badge variant={vendor.status === "active" ? "default" : "secondary"}>{label(vendor.status)}</Badge></div>) : <p className="p-8 text-center text-sm text-muted-foreground">No suppliers tracked in this Market yet.</p>}</CardContent></Card>
        <Card className="rounded-xl shadow-none"><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">Captured products</CardTitle><Button variant="ghost" size="sm" asChild><Link href="/runner/submissions/new">New submission</Link></Button></CardHeader><CardContent className="p-0">{detail.products.length ? detail.products.map((product) => <div key={product.publicId} className="flex items-center justify-between gap-3 border-t p-4"><div className="min-w-0"><p className="truncate font-medium">{product.title}</p><p className="mt-1 text-xs text-muted-foreground">Source supplier: {product.marketVendorName || vendorMap.get(product.sourceMarketVendorId || "") || "Linked on submission"}</p></div><Badge variant={product.availabilityStatus === "unconfirmed" ? "outline" : "secondary"}>{label(product.availabilityStatus || product.status)}</Badge></div>) : <p className="p-8 text-center text-sm text-muted-foreground">No approved products have been captured from this Market.</p>}</CardContent></Card>
      </div>
      <Card className="rounded-xl shadow-none"><CardHeader><CardTitle className="text-base">Recent submissions</CardTitle></CardHeader><CardContent className="p-0">{detail.submissions.length ? detail.submissions.map((submission) => <div key={submission.publicId} className="flex items-center justify-between gap-3 border-t p-4"><Link href={`/runner/submissions/${submission.publicId}`} className="min-w-0 flex-1 hover:underline"><p className="truncate font-medium">{submission.basicTitle}</p><p className="mt-1 text-xs text-muted-foreground">Supplier: {submission.marketVendorName || vendorMap.get(submission.marketVendorId || "") || "Not linked"}</p></Link><div className="flex items-center gap-2"><Badge variant="outline">{label(submission.status)}</Badge>{submission.marketVendorId ? <Button size="sm" variant="outline" onClick={() => setCollectionSubmission(submission)}><ReceiptText /> Record collection</Button> : null}</div></div>) : <p className="p-8 text-center text-sm text-muted-foreground">No submissions for this Market yet.</p>}</CardContent></Card>
      <Card className="rounded-xl shadow-none"><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">Recent supplier collections</CardTitle><Badge variant="outline">{detail.summary?.collections ?? detail.collections?.length ?? 0}</Badge></CardHeader><CardContent className="p-0">{detail.collections?.length ? detail.collections.map((collection) => <div key={collection.publicId} className="flex flex-wrap items-center justify-between gap-3 border-t p-4"><div><p className="font-medium">{collection.productTitleSnapshot}</p><p className="mt-1 text-xs text-muted-foreground">{collection.marketVendorName || "Market supplier"} · Quantity {collection.quantity}</p></div><div className="text-right"><p className="font-semibold">₦{(collection.actualCostMinor / 100).toLocaleString("en-NG")}</p><p className="mt-1 text-xs text-muted-foreground">Payment {label(collection.paymentStatus)}</p></div></div>) : <p className="p-8 text-center text-sm text-muted-foreground">No collections have been recorded for this Market.</p>}</CardContent></Card>
      <MarketVendorSheet key={`${marketId}-${vendorOpen ? "open" : "closed"}`} marketId={marketId} marketName={detail.market.name} open={vendorOpen} onClose={() => setVendorOpen(false)} onSuccess={() => void query.refetch()} />
      <VendorCollectionSheet key={collectionSubmission?.publicId || "collection-closed"} submission={collectionSubmission} open={Boolean(collectionSubmission)} onClose={() => setCollectionSubmission(null)} onSuccess={() => void query.refetch()} />
    </div>
  );
}
