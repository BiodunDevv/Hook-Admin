"use client";

import Image from "next/image";
import { ImageOff, Minus, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Commerce primitives styled after the Hook-App marketplace screens so the
 * Partner portal reads as the same product as the customer app.
 */

export type CatalogMedia = { type?: string; url?: string; alt?: string };

export function money(minor?: number) {
  return `₦${Math.round(Number(minor || 0) / 100).toLocaleString("en-NG")}`;
}

/** Square product image with a graceful fallback. Mirrors CatalogProductCard. */
export function ProductImage({
  src,
  alt,
  className,
  sizes = "200px",
  rounded = "rounded-xl",
}: {
  src?: string;
  alt?: string;
  className?: string;
  sizes?: string;
  rounded?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-[#FAFAFA]", rounded, className)}>
      {src ? (
        <Image src={src} alt={alt || ""} fill sizes={sizes} className="object-cover" unoptimized />
      ) : (
        <div className="flex size-full items-center justify-center">
          <ImageOff className="size-5 text-[#C4C4C8]" />
        </div>
      )}
    </div>
  );
}

/** Grid cell for browsing the catalog. 1:1 image, price, add-to-cart. */
export function ProductCard({
  title,
  imageUrl,
  effectivePriceMinor,
  sellingPriceMinor,
  discountMinor,
  marketName,
  unavailable,
  negotiable,
  busy,
  onAdd,
  onOpen,
}: {
  title: string;
  imageUrl?: string;
  effectivePriceMinor?: number;
  sellingPriceMinor?: number;
  discountMinor?: number;
  marketName?: string;
  unavailable?: boolean;
  negotiable?: boolean;
  busy?: boolean;
  onAdd?: () => void;
  onOpen?: () => void;
}) {
  const discounted = Number(discountMinor || 0) > 0;
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onOpen}
        disabled={!onOpen}
        className="relative text-left"
        aria-label={onOpen ? `Open ${title}` : undefined}
      >
        <ProductImage
          src={imageUrl}
          alt={title}
          className={cn("aspect-square w-full", unavailable && "opacity-50")}
          sizes="(max-width: 640px) 45vw, 200px"
        />
        {unavailable ? (
          <span className="absolute bottom-2 left-2 rounded-full bg-black px-2.5 py-1.5 text-[9px] font-bold text-white">
            Unavailable
          </span>
        ) : marketName ? (
          <span className="absolute bottom-2 left-2 max-w-24 truncate rounded-full bg-white/85 px-2 py-1 text-[9px] font-medium text-black">
            {marketName}
          </span>
        ) : null}
        {negotiable && !unavailable && (
          <span className="absolute right-2 top-2 rounded-full bg-[#FFF2B8] px-2 py-1 text-[9px] font-black text-[#765700]">
            Negotiable
          </span>
        )}
      </button>

      <p className="mt-2 truncate text-[13px] font-semibold text-black">{title}</p>
      <div className={cn("mt-1 flex items-center gap-2", unavailable && "opacity-45")}>
        <span className="text-[13px] font-black text-[#E7B200]">{money(effectivePriceMinor)}</span>
        {discounted && (
          <span className="text-[10px] text-[#888] line-through">{money(sellingPriceMinor)}</span>
        )}
      </div>

      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          disabled={busy || unavailable}
          className="mt-2 flex min-h-10 items-center justify-center rounded-full bg-[#FFC809] text-[13px] font-bold text-black transition active:opacity-80 disabled:bg-[#E4E4E6] disabled:opacity-60"
        >
          {busy ? "Adding…" : unavailable ? "Unavailable" : "Add to cart"}
        </button>
      )}
    </div>
  );
}

/** Basket line with thumbnail, quantity stepper, and remove. */
export function BasketLine({
  title,
  imageUrl,
  unitPriceMinor,
  totalPriceMinor,
  quantity,
  negotiated,
  busy,
  onIncrease,
  onDecrease,
  onRemove,
}: {
  title: string;
  imageUrl?: string;
  unitPriceMinor?: number;
  totalPriceMinor?: number;
  quantity: number;
  negotiated?: { agreedPriceMinor?: number; originalPriceMinor?: number };
  busy?: boolean;
  onIncrease?: () => void;
  onDecrease?: () => void;
  onRemove?: () => void;
}) {
  return (
    <div className="flex gap-3 border-b border-[#D9D9D9] py-3 last:border-b-0">
      <ProductImage src={imageUrl} alt={title} className="size-16 shrink-0" sizes="64px" rounded="rounded-[10px]" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-black">{title}</p>
        <p className="mt-0.5 text-[12px] text-[#8F8F8F]">
          {money(unitPriceMinor)} each · {money(totalPriceMinor)} total
        </p>
        {negotiated?.agreedPriceMinor ? (
          <span className="mt-1.5 inline-block rounded-full bg-[#FFF2B8] px-2 py-0.5 text-[10px] font-black text-[#765700]">
            Negotiated {money(negotiated.agreedPriceMinor)}
          </span>
        ) : null}

        <div className="mt-2 flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-[#EAEBE7] p-1">
            <button
              type="button"
              onClick={onDecrease}
              disabled={busy || quantity <= 1}
              className="grid size-7 place-items-center rounded-full bg-black text-white disabled:opacity-30"
              aria-label="Decrease quantity"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-7 text-center text-[13px] font-semibold tabular-nums">
              {String(quantity).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={onIncrease}
              disabled={busy}
              className="grid size-7 place-items-center rounded-full bg-black text-white disabled:opacity-30"
              aria-label="Increase quantity"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            className="grid size-8 place-items-center rounded-full text-[#8F8F8F] transition hover:bg-black/5 disabled:opacity-40"
            aria-label={`Remove ${title}`}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Negotiation transcript bubble, mirroring the native chat. */
export function ChatBubble({
  role,
  message,
  offeredPriceMinor,
  createdAt,
}: {
  role: "customer" | "hook";
  message: string;
  offeredPriceMinor?: number;
  createdAt?: string;
}) {
  const mine = role === "customer";
  return (
    <div
      className={cn(
        "max-w-[85%] rounded-2xl px-4 py-2.5",
        mine
          ? "self-end rounded-tr-sm bg-[#FFF0AE]"
          : "self-start rounded-tl-sm bg-white shadow-sm",
      )}
    >
      <p className="text-[14px] leading-5 text-black">{message}</p>
      {offeredPriceMinor ? (
        <p className="mt-1.5 text-[14px] font-black text-black">Offer: {money(offeredPriceMinor)}</p>
      ) : null}
      {createdAt ? (
        <p className="mt-1 text-right text-[9px] text-[#888]">
          {new Date(createdAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
        </p>
      ) : null}
    </div>
  );
}
