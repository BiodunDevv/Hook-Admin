"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Ban, Boxes, Check, Edit3, Eye, Layers, PackageCheck, WalletCards } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { HookLoader } from "@/components/shared/HookLoader";
import { MediaPicker } from "@/components/shared/MediaPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
}

function absoluteImageUrl(url?: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1").replace(/\/api\/v1\/?$/, "");
  return `${base}${url}`;
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
  const product = query.data;
  const heroImage = absoluteImageUrl(product?.images?.[0]);

  useEffect(() => {
    if (product) setEditImages(product.images || []);
  }, [product?.id]);

  return (
    <div className="min-h-[calc(100vh-4rem)] overflow-y-auto p-2 pb-6 sm:p-4 sm:pb-8">
      <PageHeader
        title={product?.title || "Product Detail"}
        description={`${product?.vendor?.businessName || "Vendor"} • ${product?.category?.name || "Category"}`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft size={15} /> Back</Button>
            {product && <Button variant="outline" size="sm" onClick={() => { setEditImages(product.images || []); setEditing(true); }}><Edit3 size={15} /> Edit</Button>}
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
            <KpiCard icon={WalletCards} tone="blue" label="Selling Price" value={money(product.sellingPrice)} caption={product.discountedPrice ? `${money(product.discountedPrice)} promo` : "Current retail"} />
            <KpiCard icon={Boxes} tone={product.quantity < 10 ? "red" : "green"} label="Stock" value={number(product.quantity)} caption={`${number(product.reservedQuantity)} reserved`} />
            <KpiCard icon={PackageCheck} tone="amber" label="Orders" value={number(product.orderCount)} caption={`${number(product.viewCount)} views`} />
            <KpiCard icon={Layers} tone="zinc" label="Floor Price" value={money(product.minAcceptablePrice)} caption="AI negotiation floor" />
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
                    <span className="text-zinc-500">Cost</span>
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
                      <p className="text-zinc-400">Vendor</p>
                      {product.vendor?.id ? (
                        <Link href={`/dashboard/vendors/${product.vendor.id}`} className="mt-1 block font-medium text-zinc-900 hover:underline">{product.vendor.businessName}</Link>
                      ) : (
                        <p className="mt-1 font-medium text-zinc-900">{product.vendor?.businessName || "No vendor"}</p>
                      )}
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
              <DialogDescription>Update pricing, stock, colors, and product copy.</DialogDescription>
            </DialogHeader>
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
                  discountedPrice: payload.discountedPrice ? Number(payload.discountedPrice) : undefined,
                  minAcceptablePrice: Number(payload.minAcceptablePrice || 0),
                  quantity: Number(payload.quantity || 0),
                  images: editImages,
                  colors: String(payload.colors || "").split(",").map((item) => item.trim()).filter(Boolean),
                  sizes: String(payload.sizes || "").split(",").map((item) => item.trim()).filter(Boolean),
                  status: payload.status,
                });
                query.refetch();
                setEditing(false);
              }}
            >
              <div className="space-y-1.5 sm:col-span-2"><Label>Title</Label><Input name="title" defaultValue={product.title} required /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Description</Label><textarea name="description" defaultValue={product.description} className="min-h-20 w-full rounded-md border bg-background p-2 text-sm" /></div>
              {[
                ["costPrice", "Cost", product.costPrice],
                ["sellingPrice", "Selling", product.sellingPrice],
                ["discountedPrice", "Discount", product.discountedPrice || ""],
                ["minAcceptablePrice", "Floor", product.minAcceptablePrice],
                ["quantity", "Stock", product.quantity],
              ].map(([name, label, value]) => <div key={name} className="space-y-1.5"><Label>{label}</Label><Input name={String(name)} type="number" defaultValue={String(value)} /></div>)}
              <div className="space-y-1.5"><Label>Status</Label><select name="status" defaultValue={product.status} className="h-9 w-full rounded-md border bg-background px-2 text-sm"><option value="draft">Draft</option><option value="pending_approval">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="disabled">Disabled</option></select></div>
              <div className="space-y-1.5"><Label>Colors</Label><Input name="colors" defaultValue={(product.colors || []).join(", ")} /></div>
              <div className="space-y-1.5"><Label>Sizes</Label><Input name="sizes" defaultValue={(product.sizes || []).join(", ")} /></div>
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
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
