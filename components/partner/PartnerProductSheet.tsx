"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Info, Minus, Plus, ShoppingBag, Tag } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { HookLoader } from "@/components/shared/HookLoader";
import { MobileButton } from "@/components/mobile/MobileUI";
import { ProductImage, money } from "@/components/mobile/MobileCommerce";
import { displayColorName, swatchFor } from "@/components/mobile/ColorPicker";
import { apiPost } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import type { SizingGuide } from "@/lib/sizing-guide";

type Variant = {
  publicId: string;
  size?: string;
  colour?: string;
  attributes?: Record<string, string>;
};

type ProductDetail = {
  publicId: string;
  title?: string;
  description?: string;
  media?: Array<{ url?: string; alt?: string }>;
  variants?: Variant[];
  currency?: string;
  sellingPriceMinor?: number;
  effectivePriceMinor?: number;
  discountMinor?: number;
  negotiationAvailable?: boolean;
  isPurchasable?: boolean;
  market?: { name?: string };
  category?: { sizingGuide?: SizingGuide | null } | null;
};

/** Product detail with gallery, variant picker, add-to-cart, and negotiate. */
export function PartnerProductSheet({
  productId,
  customerId,
  open,
  onClose,
}: {
  productId?: string;
  customerId?: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeImage, setActiveImage] = useState(0);
  const [chosenVariantId, setChosenVariantId] = useState<string>();
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const query = useApiQuery<ProductDetail>(
    ["partner", "product", productId],
    `/public/products/${productId}`,
    Boolean(productId && open),
  );

  const product = query.data;
  const variants = useMemo(() => product?.variants || [], [product]);
  /**
   * Derived, not stored: a single-option product needs no explicit choice.
   * The sheet is keyed by productId, so state resets on close without effects.
   */
  const variantId = chosenVariantId ?? (variants.length === 1 ? variants[0].publicId : undefined);
  const selectedVariant = variants.find((variant) => variant.publicId === variantId);

  const colorOptions = useMemo(() => {
    const values = new Map<string, string>();
    variants.forEach((variant) => {
      const value = displayColorName(variant.colour);
      if (value && !values.has(value.toLowerCase())) values.set(value.toLowerCase(), value);
    });
    return [...values.values()];
  }, [variants]);

  const sizeOptions = useMemo(() => {
    const values = new Set<string>();
    variants.forEach((variant) => {
      if (variant.size) values.add(variant.size);
    });
    return [...values];
  }, [variants]);

  const selectedColor = displayColorName(selectedVariant?.colour) || "";

  function chooseColor(value: string) {
    const matching =
      variants.find(
        (variant) =>
          displayColorName(variant.colour)?.toLowerCase() === value.toLowerCase() &&
          (!selectedVariant?.size || !variant.size || variant.size === selectedVariant.size),
      ) || variants.find((variant) => displayColorName(variant.colour)?.toLowerCase() === value.toLowerCase());
    if (matching) setChosenVariantId(matching.publicId);
  }

  function chooseSize(value: string) {
    const matching =
      variants.find(
        (variant) =>
          variant.size === value &&
          (!selectedColor || displayColorName(variant.colour)?.toLowerCase() === selectedColor.toLowerCase()),
      ) || variants.find((variant) => variant.size === value);
    if (matching) setChosenVariantId(matching.publicId);
  }

  async function addToCart() {
    if (!customerId || !productId) return;
    if (!variantId) {
      toast.info("Choose a size or colour before adding to cart");
      return;
    }
    setBusy(true);
    try {
      await apiPost(`/partner/customers/${customerId}/cart/items`, {
        productId,
        quantity,
        variantId,
      });
      await queryClient.invalidateQueries({ queryKey: ["partner", "basket"] });
      toast.success("Added to cart");
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Could not add to cart",
      );
    } finally {
      setBusy(false);
    }
  }

  async function negotiate() {
    if (!customerId || !productId) return;
    if (!variantId) {
      toast.info("Choose an option before negotiating");
      return;
    }
    setBusy(true);
    try {
      const created = await apiPost<{ negotiationId: string }>(
        `/partner/customers/${customerId}/negotiations`,
        { productId, variantId, quantity },
      );
      onClose();
      router.push(
        `/partner/messages/${created.negotiationId}?customerId=${encodeURIComponent(customerId)}`,
      );
    } catch (error) {
      // ACTIVE_NEGOTIATION_EXISTS returns the live session as error details —
      // resume it instead of surfacing an error.
      const failure = error as { code?: string; details?: { negotiationId?: string } };
      const existing = failure?.details?.negotiationId;
      if (failure?.code === "ACTIVE_NEGOTIATION_EXISTS" && existing) {
        onClose();
        router.push(`/partner/messages/${existing}?customerId=${encodeURIComponent(customerId)}`);
        return;
      }
      toast.error(
        error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Negotiation could not start",
      );
    } finally {
      setBusy(false);
    }
  }

  const media = product?.media || [];
  const discounted = Number(product?.discountMinor || 0) > 0;
  const unavailable = product?.isPurchasable === false;

  return (
    <Sheet open={open} onOpenChange={(next) => !next && !busy && onClose()}>
      <SheetContent
        side="bottom"
        className="mx-auto flex max-h-[92dvh] w-full max-w-2xl flex-col rounded-t-2xl border-x bg-[#F5F5F5] p-0"
      >
        <SheetHeader className="shrink-0 px-5 pb-2 pt-5">
          <SheetTitle className="truncate text-[19px] font-bold">
            {product?.title || "Product"}
          </SheetTitle>
          <SheetDescription className="text-[13px] text-[#8F8F8F]">
            {product?.market?.name ? `From ${product.market.name}` : "Hook catalog"}
          </SheetDescription>
        </SheetHeader>

        {query.isLoading ? (
          <div className="grid min-h-60 place-items-center">
            <HookLoader label="Loading product" />
          </div>
        ) : !product ? (
          <p className="p-5 text-sm text-destructive">This product could not be loaded.</p>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 pb-5">
            <ProductImage
              src={media[activeImage]?.url}
              alt={product.title}
              className="aspect-square w-full"
              sizes="(max-width: 640px) 90vw, 480px"
              rounded="rounded-[14px]"
            />
            {media.length > 1 && (
              <div className="mt-3 flex justify-center gap-1.5">
                {media.slice(0, 5).map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`Image ${index + 1}`}
                    className={`h-2 rounded-full transition-all ${index === activeImage ? "w-5 bg-[#FFC809]" : "w-2 bg-[#96969B]"}`}
                  />
                ))}
              </div>
            )}

            <div className="mt-4 flex items-center gap-2">
              <span className="text-[20px] font-black text-[#E7B200]">
                {money(product.effectivePriceMinor)}
              </span>
              {discounted && (
                <span className="text-[13px] text-black/50 line-through">
                  {money(product.sellingPriceMinor)}
                </span>
              )}
            </div>

            {product.description && (
              <div className="mt-4 rounded-[10px] bg-white px-4 py-3">
                <p className="text-[14px] font-semibold">Details</p>
                <p className="mt-1.5 text-[14px] leading-6 text-black/60">{product.description}</p>
              </div>
            )}

            {colorOptions.length > 0 && (
              <div className="mt-4">
                <p className="text-[14px] font-semibold">
                  Colour
                  {!variantId && <span className="ml-1 text-[#C53B35]">*</span>}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {colorOptions.map((value) => {
                    const selected = selectedColor.toLowerCase() === value.toLowerCase();
                    const swatch = swatchFor(value);
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => chooseColor(value)}
                        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[13px] transition ${
                          selected ? "border-black bg-white font-semibold" : "border-black/25 bg-white/50"
                        }`}
                      >
                        <span
                          className="grid size-5 shrink-0 place-items-center rounded-full border border-black/10"
                          style={{ background: swatch || "#E2E2E2" }}
                        >
                          {selected && (
                            <Check
                              className="size-3"
                              style={{ color: value === "White" || value === "Cream" ? "#111" : "#fff" }}
                            />
                          )}
                        </span>
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {sizeOptions.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-semibold">
                    Size
                    {!variantId && <span className="ml-1 text-[#C53B35]">*</span>}
                  </p>
                  {product.category?.sizingGuide?.summary && (
                    <button
                      type="button"
                      onClick={() => setSizeGuideOpen(true)}
                      className="flex items-center gap-1 text-[12px] font-semibold text-[#8F8F8F]"
                    >
                      <Info className="size-3.5" /> Size guide
                    </button>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {sizeOptions.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => chooseSize(size)}
                      className={`min-w-10 rounded-md border px-3 py-2 text-center text-[14px] transition ${
                        selectedVariant?.size === size
                          ? "border-black bg-black text-white font-semibold"
                          : "border-black/25 bg-white/50"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(colorOptions.length > 0 || sizeOptions.length > 0) && !variantId && (
              <p className="mt-1.5 text-[12px] text-[#C53B35]">Required before adding to cart</p>
            )}

            <div className="mt-4 flex items-center gap-3">
              <p className="text-[14px] font-semibold">Quantity</p>
              <div className="flex items-center gap-1 rounded-full bg-[#E2E2E2] p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  disabled={quantity <= 1}
                  className="grid size-7 place-items-center rounded-full bg-black text-white disabled:opacity-30"
                  aria-label="Decrease quantity"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="w-8 text-center text-[13px] font-semibold tabular-nums">
                  {String(quantity).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.min(20, value + 1))}
                  disabled={quantity >= 20}
                  className="grid size-7 place-items-center rounded-full bg-black text-white disabled:opacity-30"
                  aria-label="Increase quantity"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {product && !query.isLoading && (
          <div className="shrink-0 space-y-2 border-t border-black/5 bg-[#F5F5F5] px-5 py-4">
            {!customerId ? (
              <p className="rounded-[10px] bg-white p-3 text-center text-[13px] text-[#8F8F8F]">
                Choose a customer before adding products.
              </p>
            ) : (
              <>
                <MobileButton disabled={busy || unavailable || !variantId} onClick={() => void addToCart()}>
                  {busy ? <HookLoader size="button" /> : <><ShoppingBag size={17} /> Add to cart</>}
                </MobileButton>
                {product.negotiationAvailable && !unavailable && (
                  <MobileButton variant="outline" disabled={busy || !variantId} onClick={() => void negotiate()}>
                    <Tag size={17} /> Negotiate price
                  </MobileButton>
                )}
              </>
            )}
          </div>
        )}
      </SheetContent>

      <Sheet open={sizeGuideOpen} onOpenChange={setSizeGuideOpen}>
        <SheetContent side="bottom" className="mx-auto flex max-h-[80dvh] w-full max-w-2xl flex-col rounded-t-2xl border-x">
          <SheetHeader>
            <SheetTitle className="text-[17px] font-bold">Size guide</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto px-5 pb-6">
            {product?.category?.sizingGuide?.summary && (
              <p className="text-[14px] leading-6 text-black">{product.category.sizingGuide.summary}</p>
            )}
            {product?.category?.sizingGuide?.howToMeasure && (
              <p className="mt-3 whitespace-pre-line text-[13px] leading-6 text-black/70">
                {product.category.sizingGuide.howToMeasure}
              </p>
            )}
            {product?.category?.sizingGuide?.chart?.length ? (
              <div className="mt-4 overflow-hidden rounded-[10px] bg-[#F5F5F5]">
                {product.category.sizingGuide.chart.map((row, index) => (
                  <div key={row.size} className={`px-4 py-3 ${index ? "border-t border-black/5" : ""}`}>
                    <p className="text-[13px] font-bold">{row.size}</p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                      {Object.entries(row.measurements).map(([label, value]) => (
                        <span key={label} className="text-[12px] text-black/60">
                          {label}: {value}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </Sheet>
  );
}
