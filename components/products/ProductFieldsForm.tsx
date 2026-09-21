"use client";

import { CategoryPicker } from "@/components/categories/CategoryPicker";
import { attributeOptions, resolveAttributes, type CategoryOption } from "@/lib/category-attributes";
import { ColorLabel } from "@/components/shared/ColorLabel";
import { colorName } from "@/lib/color-name";
import { Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type { CategoryOption };

export interface MarketOption {
  id: string;
  publicId?: string;
  name: string;
  status?: string;
  stateName?: string;
  state?: { name?: string };
}

export interface ProductFieldsValue {
  categoryId: string;
  marketId: string;
  status: string;
  colors: string[];
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

/**
 * The product-content field grid shared by the New Product form and Product
 * Submission approval — same fields, same labels/tooltips, same validation,
 * so a product created either way ends up with an identical shape.
 */
export function ProductFieldsForm({
  categories,
  markets,
  value,
  onChange,
  colorValue,
  onColorValueChange,
  defaults,
  lockedMarketName,
}: {
  categories: CategoryOption[];
  markets: MarketOption[];
  value: ProductFieldsValue;
  onChange: (next: Partial<ProductFieldsValue>) => void;
  colorValue: string;
  onColorValueChange: (value: string) => void;
  defaults?: {
    title?: string;
    description?: string;
    costPrice?: number | string;
    sellingPrice?: number | string;
    minAcceptablePrice?: number | string;
    quantity?: number | string;
    sizes?: string;
  };
  /**
   * When set, the Market field renders as a read-only display of this name
   * instead of a picker — the product stays tied to the Market Associate's
   * assigned market rather than letting the admin reassign it.
   */
  lockedMarketName?: string;
}) {
  // What the chosen category asks for: no size for gadgets, colour optional for some.
  const leaf = categories.find((category) => category.id === value.categoryId);
  const attributes = resolveAttributes(leaf, categories);
  const known = attributes.length > 0;
  const sizeAttribute = attributes.find((attribute) => attribute.type === "size");
  const showSizes = !known || Boolean(sizeAttribute);
  const showColours = !known || attributes.some((attribute) => attribute.type === "colour");
  const sizeSuggestions = sizeAttribute ? attributeOptions(sizeAttribute) : undefined;

  return (
    <TooltipProvider>
      <div className="grid gap-4 md:grid-cols-2">
        <CategoryPicker categories={categories} value={value.categoryId} onChange={(next) => onChange({ categoryId: next })} />
        <Field>
          <FieldLabel>Market</FieldLabel>
          {lockedMarketName !== undefined ? (
            <>
              <div className="flex h-9 w-full items-center rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700">
                {lockedMarketName || "Assigned market"}
              </div>
              <FieldDescription>Fixed to the Market Associate&apos;s assigned market — it cannot be reassigned here.</FieldDescription>
            </>
          ) : (
            <>
              <Select value={value.marketId} onValueChange={(next) => onChange({ marketId: next })} required>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select active Market" /></SelectTrigger>
                <SelectContent>
                  {markets.filter((market) => market.status === "active").map((market) => (
                    <SelectItem key={market.publicId || market.id} value={market.publicId || market.id}>
                      {market.name}{market.stateName || market.state?.name ? ` · ${market.stateName || market.state?.name}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>The product inherits its operating State from this Market.</FieldDescription>
            </>
          )}
        </Field>
        <Field className="md:col-span-2">
          <FieldLabel htmlFor="title">Title</FieldLabel>
          <Input id="title" name="title" required placeholder="Nike Air Max runner" defaultValue={defaults?.title} />
        </Field>
        <Field className="md:col-span-2">
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea
            id="description"
            name="description"
            required
            minLength={20}
            className="min-h-20"
            placeholder="Describe the product, material, condition, and what the customer receives."
            defaultValue={defaults?.description}
          />
        </Field>
        <Field>
          <PriceLabel help="What Hook pays for this item. Negotiation can never go below this.">Cost Price</PriceLabel>
          <Input name="costPrice" type="number" min="1" required placeholder="52000" defaultValue={defaults?.costPrice} />
        </Field>
        <Field>
          <PriceLabel help="The customer-facing price on Hook.">Hook Platform Price</PriceLabel>
          <Input name="sellingPrice" type="number" min="1" required placeholder="45000" defaultValue={defaults?.sellingPrice} />
        </Field>
        <Field>
          <PriceLabel help="Lowest price AI negotiation can accept. It must not exceed the Hook platform price.">Negotiation Floor</PriceLabel>
          <Input name="minAcceptablePrice" type="number" min="1" required placeholder="39000" defaultValue={defaults?.minAcceptablePrice} />
        </Field>
        <Field>
          <FieldLabel htmlFor="quantity">Stock Quantity</FieldLabel>
          <Input id="quantity" name="quantity" type="number" min="0" required defaultValue={defaults?.quantity} />
        </Field>
        <Field>
          <FieldLabel>Status</FieldLabel>
          <Select value={value.status} onValueChange={(next) => onChange({ status: next })}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="published">Active on Hook</SelectItem>
              <SelectItem value="draft">Save as draft</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        {showColours ? <Field className="md:col-span-2">
          <FieldLabel>Colors</FieldLabel>
          <div className="flex flex-wrap items-center gap-2">
            {value.colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onChange({ colors: value.colors.filter((item) => item !== color) })}
                className="flex h-8 items-center gap-2 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-600"
              >
                <ColorLabel value={color} swatchClassName="size-4" />
                <X size={12} />
              </button>
            ))}
            <input
              value={colorValue}
              onChange={(event) => onColorValueChange(event.target.value)}
              type="color"
              className="h-8 w-10 rounded-md border border-zinc-200 bg-white p-1"
              aria-label="Pick product color"
            />
            <span className="text-xs text-zinc-500">{colorName(colorValue)}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange({ colors: value.colors.includes(colorValue) ? value.colors : [...value.colors, colorValue] })}
            >
              Add color
            </Button>
          </div>
        </Field> : null}
        {showSizes ? <Field>
          <FieldLabel htmlFor="sizes">{sizeAttribute?.label || "Sizes"}, comma separated</FieldLabel>
          <Input id="sizes" name="sizes" defaultValue={defaults?.sizes} />
          <FieldDescription>
            {sizeSuggestions ? `Options: ${sizeSuggestions.join(", ")}` : "Example: 40, 41, 42, 43"}
          </FieldDescription>
        </Field> : null}
        {known && !showSizes ? (
          <p className="rounded-md border border-dashed bg-zinc-50 px-3 py-2 text-xs text-zinc-500 md:col-span-2">
            {leaf?.name} has no sizes. Other details ({attributes.filter((attribute) => attribute.type !== "size" && attribute.type !== "colour").map((attribute) => attribute.label).join(", ") || "none"}) come from the Market Associate&apos;s capture.
          </p>
        ) : null}
      </div>
    </TooltipProvider>
  );
}

export function csv(value: FormDataEntryValue | null) {
  return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
}
