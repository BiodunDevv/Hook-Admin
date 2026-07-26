"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Ban, Boxes, Check, Edit3, Eye, Info, Layers, Mail, PackageCheck, Phone, UserCheck, WalletCards, X } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { HookLoader } from "@/components/shared/HookLoader";
import { MediaPicker } from "@/components/shared/MediaPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useApiPatch, useApiQuery } from "@/lib/query";
import { cleanError, money, number } from "@/lib/admin-utils";

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
  images?: string[];
  colors?: string[];
  sizes?: string[];
  vendor?: { id?: string; businessName?: string };
  category?: { name?: string };
  categoryManagers?: CategoryManager[];
}

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
  const approve = useApiPatch<ProductDetail, { status: string }>(`/admin/products/${id}/review`, ["admin", "products"], { successMessage: "Product approved" });
  const disable = useApiPatch<ProductDetail, undefined>(`/admin/products/${id}/disable`, ["admin", "products"], { successMessage: "Product disabled" });
  const updateProduct = useApiPatch<ProductDetail, Record<string, unknown>>(`/admin/products/${id}`, ["admin", "products"], { successMessage: "Product updated" });
  const [editing, setEditing] = useState(false);
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editColors, setEditColors] = useState<string[]>([]);
  const [editColorValue, setEditColorValue] = useState("#FFC809");
  const [editStatus, setEditStatus] = useState("pending_approval");
  const product = query.data;
  const heroImage = absoluteImageUrl(product?.images?.[0]);

  useEffect(() => {
    if (product) {
      setEditImages(product.images || []);
      setEditColors(product.colors || []);
      setEditStatus(product.status);
    }
  }, [product?.id]);

  return (
    <div className="min-h-[calc(100vh-4rem)] overflow-y-auto p-2 pb-6 sm:p-4 sm:pb-8">
      <PageHeader
        title={product?.title || "Product Detail"}
        description={`${product?.category?.name || "Category"} • Commercial catalog`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft size={15} /> Back</Button>
            {product && <Button variant="outline" size="sm" onClick={() => { setEditImages(product.images || []); setEditColors(product.colors || []); setEditing(true); }}><Edit3 size={15} /> Edit</Button>}
            {product && product.status !== "approved" && <Button size="sm" variant="brand" onClick={() => approve.mutate({ status: "approved" })}><Check size={15} /> Approve</Button>}
            {product && product.status !== "disabled" && <Button size="sm" variant="outline" onClick={() => disable.mutate(undefined)}><Ban size={15} /> Disable</Button>}
          </>
        }
      />

      {query.isLoading && <Card className="rounded-lg shadow-card"><CardContent className="p-4"><HookLoader label="Loading product..." /></CardContent></Card>}
      {query.error && <Card className="rounded-lg border-red-200 bg-red-50 shadow-none"><CardContent className="p-4 text-sm text-red-600">{cleanError(query.error)}</CardContent></Card>}

      {product && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard icon={WalletCards} tone="blue" label="Hook Price" value={money(product.sellingPrice)} caption="Customer-facing price" />
            <KpiCard icon={Boxes} tone={product.quantity < 10 ? "red" : "green"} label="Stock" value={number(product.quantity)} caption={`${number(product.reservedQuantity)} reserved`} />
            <KpiCard icon={PackageCheck} tone="amber" label="Orders" value={number(product.orderCount)} caption={`${number(product.viewCount)} views`} />
            <KpiCard icon={Layers} tone="zinc" label="Negotiation Floor" value={money(product.minAcceptablePrice)} caption="AI minimum accepted price" />
          </div>

          <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
            <Card className="overflow-hidden rounded-lg border-zinc-200 py-0 shadow-card">
              <CardContent className="p-0">
                <div className="relative aspect-square bg-zinc-100">
                  {heroImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={heroImage} alt={product.title} className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center text-sm text-zinc-400">No image</div>
                  )}
                </div>
                <div className="space-y-3 p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-zinc-500">Status</span>
                    <StatusBadge status={product.status} />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-zinc-500">Hook ID</span>
                    <span className="font-medium text-zinc-900">{product.hookId || product.id.slice(0, 8)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-zinc-500">Market Price</span>
                    <span className="font-medium text-zinc-900">{money(product.costPrice)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="rounded-lg border-zinc-200 py-0 shadow-card">
                <CardContent className="space-y-4 p-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Description</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">{product.description || "No product description."}</p>
                  </div>
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                      <p className="text-zinc-400">Legacy source</p>
                      <p className="mt-1 font-medium text-zinc-900">{product.vendor?.businessName || "Hook catalog"}</p>
                    </div>
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                      <p className="text-zinc-400">Category</p>
                      <p className="mt-1 font-medium text-zinc-900">{product.category?.name || "Uncategorized"}</p>
                    </div>
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                      <p className="text-zinc-400">Colors</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(product.colors || []).map((color) => (
                          <span key={color} className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600">
                            <span className="size-4 rounded-full border border-zinc-200" style={{ backgroundColor: color }} />
                            {color}
                          </span>
                        ))}
                        {!product.colors?.length && <span className="font-medium text-zinc-900">None</span>}
                      </div>
                    </div>
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                      <p className="text-zinc-400">Sizes</p>
                      <p className="mt-1 font-medium text-zinc-900">{product.sizes?.join(", ") || "None"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Category managers — who to contact about this product */}
              <Card className="rounded-lg border-zinc-200 py-0 shadow-card">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-900">
                      In Charge — {product.category?.name || "Category"}
                    </h3>
                    <UserCheck size={15} className="text-zinc-400" />
                  </div>
                  {!product.categoryManagers?.length ? (
                    <p className="rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-4 text-center text-sm text-zinc-400">
                      No manager assigned to this category yet.
                    </p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {product.categoryManagers.map((manager) => (
                        <div
                          key={manager.id}
                          className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-900">
                            {managerInitials(manager)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate text-sm font-semibold text-zinc-900">{managerName(manager)}</p>
                              <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                manager.role === "admin" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
                              }`}>
                                {manager.role}
                              </span>
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500">
                              {manager.phone && (
                                <a href={`tel:${manager.phone}`} className="flex items-center gap-1 hover:text-zinc-900">
                                  <Phone size={10} /> {manager.phone}
                                </a>
                              )}
                              <a href={`mailto:${manager.email}`} className="flex min-w-0 items-center gap-1 hover:text-zinc-900">
                                <Mail size={10} /> <span className="truncate">{manager.email}</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-lg border-zinc-200 py-0 shadow-card">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-900">Gallery</h3>
                    <Eye size={15} className="text-zinc-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {(product.images || []).slice(0, 8).map((src) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={src} src={absoluteImageUrl(src)} alt={product.title} className="aspect-square rounded-md border border-zinc-200 object-cover" />
                    ))}
                    {!product.images?.length && <div className="col-span-full rounded-md border border-zinc-200 bg-zinc-50 p-6 text-center text-sm text-zinc-500">No images uploaded.</div>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
      {product && (
        <Dialog open={editing} onOpenChange={setEditing}>
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-lg">
            <DialogHeader>
              <DialogTitle>Edit product</DialogTitle>
              <DialogDescription>Update market price, Hook price, negotiation floor, stock, colors, and product copy.</DialogDescription>
            </DialogHeader>
            <TooltipProvider>
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={async (event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                const payload = Object.fromEntries(formData.entries());
                await updateProduct.mutateAsync({
                  title: payload.title,
                  description: payload.description,
                  costPrice: Number(payload.costPrice || 0),
                  sellingPrice: Number(payload.sellingPrice || 0),
                  minAcceptablePrice: Number(payload.minAcceptablePrice || 0),
                  quantity: Number(payload.quantity || 0),
                  images: editImages,
                  colors: editColors,
                  sizes: String(payload.sizes || "").split(",").map((item) => item.trim()).filter(Boolean),
                  status: editStatus,
                });
                query.refetch();
                setEditing(false);
              }}
            >
              <Field className="sm:col-span-2"><FieldLabel>Title</FieldLabel><Input name="title" defaultValue={product.title} required /></Field>
              <Field className="sm:col-span-2"><FieldLabel>Description</FieldLabel><Textarea name="description" defaultValue={product.description} className="min-h-20" /></Field>
              <Field><PriceLabel help="What this item commonly sells for outside Hook.">Market Price</PriceLabel><Input name="costPrice" type="number" min="1" defaultValue={String(product.costPrice)} /></Field>
              <Field><PriceLabel help="The customer-facing price on Hook.">Hook Platform Price</PriceLabel><Input name="sellingPrice" type="number" min="1" defaultValue={String(product.sellingPrice)} /></Field>
              <Field><PriceLabel help="Lowest price AI negotiation can accept. It must not exceed the Hook platform price.">Negotiation Floor</PriceLabel><Input name="minAcceptablePrice" type="number" min="1" defaultValue={String(product.minAcceptablePrice)} /></Field>
              <Field><FieldLabel>Stock</FieldLabel><Input name="quantity" type="number" min="0" defaultValue={String(product.quantity)} /></Field>
              <Field><FieldLabel>Status</FieldLabel><Select value={editStatus} onValueChange={setEditStatus}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="pending_approval">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="rejected">Rejected</SelectItem><SelectItem value="disabled">Disabled</SelectItem></SelectContent></Select></Field>
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
              <div className="flex justify-end sm:col-span-2"><Button type="submit" variant="brand" disabled={updateProduct.isPending}>{updateProduct.isPending ? <HookLoader size="button" label="Saving..." /> : "Save changes"}</Button></div>
            </form>
            </TooltipProvider>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
