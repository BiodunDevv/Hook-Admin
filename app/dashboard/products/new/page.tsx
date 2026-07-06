"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiPost, useApiQuery } from "@/lib/query";
import { HookLoader } from "@/components/shared/HookLoader";
import { MediaPicker } from "@/components/shared/MediaPicker";
import type { Page } from "@/lib/admin-utils";

interface VendorOption { id: string; businessName: string; }
interface CategoryOption { id: string; name: string; }
function csv(value: FormDataEntryValue | null) {
  return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
}

export default function NewProductPage() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState(["#111827", "#ffffff"]);
  const [colorValue, setColorValue] = useState("#fbbf24");
  const vendors = useApiQuery<Page<VendorOption>>(["admin", "vendors", "options"], "/admin/vendors?limit=100");
  const categories = useApiQuery<CategoryOption[]>(["categories", "options"], "/categories");
  const createProduct = useApiPost<{ id: string }, Record<string, unknown>>("/admin/products", ["admin", "products"], { successMessage: "Product created" });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    const product = await createProduct.mutateAsync({
      ...payload,
      costPrice: Number(payload.costPrice || 0),
      sellingPrice: Number(payload.sellingPrice || 0),
      discountedPrice: payload.discountedPrice ? Number(payload.discountedPrice) : undefined,
      minAcceptablePrice: Number(payload.minAcceptablePrice || payload.sellingPrice || 0),
      quantity: Number(payload.quantity || 0),
      images,
      colors: selectedColors,
      sizes: csv(formData.get("sizes")),
    });
    router.push(`/dashboard/products/${product.id}`);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] overflow-y-auto p-2 pb-6 sm:p-4 sm:pb-8">
      <PageHeader
        title="Create Product"
        description="Add catalog inventory for a vendor."
        actions={<Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft size={15} /> Back</Button>}
      />
      <form onSubmit={submit}>
        <Card className="max-w-6xl rounded-lg border-zinc-200 py-0 shadow-card">
          <CardContent className="grid gap-4 p-4 lg:grid-cols-[1fr_360px]">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
              <Label htmlFor="vendorId">Vendor</Label>
              <select id="vendorId" name="vendorId" required className="h-9 w-full rounded-md border bg-background px-2 text-sm">
                <option value="">Select vendor</option>
                {(vendors.data?.data || []).map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.businessName}</option>)}
              </select>
            </div>
              <div className="space-y-1.5">
              <Label htmlFor="categoryId">Category</Label>
              <select id="categoryId" name="categoryId" required className="h-9 w-full rounded-md border bg-background px-2 text-sm">
                <option value="">Select category</option>
                {(categories.data || []).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </div>
              <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required placeholder="Nike Air Max runner" />
            </div>
              <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <textarea id="description" name="description" className="min-h-20 w-full rounded-md border bg-background p-2 text-sm" placeholder="Short product description for admin review." />
            </div>
            {[
              ["costPrice", "Cost Price"],
              ["sellingPrice", "Selling Price"],
              ["discountedPrice", "Discounted Price"],
              ["minAcceptablePrice", "Negotiation Floor"],
              ["quantity", "Stock Quantity"],
            ].map(([name, label]) => (
              <div key={name} className="space-y-1.5">
                <Label htmlFor={name}>{label}</Label>
                <Input id={name} name={name} type="number" min="0" required={!["discountedPrice"].includes(name)} />
              </div>
            ))}
              <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <select id="status" name="status" className="h-9 w-full rounded-md border bg-background px-2 text-sm" defaultValue="pending_approval">
                <option value="draft">Draft</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
              </select>
            </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Colors</Label>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColors((current) => current.filter((item) => item !== color))}
                      className="flex h-8 items-center gap-2 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-600"
                    >
                      <span className="size-4 rounded-full border border-zinc-200" style={{ backgroundColor: color }} />
                      {color}
                      <X size={12} />
                    </button>
                  ))}
                  <input value={colorValue} onChange={(event) => setColorValue(event.target.value)} type="color" className="h-8 w-10 rounded-md border border-zinc-200 bg-white p-1" aria-label="Pick product color" />
                  <Button type="button" variant="outline" size="sm" onClick={() => setSelectedColors((current) => current.includes(colorValue) ? current : [...current, colorValue])}>Add color</Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sizes">Sizes, comma separated</Label>
                <Input id="sizes" name="sizes" />
              </div>
            </div>

            <MediaPicker
              value={images}
              onChange={setImages}
              label="Product Images"
              description="Upload product photos to Cloudinary or add direct image links. The first image is used in catalog tables."
              className="lg:sticky lg:top-4 lg:self-start"
            />

            <div className="flex justify-end lg:col-span-2">
              <Button type="submit" variant="brand" disabled={createProduct.isPending}>
                {createProduct.isPending ? <HookLoader size="button" label="Creating..." /> : "Create Product"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
