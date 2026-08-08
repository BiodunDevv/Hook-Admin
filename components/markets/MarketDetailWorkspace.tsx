"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock3, Edit3, Eye, MapPin, Power, Users, Package, WalletCards, Phone, Mail, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HookLoader } from "@/components/shared/HookLoader";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryState } from "@/components/shared/QueryState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ImagePreviewDialog } from "@/components/shared/ImagePreviewDialog";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useAdminSession, useApiQuery } from "@/lib/query";
import { apiPost } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { MarketFormDialog } from "./MarketFormDialog";
import { MarketImage } from "./MarketImage";
import { MarketVendorEditSheet } from "./MarketVendorEditSheet";
import { VendorCollectionReconcileSheet, type ReconcileCollection } from "./VendorCollectionReconcileSheet";
import type { MarketRecord, MarketVendorRecord } from "./market-types";

function dateLabel(value?: string | null) {
  return value ? new Date(value).toLocaleString("en-NG") : "Not recorded";
}

function absoluteImageUrl(value?: unknown) {
  const url = String(value || "");
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1").replace(/\/api\/v1\/?$/, "");
  return `${base}${url}`;
}

export function MarketDetailWorkspace() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useAdminSession();
  const [editing, setEditing] = useState(false);
  const [lifecycleOpen, setLifecycleOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [acting, setActing] = useState(false);
  const [activeTab, setActiveTab] = useState("vendors");
  const [editingVendor, setEditingVendor] = useState<MarketVendorRecord | null>(null);
  const [reconcilingCollection, setReconcilingCollection] = useState<ReconcileCollection | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);
  const query = useApiQuery<MarketRecord>(["admin", "market", params.id], `/admin/markets/${params.id}`);
  const market = query.data;
  const canManage = hasPermission(session, "markets.manage");
  const canManageVendors = hasPermission(session, "market.vendors.manage");
  const canReconcilePayments = hasPermission(session, "market.payments.reconcile");

  async function changeLifecycle() {
    if (!market || reason.trim().length < 3) return;
    setActing(true);
    try {
      const suffix = market.status === "active" ? "deactivate" : "activate";
      await apiPost(`/admin/markets/${market.publicId || market.id}/${suffix}`, { reason: reason.trim() });
      toast.success(`Market ${suffix === "activate" ? "activated" : "deactivated"}`);
      setLifecycleOpen(false);
      setReason("");
      await query.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Unable to update market status");
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 p-4 pb-10 md:p-5">
      <PageHeader title={market?.name || "Market details"} description={market?.publicId ? `Market workspace · ${market.publicId}` : "Market workspace"} actions={<div className="flex flex-wrap items-center gap-2"><Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft /> Back</Button>{market?.status ? <StatusBadge status={market.status} /> : null}{market && canManage ? <PermissionGuard permission="markets.manage"><Button variant="outline" size="sm" onClick={() => setEditing(true)}><Edit3 /> Edit</Button></PermissionGuard> : null}{market && canManage ? <PermissionGuard permission="markets.manage"><Button variant={market.status === "active" ? "destructive" : "brand"} size="sm" onClick={() => setLifecycleOpen(true)}><Power /> {market.status === "active" ? "Deactivate" : "Activate"}</Button></PermissionGuard> : null}</div>} />
      <QueryState loading={query.isLoading} error={query.error} loadingLabel="Loading market workspace" errorTitle="Market details unavailable" onRetry={() => query.refetch()}>
        {market ? <>
          <Card className="overflow-hidden rounded-xl shadow-none">
            <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
              <div className="relative min-h-64 bg-muted lg:min-h-80">
                <MarketImage src={market.imageUrl} alt={`${market.name} market`} className="size-full" />
              </div>
              <div className="flex flex-col justify-between gap-6 p-5 md:p-7">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Market operations</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{market.name}</h2>
                  <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0 text-[#b18b00]" />{market.address || "Location not recorded"}</p>
                </div>
                <div className="space-y-5 border-t pt-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Operational context</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">The geography and dispatch relationships used by Hook operations.</p>
                    </div>
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#fff4b8] text-[#806300]"><MapPin className="size-4" /></span>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-5 gap-y-4 text-sm">
                    <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Operation State</dt><dd className="mt-1 font-medium">{market.stateName || market.state?.name || "Not assigned"}</dd></div>
                    <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Operation City</dt><dd className="mt-1 font-medium">{market.cityName || market.city?.name || "Not assigned"}</dd></div>
                    <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Service Zone</dt><dd className="mt-1 font-medium">{market.zoneName || market.zone?.name || "Not assigned"}</dd></div>
                    <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Dispatch Hub</dt><dd className="mt-1 truncate font-medium">{market.hubName || market.hub?.name || "Not assigned"}</dd></div>
                    <div className="col-span-2"><dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Address</dt><dd className="mt-1 font-medium">{market.address || "Not recorded"}</dd></div>
                    <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Coordinates</dt><dd className="mt-1 font-medium">{market.coordinates?.lat !== undefined && market.coordinates?.lng !== undefined ? `${market.coordinates.lat}, ${market.coordinates.lng}` : "Not recorded"}</dd></div>
                    <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Market ID</dt><dd className="mt-1 font-mono text-xs font-medium">{market.publicId || market.id}</dd></div>
                  </dl>
                  <div className="grid gap-3 border-t pt-4 sm:grid-cols-2">
                    <div><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Market notes</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{market.notes || "No internal notes have been added for this market."}</p></div>
                    <div><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Dispatch readiness</p><p className="mt-1 font-medium">{market.hubName || market.hub?.name ? "Connected to a Dispatch Hub" : "Awaiting Hub assignment"}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{market.hubName || market.hub?.name || "Assign a compatible Hub before this market is used for fulfilment operations."}</p></div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              [Users, "Vendors", market.summary?.vendors ?? market.vendors?.length ?? 0, "bg-[#fff8dc] text-[#8a6900]"],
              [Users, "Assigned Runners", market.summary?.assignedRunners ?? market.runners?.length ?? 0, "bg-blue-50 text-blue-700"],
              [Package, "Products", market.summary?.products ?? market.products?.length ?? 0, "bg-emerald-50 text-emerald-700"],
              [AlertTriangle, "Availability checks", market.summary?.pendingAvailability ?? 0, "bg-amber-50 text-amber-700"],
              [WalletCards, "Collections", market.summary?.collections ?? market.collections?.length ?? 0, "bg-violet-50 text-violet-700"],
            ].map(([Icon, label, value, tone]) => {
              const MetricIcon = Icon as typeof Users;
              return <Card key={String(label)} className="rounded-xl shadow-none"><CardContent className="p-4"><span className={`grid size-8 place-items-center rounded-lg ${tone}`}><MetricIcon className="size-4" /></span><p className="mt-3 text-2xl font-semibold tabular-nums">{String(value)}</p><p className="text-xs text-muted-foreground">{String(label)}</p></CardContent></Card>;
            })}
          </div>
          <div className="overflow-hidden rounded-xl border bg-background shadow-none">
            <div className="flex gap-1 overflow-x-auto border-b p-2">
              {[['vendors', 'Vendors'], ['products', 'Products'], ['runners', 'Runners'], ['collections', 'Collections']].map(([value, label]) => <button key={value} type="button" onClick={() => setActiveTab(value)} className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${activeTab === value ? "bg-[#fff4b8] text-[#6d5600]" : "text-muted-foreground hover:bg-muted"}`}>{label}</button>)}
            </div>
            {activeTab === "vendors" ? <VendorList vendors={market.vendors || []} canManage={canManageVendors} onEdit={setEditingVendor} /> : null}
            {activeTab === "products" ? <ProductList products={market.products || []} onPreview={(src, alt) => setPreviewImage({ src, alt })} /> : null}
            {activeTab === "runners" ? <RunnerList runners={market.runners || []} assignments={market.assignments || []} /> : null}
            {activeTab === "collections" ? <CollectionList collections={market.collections || []} vendors={market.vendors || []} canReconcile={canReconcilePayments} onReconcile={setReconcilingCollection} /> : null}
          </div>
          <Card className="rounded-xl shadow-none">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-lg bg-zinc-100 text-zinc-700"><Clock3 className="size-4" /></span><div><p className="font-medium">Record activity</p><p className="mt-1 text-xs text-muted-foreground">Updated {dateLabel(market.updatedAt)}</p></div></div>
              <p className="font-mono text-xs text-muted-foreground">{market.publicId || market.id}</p>
            </CardContent>
          </Card>
        </> : null}
      </QueryState>
      {market ? <MarketFormDialog key={`${market.publicId || market.id}-${editing ? "open" : "closed"}`} open={editing} market={market} onClose={() => setEditing(false)} onSuccess={() => void query.refetch()} /> : null}
      <MarketVendorEditSheet key={editingVendor?.publicId || "vendor-edit-closed"} vendor={editingVendor} open={Boolean(editingVendor)} onClose={() => setEditingVendor(null)} onSuccess={() => void query.refetch()} />
      <VendorCollectionReconcileSheet key={reconcilingCollection?.publicId || "collection-reconcile-closed"} collection={reconcilingCollection} open={Boolean(reconcilingCollection)} onClose={() => setReconcilingCollection(null)} onSuccess={() => void query.refetch()} />
      <ImagePreviewDialog open={Boolean(previewImage)} onOpenChange={(open) => { if (!open) setPreviewImage(null); }} src={previewImage?.src} alt={previewImage?.alt || "Product image"} />
      <Dialog open={lifecycleOpen} onOpenChange={(next) => { if (!next && !acting) { setLifecycleOpen(false); setReason(""); } }}><DialogContent><DialogHeader><DialogTitle>{market?.status === "active" ? "Deactivate market?" : "Activate market?"}</DialogTitle><DialogDescription>This reversible change is recorded in the audit log and affects future operational use.</DialogDescription></DialogHeader><div className="space-y-2"><Label htmlFor="market-detail-reason">Audit reason</Label><Input id="market-detail-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Add a clear operational reason" minLength={3} maxLength={500} /></div><DialogFooter><Button variant="outline" disabled={acting} onClick={() => setLifecycleOpen(false)}>Cancel</Button><Button variant={market?.status === "active" ? "destructive" : "brand"} disabled={acting || reason.trim().length < 3} onClick={() => void changeLifecycle()}>{acting ? <HookLoader size="button" /> : market?.status === "active" ? "Deactivate" : "Activate"}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

function EmptyTable({ colSpan, message }: { colSpan: number; message: string }) {
  return <TableRow><TableCell colSpan={colSpan} className="h-28 text-center text-sm text-muted-foreground">{message}</TableCell></TableRow>;
}

function paymentLabel(value?: string) {
  const labels: Record<string, string> = {
    recorded: "Saved, awaiting check",
    reconciled: "Checked and matched",
    disputed: "Issue found",
    unpaid: "No payment details",
    pending: "Awaiting check",
  };
  return labels[String(value || "").toLowerCase()] || String(value || "Not recorded").replaceAll("_", " ");
}

function VendorList({ vendors, canManage, onEdit }: { vendors: MarketVendorRecord[]; canManage: boolean; onEdit: (vendor: MarketVendorRecord) => void }) {
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[860px]">
        <TableHeader><TableRow><TableHead className="w-12">#</TableHead><TableHead>Supplier</TableHead><TableHead>Contact</TableHead><TableHead>Status</TableHead><TableHead>Payment details</TableHead><TableHead>Last contacted</TableHead><TableHead className="w-16 text-right">Action</TableHead></TableRow></TableHeader>
        <TableBody>
          {!vendors.length ? <EmptyTable colSpan={7} message="No suppliers have been invited to this Market yet." /> : vendors.map((vendor, index) => (
            <TableRow key={vendor.publicId}>
              <TableCell className="tabular-nums text-muted-foreground">{index + 1}</TableCell>
              <TableCell><div className="min-w-44"><p className="font-medium text-foreground">{vendor.businessName}</p><p className="mt-1 font-mono text-[11px] text-muted-foreground">{vendor.publicId}</p></div></TableCell>
              <TableCell><div className="min-w-48 space-y-1 text-sm"><p className="font-medium">{vendor.contactName}</p><p className="flex items-center gap-1.5 text-muted-foreground"><Phone className="size-3.5" />{vendor.phone}</p>{vendor.email ? <p className="flex items-center gap-1.5 truncate text-muted-foreground"><Mail className="size-3.5" />{vendor.email}</p> : null}</div></TableCell>
              <TableCell><StatusBadge status={vendor.status || "pending"} /></TableCell>
              <TableCell><div className="flex items-center gap-1.5 text-sm"><CheckCircle2 className="size-4 text-emerald-600" /><span>{vendor.paymentProfile?.verificationStatus || "Unverified"}</span>{vendor.paymentProfile?.accountNumberLast4 ? <span className="text-muted-foreground">· ****{vendor.paymentProfile.accountNumberLast4}</span> : null}</div></TableCell>
              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{dateLabel(vendor.lastContactedAt)}</TableCell>
              <TableCell className="text-right">{canManage ? <Button variant="ghost" size="icon-sm" aria-label={`Edit ${vendor.businessName}`} onClick={() => onEdit(vendor)}><Edit3 /></Button> : <span className="text-muted-foreground">—</span>}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ProductList({ products, onPreview }: { products: Array<Record<string, unknown>>; onPreview: (src: string, alt: string) => void }) {
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[900px]">
        <TableHeader><TableRow><TableHead className="w-12">#</TableHead><TableHead>Product</TableHead><TableHead>Supplier</TableHead><TableHead>Availability</TableHead><TableHead>Catalog status</TableHead><TableHead>Updated</TableHead><TableHead className="w-24 text-right">Action</TableHead></TableRow></TableHeader>
        <TableBody>
          {!products.length ? <EmptyTable colSpan={7} message="No products have been captured for this Market." /> : products.map((product, index) => {
            const id = String(product.publicId || product.id || "product");
            const title = String(product.title || "Untitled product");
            const image = Array.isArray(product.images) && typeof product.images[0] === "string" ? absoluteImageUrl(product.images[0]) : "";
            return (
              <TableRow key={id}>
                <TableCell className="tabular-nums text-muted-foreground">{index + 1}</TableCell>
                <TableCell>
                  <div className="flex min-w-56 items-center gap-3">
                    <button type="button" disabled={!image} onClick={() => image && onPreview(image, title)} className={`size-12 shrink-0 overflow-hidden rounded-lg border bg-muted ${image ? "cursor-zoom-in transition hover:ring-2 hover:ring-[#e5bd00]" : "cursor-default"}`} aria-label={image ? `Preview ${title} image` : `${title} has no image`}>
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt="" className="size-full object-cover" />
                      ) : <Package className="mx-auto size-5 text-muted-foreground" />}
                    </button>
                    <div className="min-w-0"><p className="truncate font-medium text-foreground">{title}</p><p className="mt-1 font-mono text-[11px] text-muted-foreground">{id}</p></div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{String(product.marketVendorName || "Not linked")}</TableCell>
                <TableCell><StatusBadge status={String(product.availabilityStatus || "unknown")} /></TableCell>
                <TableCell><StatusBadge status={String(product.status || "unknown")} /></TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{dateLabel(String(product.updatedAt || ""))}</TableCell>
                <TableCell className="text-right"><Button asChild variant="outline" size="sm"><Link href={`/dashboard/products/${id}`}><Eye /> View</Link></Button></TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function RunnerList({ runners, assignments }: { runners: Array<Record<string, unknown>>; assignments: Array<Record<string, unknown>> }) {
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[700px]">
        <TableHeader><TableRow><TableHead className="w-12">#</TableHead><TableHead>Runner</TableHead><TableHead>Status</TableHead><TableHead>Market assignments</TableHead><TableHead>Runner ID</TableHead></TableRow></TableHeader>
        <TableBody>
          {!runners.length ? <EmptyTable colSpan={5} message="No active Runners are assigned to this Market." /> : runners.map((runner, index) => {
            const id = String(runner.publicId || runner.id || "runner");
            const name = `${String(runner.firstName || "")} ${String(runner.lastName || "")}`.trim() || String(runner.email || id);
            const assignmentCount = assignments.filter((item) => item.runnerId === runner.id || item.runnerId === runner._id || item.runnerId === runner.publicId).length;
            return <TableRow key={id}><TableCell className="tabular-nums text-muted-foreground">{index + 1}</TableCell><TableCell><p className="font-medium">{name}</p></TableCell><TableCell><StatusBadge status={String(runner.status || runner.availability || "active")} /></TableCell><TableCell className="text-sm text-muted-foreground">{assignmentCount}</TableCell><TableCell className="font-mono text-[11px] text-muted-foreground">{id}</TableCell></TableRow>;
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function CollectionList({ collections, vendors, canReconcile, onReconcile }: { collections: Array<Record<string, unknown>>; vendors: MarketVendorRecord[]; canReconcile: boolean; onReconcile: (collection: ReconcileCollection) => void }) {
  const vendorMap = new Map(vendors.map((vendor) => [vendor.id, vendor.businessName]));
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[1100px]">
        <TableHeader><TableRow><TableHead className="w-12">#</TableHead><TableHead>Product</TableHead><TableHead>Supplier</TableHead><TableHead>Quantity</TableHead><TableHead>Cost</TableHead><TableHead>Payment record</TableHead><TableHead>Payment check</TableHead><TableHead>Collected</TableHead><TableHead className="w-36 text-right">Action</TableHead></TableRow></TableHeader>
        <TableBody>
          {!collections.length ? <EmptyTable colSpan={9} message="No collection records yet." /> : collections.map((collection, index) => {
            const id = String(collection.publicId || collection.id || "collection");
            const vendorId = String(collection.marketVendorId || "");
            const paymentStatus = String(collection.paymentStatus || "unpaid");
            const payment = collection.payment as { amountMinor?: number; method?: string; reference?: string } | null | undefined;
            const paymentMethod = String(payment?.method || "").replaceAll("_", " ");
            return <TableRow key={id}><TableCell className="tabular-nums text-muted-foreground">{index + 1}</TableCell><TableCell className="min-w-48 font-medium">{String(collection.productTitleSnapshot || "Collected product")}</TableCell><TableCell className="text-sm text-muted-foreground">{String(collection.marketVendorName || vendorMap.get(vendorId) || "Not linked")}</TableCell><TableCell className="tabular-nums">{String(collection.quantity || 0)}</TableCell><TableCell className="whitespace-nowrap font-semibold">₦{(Number(collection.actualCostMinor || 0) / 100).toLocaleString("en-NG")}</TableCell><TableCell className="min-w-36 text-sm">{payment ? <div><p className="font-medium">₦{(Number(payment.amountMinor || 0) / 100).toLocaleString("en-NG")}</p><p className="mt-1 capitalize text-xs text-muted-foreground">{paymentMethod || "Payment"}{payment.reference ? ` · ${payment.reference}` : ""}</p></div> : <span className="text-muted-foreground">Not recorded</span>}</TableCell><TableCell><div className="space-y-1"><StatusBadge status={paymentStatus} /><p className="text-xs text-muted-foreground">{paymentLabel(paymentStatus)}</p></div></TableCell><TableCell className="whitespace-nowrap text-sm text-muted-foreground">{dateLabel(String(collection.createdAt || ""))}</TableCell><TableCell className="text-right">{canReconcile && paymentStatus !== "unpaid" ? <Button size="sm" variant="outline" onClick={() => onReconcile({ publicId: id, productTitleSnapshot: String(collection.productTitleSnapshot || "Collected product"), paymentStatus })}>Review payment</Button> : <span className="text-sm text-muted-foreground">—</span>}</TableCell></TableRow>;
          })}
        </TableBody>
      </Table>
    </div>
  );
}
