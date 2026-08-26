"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Info, X } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useApiPost, useApiQuery } from "@/lib/query";
import { HookLoader } from "@/components/shared/HookLoader";
import { MediaPicker } from "@/components/shared/MediaPicker";
interface CategoryOption { id: string; name: string; isActive?: boolean; }
function csv(value: FormDataEntryValue | null) {
  return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
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

export default function NewProductPage() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState(["#111827", "#ffffff"]);
  const [colorValue, setColorValue] = useState("#fbbf24");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("pending_approval");
  const categories = useApiQuery<{ data: CategoryOption[] }>(["admin", "categories", "options"], "/admin/categories");
  const createProduct = useApiPost<{ id: string }, Record<string, unknown>>("/admin/products", ["admin", "products"], { successMessage: "Product created" });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    const product = await createProduct.mutateAsync({
      ...payload,
      categoryId,
      status,
      costPrice: Number(payload.costPrice || 0),
      sellingPrice: Number(payload.sellingPrice || 0),
      minAcceptablePrice: Number(payload.minAcceptablePrice || payload.sellingPrice || 0),
      quantity: Number(payload.quantity || 0),
      images,
      colors: selectedColors,
      sizes: csv(formData.get("sizes")),
    });
    router.push(`/dashboard/products/${product.id}`);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full space-y-5 px-4 py-5">
      <PageHeader
        title="Create Product"
        description="Add inventory to Hook's commercial catalog."
        actions={<Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft size={15} /> Back</Button>}
      />
      <form onSubmit={submit}>
        <Card className="max-w-6xl rounded-lg border-zinc-200 py-0 shadow-card">
          <CardContent className="grid gap-4 p-4 lg:grid-cols-[1fr_360px]">
            <TooltipProvider>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Category</FieldLabel>
                <Select value={categoryId} onValueChange={setCategoryId} required>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {(categories.data?.data || []).filter((category) => category.isActive !== false).map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field className="md:col-span-2">
                <FieldLabel htmlFor="title">Title</FieldLabel>
                <Input id="title" name="title" required placeholder="Nike Air Max runner" />
              </Field>
              <Field className="md:col-span-2">
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea id="description" name="description" className="min-h-20" placeholder="Short product description for admin review." />
              </Field>
              <Field>
                <PriceLabel help="What this item commonly sells for outside Hook.">Market Price</PriceLabel>
                <Input name="costPrice" type="number" min="1" required placeholder="52000" />
              </Field>
              <Field>
                <PriceLabel help="The customer-facing price on Hook.">Hook Platform Price</PriceLabel>
                <Input name="sellingPrice" type="number" min="1" required placeholder="45000" />
              </Field>
              <Field>
                <PriceLabel help="Lowest price AI negotiation can accept. It must not exceed the Hook platform price.">Negotiation Floor</PriceLabel>
                <Input name="minAcceptablePrice" type="number" min="1" required placeholder="39000" />
              </Field>
              <Field>
                <FieldLabel htmlFor="quantity">Stock Quantity</FieldLabel>
                <Input id="quantity" name="quantity" type="number" min="0" required />
              </Field>
              <Field>
                <FieldLabel>Status</FieldLabel>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending_approval">Pending Approval</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field className="md:col-span-2">
                <FieldLabel>Colors</FieldLabel>
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
              </Field>
              <Field>
                <FieldLabel htmlFor="sizes">Sizes, comma separated</FieldLabel>
                <Input id="sizes" name="sizes" />
                <FieldDescription>Example: 40, 41, 42, 43</FieldDescription>
              </Field>
            </div>
            </TooltipProvider>

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
