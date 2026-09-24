"use client";

import { CategoryPicker } from "@/components/categories/CategoryPicker";
import type { CategoryOption } from "@/lib/category-attributes";
import { ColorLabel } from "@/components/shared/ColorLabel";
import { FormEvent, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Ban, Boxes, Check, ChevronRight, Edit3, Eye, Info, Mail, PackageCheck, Phone, Tag, Trash2, UserCheck, X } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { HookLoader } from "@/components/shared/HookLoader";
import { ImageLightbox } from "@/components/shared/ImageLightbox";
import { ImagePreviewDialog } from "@/components/shared/ImagePreviewDialog";
import { MediaPicker } from "@/components/shared/MediaPicker";
import { AdminWorkflowSheet } from "@/components/shared/AdminWorkflowSheet";
import { DetailSection } from "@/components/shared/DetailSection";
import { DefinitionGrid } from "@/components/shared/DefinitionGrid";
import { ProductLifecycleWorkspace } from "@/components/products/ProductLifecycleWorkspace";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useApiPatch, useApiQuery } from "@/lib/query";
import { apiDelete } from "@/lib/api";
import { cleanError, money, number } from "@/lib/admin-utils";
import { PermissionGuard, SuperAdminGuard } from "@/components/auth/PermissionGuard";

interface ProductDetail {
  id: string;
  title: string;
  description?: string;
  hookId?: string;
  sellingPrice: number;
  costPrice: number;
  discountedPrice?: number;
  minAcceptablePrice: number;
  quantity: number;
  reservedQuantity: number;
  status: string;
  viewCount: number;
  orderCount: number;
  availabilityStatus?: string;
  catalogVersion?: number;
  categoryId?: string;
  marketId?: string;
  marketName?: string;
  sourceMarketVendorName?: string;
  sourceMarket?: { name?: string; publicId?: string } | null;
  sourceMarketVendor?: { businessName?: string; publicId?: string; status?: string } | null;
  images?: string[];
  colors?: string[];
  sizes?: string[];
  vendor?: { id?: string; businessName?: string };
  category?: { id?: string; publicId?: string; name?: string; parent?: { id?: string; name?: string } | null };
  categoryManagers?: CategoryManager[];
  basePriceMinor?: number;
  sellingPriceMinor?: number;
  negotiationRules?: {
    enabled: boolean;
    minimumNegotiablePriceMinor?: number;
    maximumDiscountMinor?: number;
    maximumCustomerOffers: number;
    acceptedQuoteExpiryMinutes: number;
  };
  availabilityCheckDueAt?: string;
  availabilityCheckNote?: string;
  lastAvailabilityConfirmedAt?: string;
}
interface ProductOption { id: string; publicId?: string; name: string; isActive?: boolean; status?: string; stateName?: string; state?: { name?: string }; }
interface VendorOption { id: string; publicId?: string; businessName: string; status?: string; }

/** Radix Select reserves an empty string for "no selection" — this sentinel
 * stands in for "no vendor" in the control, and is translated back to an
 * empty string (which the backend treats as "clear the vendor") on submit. */
const NO_VENDOR = "none";

interface CategoryManager {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string | null;
  role: "support" | "admin";
}

function managerName(manager: CategoryManager) {
  return `${manager.firstName || ""} ${manager.lastName || ""}`.trim() || manager.email;
}

function managerInitials(manager: CategoryManager) {
  const name = managerName(manager);
  return name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "?";
}

function absoluteImageUrl(url?: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1").replace(/\/api\/v1\/?$/, "");
  return `${base}${url}`;
}

function isActiveProduct(status?: string) {
  return ["published", "approved", "active"].includes((status || "").toLowerCase());
}

function canApproveProduct(status?: string) {
  return !["published", "approved", "active", "disabled"].includes((status || "").toLowerCase());
}

function PriceLabel({ children, help }: { children: React.ReactNode; help: string }) {
  return (
    <FieldLabel className="items-center">
      {children}
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="text-zinc-400 hover:text-zinc-700" aria-label={`${children} information`}>
            <Info size={13} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">{help}</TooltipContent>
      </Tooltip>
    </FieldLabel>
  );
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const query = useApiQuery<ProductDetail>(["admin", "products", id], `/admin/products/${id}`, Boolean(id));
  const categories = useApiQuery<{ data: CategoryOption[] }>(["admin", "categories", "product-options"], "/admin/categories");
  const markets = useApiQuery<{ data: ProductOption[] }>(["admin", "markets", "product-options"], "/admin/markets?limit=200");
  const approve = useApiPatch<ProductDetail, { status: string }>(`/admin/products/${id}/review`, ["admin", "products"], { successMessage: "Product approved" });
  const disable = useApiPatch<ProductDetail, undefined>(`/admin/products/${id}/disable`, ["admin", "products"], { successMessage: "Product disabled" });
  const updateProduct = useApiPatch<ProductDetail, Record<string, unknown>>(`/admin/products/${id}`, ["admin", "products"], { successMessage: "Product updated" });
  const [editing, setEditing] = useState(false);
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editColors, setEditColors] = useState<string[]>([]);
  const [editColorValue, setEditColorValue] = useState("#FFC809");
  const [editStatus, setEditStatus] = useState("draft");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editMarketId, setEditMarketId] = useState("");
  const [editVendorId, setEditVendorId] = useState(NO_VENDOR);
  // Vendors are market-scoped — a vendor invited into one Market can't supply
  // a product in another, so the picker only ever offers vendors belonging
  // to whichever Market is currently selected in the edit form.
  const vendors = useApiQuery<VendorOption[]>(["admin", "market", editMarketId, "vendors"], `/admin/markets/${editMarketId}/vendors`, editing && Boolean(editMarketId));
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const product = query.data;
  const gallery = product?.images || [];
  const activeIndex = Math.min(activeImage, Math.max(0, gallery.length - 1));
  const heroImage = absoluteImageUrl(gallery[activeIndex]);
  const margin = product ? product.sellingPrice - product.costPrice : 0;
  const marginPct = product && product.sellingPrice ? Math.round((margin / product.sellingPrice) * 100) : 0;

  async function deleteProduct() {
    if (!product) return;
    setDeleting(true);
    try {
      await apiDelete(`/admin/products/${product.id}`);
      toast.success("Product deleted.");
      router.push("/dashboard/products");
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Product could not be deleted");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full space-y-5 px-4 py-5">
      <PageHeader
        title={product?.title || "Product Detail"}
        description={product?.hookId || product?.id ? `Commercial catalog · ${product.hookId || product.id}` : "Commercial catalog product"}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft size={15} /> Back</Button>
            <PermissionGuard permission="products.edit">
              {product && <Button variant="outline" size="sm" onClick={() => { setEditImages(product.images || []); setEditColors(product.colors || []); setEditStatus(isActiveProduct(product.status) ? "published" : product.status === "pending_approval" || product.status === "rejected" ? "draft" : product.status); setEditCategoryId(product.category?.publicId || product.category?.id || product.categoryId || ""); setEditMarketId(product.sourceMarket?.publicId || product.marketId || ""); setEditVendorId(product.sourceMarketVendor?.publicId || NO_VENDOR); setEditing(true); }}><Edit3 size={15} /> Edit</Button>}
              {product && product.status !== "disabled" && <Button size="sm" variant="outline" onClick={() => disable.mutate(undefined)}><Ban size={15} /> Disable</Button>}
            </PermissionGuard>
            <PermissionGuard permission="products.review">
              {product && canApproveProduct(product.status) && <Button size="sm" variant="brand" onClick={() => approve.mutate({ status: "published" })}><Check size={15} /> Activate</Button>}
            </PermissionGuard>
            {product && product.status === "disabled" && (
              <SuperAdminGuard>
                <Button size="sm" variant="destructive" onClick={() => setDeleteOpen(true)}><Trash2 size={15} /> Delete</Button>
              </SuperAdminGuard>
            )}
          </>
        }
      />

      {query.isLoading && <Card className="rounded-lg shadow-card"><CardContent className="p-4"><HookLoader label="Loading product..." /></CardContent></Card>}
      {query.error && <Card className="rounded-lg border-red-200 bg-red-50 shadow-none"><CardContent className="p-4 text-sm text-red-600">{cleanError(query.error)}</CardContent></Card>}

      {product && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
            <Card className="overflow-hidden rounded-xl border-zinc-200 py-0 shadow-card">
              <CardContent className="p-3">
                <div className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100">
                  {heroImage ? (
                    <button type="button" onClick={() => setLightbox(activeIndex)} className="group relative block size-full cursor-zoom-in" aria-label={`Preview ${product.title} image`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={heroImage} alt={product.title} className="size-full object-cover transition duration-300 group-hover:scale-[1.02]" />
                      <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/65 px-2.5 py-1 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100"><Eye size={13} /> Preview</span>
                    </button>
                  ) : (
                    <div className="flex size-full items-center justify-center text-sm text-zinc-400">No image</div>
                  )}
                </div>
                {gallery.length > 1 && (
                  <div className="mt-3 flex gap-2 pb-1">
                    {gallery.slice(0, gallery.length > 5 ? 4 : 5).map((src, index) => (
                      <button key={`${src}-${index}`} type="button" onClick={() => setActiveImage(index)} aria-label={`Show image ${index + 1}`} aria-current={index === activeIndex} className={`size-16 shrink-0 overflow-hidden rounded-md border-2 bg-zinc-100 transition ${index === activeIndex ? "border-zinc-900" : "border-transparent opacity-70 hover:opacity-100"}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={absoluteImageUrl(src)} alt="" className="size-full object-cover" />
                      </button>
                    ))}
                    {gallery.length > 5 ? (
                      <button type="button" onClick={() => setLightbox(4)} aria-label={`Show remaining ${gallery.length - 4} images`} className={`relative size-16 shrink-0 overflow-hidden rounded-md border-2 bg-zinc-100 ${activeIndex >= 4 ? "border-zinc-900" : "border-transparent"}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={absoluteImageUrl(gallery[4])} alt="" className="size-full object-cover" />
                        <span className="absolute inset-0 flex items-center justify-center bg-zinc-900/60 text-sm font-semibold text-white">+{gallery.length - 4}</span>
                      </button>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="rounded-xl border-zinc-200 py-0 shadow-card">
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    <Tag size={13} />
                    {product.category?.parent?.name && <><span>{product.category.parent.name}</span><ChevronRight size={12} /></>}
                    <span className="font-medium text-zinc-700">{product.category?.name || "Needs a sub-category"}</span>
                    <span className="ml-auto font-mono text-zinc-400">{product.hookId || product.id.slice(0, 8)}</span>
                  </div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h2 className="text-xl font-semibold leading-tight text-zinc-900">{product.title}</h2>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={isActiveProduct(product.status) ? "active" : product.status} />
                      {product.availabilityStatus && <StatusBadge status={product.availabilityStatus} />}
                    </div>
                  </div>
                  {!product.category?.name && (
                    <p className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"><Info size={14} /> This product is not filed in a sub-category. Edit it to choose one so customers can find it.</p>
                  )}
                  <div className="flex flex-wrap items-end gap-x-6 gap-y-2 border-y py-4">
                    <div>
                      <p className="text-xs text-zinc-500">Hook price</p>
                      <p className="text-3xl font-semibold tracking-tight text-zinc-900">{money(product.sellingPrice)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Margin</p>
                      <p className={`text-lg font-semibold ${margin >= 0 ? "text-emerald-600" : "text-red-600"}`}>{money(margin)} <span className="text-sm font-medium">({marginPct}%)</span></p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Stock</p>
                      <p className={`text-lg font-semibold ${product.quantity < 10 ? "text-red-600" : "text-zinc-900"}`}>{number(product.quantity)} <span className="text-sm font-medium text-zinc-500">· {number(product.reservedQuantity)} reserved</span></p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-600">{product.description || "No product description."}</p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-3 gap-3">
                <KpiCard icon={PackageCheck} tone="amber" label="Orders" value={number(product.orderCount)} caption="All time" />
                <KpiCard icon={Eye} tone="blue" label="Views" value={number(product.viewCount)} caption="Product page" />
                <KpiCard icon={Boxes} tone={product.quantity < 10 ? "red" : "green"} label="Available" value={number(Math.max(0, product.quantity - product.reservedQuantity))} caption="Sellable now" />
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <DetailSection title="Options" description="Variants customers can choose from.">
              <DefinitionGrid
                columns={1}
                items={[
                  {
                    label: "Colours",
                    value: (product.colors || []).length ? (
                      <div className="flex flex-wrap gap-2">
                        {(product.colors || []).map((color) => (
                          <span key={color} className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600"><ColorLabel value={color} swatchClassName="size-4" /></span>
                        ))}
                      </div>
                    ) : "None",
                  },
                  {
                    label: "Sizes",
                    value: (product.sizes || []).length ? (
                      <div className="flex flex-wrap gap-1.5">{(product.sizes || []).map((size) => <span key={size} className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700">{size}</span>)}</div>
                    ) : "Not applicable",
                  },
                ]}
              />
            </DetailSection>

            <DetailSection title="Pricing" description="What Hook pays, charges and will accept.">
              <DefinitionGrid
                columns={2}
                items={[
                  { label: "Cost price", value: money(product.costPrice) },
                  { label: "Hook price", value: money(product.sellingPrice) },
                  { label: "Negotiation floor", value: money(product.minAcceptablePrice) },
                  { label: "Negotiation", value: product.negotiationRules?.enabled ? `On · up to ${product.negotiationRules.maximumCustomerOffers} offers · quote valid ${product.negotiationRules.acceptedQuoteExpiryMinutes} min` : "Off" },
                ]}
              />
            </DetailSection>

            <DetailSection title="Sourcing" description="Where Hook buys this item.">
              <DefinitionGrid
                columns={2}
                items={[
                  { label: "Source market", value: product.sourceMarket?.name || product.marketName || "Not linked" },
                  { label: "Vendor", value: product.sourceMarketVendor?.businessName || product.sourceMarketVendorName || product.vendor?.businessName || "None" },
                  { label: "Availability", value: <StatusBadge status={product.availabilityStatus || product.status} /> },
                  { label: "Last confirmed", value: product.lastAvailabilityConfirmedAt ? new Date(product.lastAvailabilityConfirmedAt).toLocaleString() : "Never" },
                  { label: "Next check due", value: product.availabilityCheckDueAt ? new Date(product.availabilityCheckDueAt).toLocaleString() : "Not scheduled" },
                  { label: "Catalog version", value: product.catalogVersion || "—" },
                ]}
              />
            </DetailSection>

            <DetailSection
              title={`In Charge — ${product.category?.name || "Category"}`}
              description="Who to contact about this product's category."
              action={<UserCheck size={15} className="text-zinc-400" />}
            >
              {!product.categoryManagers?.length ? (
                <p className="rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-4 text-center text-sm text-zinc-400">No manager assigned to this category yet.</p>
              ) : (
                <div className="grid gap-2">
                  {product.categoryManagers.map((manager) => (
                    <div key={manager.id} className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-900">{managerInitials(manager)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-zinc-900">{managerName(manager)}</p>
                          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${manager.role === "admin" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>{manager.role}</span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500">
                          {manager.phone && <a href={`tel:${manager.phone}`} className="flex items-center gap-1 hover:text-zinc-900"><Phone size={10} /> {manager.phone}</a>}
                          <a href={`mailto:${manager.email}`} className="flex min-w-0 items-center gap-1 hover:text-zinc-900"><Mail size={10} /> <span className="truncate">{manager.email}</span></a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DetailSection>
          </div>

          <ProductLifecycleWorkspace product={product} onSaved={() => query.refetch()} />
        </div>
      )}
      {product && (
        <AdminWorkflowSheet
          open={editing}
          onOpenChange={(open) => {
            if (!open && !updateProduct.isPending) setEditing(false);
          }}
          title="Edit product"
          description="Update catalog copy, commercial pricing, availability, variants, and media. Pricing rules are validated by the backend."
          footer={(
            <>
              <Button type="button" variant="outline" onClick={() => setEditing(false)} disabled={updateProduct.isPending}>
                Cancel
              </Button>
              <Button type="submit" form="product-edit-form" variant="brand" disabled={updateProduct.isPending}>
                {updateProduct.isPending ? <HookLoader size="button" label="Saving..." /> : "Save changes"}
              </Button>
            </>
          )}
        >
            <TooltipProvider>
            <form
              id="product-edit-form"
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={async (event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                const payload = Object.fromEntries(formData.entries());
                await updateProduct.mutateAsync({
                  title: payload.title,
                  description: payload.description,
                  categoryId: editCategoryId,
                  marketId: editMarketId,
                  sourceMarketVendorId: editVendorId === NO_VENDOR ? "" : editVendorId,
                  costPrice: Number(payload.costPrice || 0),
                  sellingPrice: Number(payload.sellingPrice || 0),
                  minAcceptablePrice: Number(payload.minAcceptablePrice || 0),
                  quantity: Number(payload.quantity || 0),
                  images: editImages,
                  colors: editColors,
                  sizes: String(payload.sizes || "").split(",").map((item) => item.trim()).filter(Boolean),
                  status: editStatus,
                  reason: String(payload.reason || "").trim() || undefined,
                });
                query.refetch();
                setEditing(false);
              }}
            >
              <Field className="sm:col-span-2"><FieldLabel>Title</FieldLabel><Input name="title" defaultValue={product.title} required /></Field>
              <CategoryPicker categories={categories.data?.data || []} value={editCategoryId} onChange={setEditCategoryId} />
              <Field><FieldLabel>Market</FieldLabel><Select value={editMarketId} onValueChange={(value) => { setEditMarketId(value); setEditVendorId(NO_VENDOR); }} required><SelectTrigger className="w-full"><SelectValue placeholder="Select active Market" /></SelectTrigger><SelectContent>{(markets.data?.data || []).filter((item) => item.status === "active").map((item) => <SelectItem key={item.publicId || item.id} value={item.publicId || item.id}>{item.name}{item.stateName || item.state?.name ? ` · ${item.stateName || item.state?.name}` : ""}</SelectItem>)}</SelectContent></Select></Field>
              <Field className="sm:col-span-2">
                <FieldLabel>Vendor</FieldLabel>
                <Select value={editVendorId} onValueChange={setEditVendorId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={vendors.isLoading ? "Loading vendors…" : "Select a vendor"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_VENDOR}>None — no vendor for this product</SelectItem>
                    {(vendors.data || []).map((item) => (
                      <SelectItem key={item.publicId || item.id} value={item.publicId || item.id}>
                        {item.businessName}{item.status && item.status !== "active" ? ` (${item.status})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>Only vendors from the selected Market can supply this product.</FieldDescription>
              </Field>
              <Field className="sm:col-span-2"><FieldLabel>Description</FieldLabel><Textarea name="description" defaultValue={product.description} required minLength={20} className="min-h-20" /></Field>
              <Field><PriceLabel help="What Hook pays for this item. Negotiation can never go below this.">Cost Price</PriceLabel><Input name="costPrice" type="number" min="1" defaultValue={String(product.costPrice)} /></Field>
              <Field><PriceLabel help="The customer-facing price on Hook.">Hook Platform Price</PriceLabel><Input name="sellingPrice" type="number" min="1" defaultValue={String(product.sellingPrice)} /></Field>
              <Field><PriceLabel help="Lowest price AI negotiation can accept. It must not exceed the Hook platform price.">Negotiation Floor</PriceLabel><Input name="minAcceptablePrice" type="number" min="1" defaultValue={String(product.minAcceptablePrice)} /></Field>
              <Field className="sm:col-span-2"><FieldLabel>Reason for change</FieldLabel><Input name="reason" placeholder="Required if you change any price above" maxLength={500} /><FieldDescription>Recorded in the audit log. Only required when a price is actually changed.</FieldDescription></Field>
              <Field><FieldLabel>Stock</FieldLabel><Input name="quantity" type="number" min="0" defaultValue={String(product.quantity)} /></Field>
              <Field><FieldLabel>Visibility</FieldLabel><Select value={editStatus} onValueChange={setEditStatus}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="published">Active on Hook</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="paused">Paused</SelectItem><SelectItem value="unpublished">Unpublished</SelectItem><SelectItem value="disabled">Disabled</SelectItem></SelectContent></Select></Field>
              <Field className="sm:col-span-2"><FieldLabel>Colors</FieldLabel><div className="flex flex-wrap items-center gap-2">{editColors.map((color) => <button key={color} type="button" onClick={() => setEditColors((current) => current.filter((item) => item !== color))} className="flex h-9 items-center gap-2 rounded-md border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-600" title={`Remove ${color}`}><span className="size-4 rounded-full border border-zinc-300" style={{ backgroundColor: color }} /><span className="font-mono">{color}</span><X size={12} /></button>)}<input value={editColorValue} onChange={(event) => setEditColorValue(event.target.value.toUpperCase())} type="color" className="h-9 w-11 rounded-md border border-zinc-200 bg-white p-1" aria-label="Pick product color" /><Button type="button" variant="outline" size="sm" onClick={() => setEditColors((current) => current.includes(editColorValue) ? current : [...current, editColorValue])}>Add color</Button></div></Field>
              <Field><FieldLabel>Sizes</FieldLabel><Input name="sizes" defaultValue={(product.sizes || []).join(", ")} /></Field>
              <div className="sm:col-span-2">
                <MediaPicker
                  value={editImages}
                  onChange={setEditImages}
                  label="Product Images"
                  description="Upload replacement images to Cloudinary or add image links. The first image is the catalog thumbnail."
                />
              </div>
            </form>
            </TooltipProvider>
        </AdminWorkflowSheet>
      )}
      <ImageLightbox images={gallery.map((src) => absoluteImageUrl(src) || src)} index={lightbox} onIndexChange={(next) => { setLightbox(next); setActiveImage(next); }} onClose={() => setLightbox(null)} alt={product?.title || "Product"} />
      <ImagePreviewDialog open={Boolean(previewImage)} onOpenChange={(open) => { if (!open) setPreviewImage(null); }} src={previewImage} alt={product?.title || "Product image"} />

      <Dialog open={deleteOpen} onOpenChange={(open) => { if (!open && !deleting) setDeleteOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this product?</DialogTitle>
            <DialogDescription>
              {product ? `"${product.title}" will be permanently removed from the catalog. This cannot be undone.` : "This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={() => void deleteProduct()} disabled={deleting}>
              {deleting ? <HookLoader size="button" /> : "Delete product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
