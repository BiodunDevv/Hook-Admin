"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUp, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { HookLoader } from "@/components/shared/HookLoader";
import { MobileButton } from "@/components/mobile/MobileUI";
import { ChatBubble, ProductImage, money } from "@/components/mobile/MobileCommerce";
import { Textarea } from "@/components/ui/textarea";
import { apiPost } from "@/lib/api";
import { useApiQuery } from "@/lib/query";

type Transcript = {
  role: "customer" | "hook";
  message: string;
  offeredPriceMinor?: number;
  decision?: string;
  createdAt?: string;
};

type Negotiation = {
  negotiationId: string;
  status: string;
  offerCount?: number;
  maximumOffers?: number;
  remainingOffers?: number;
  transcript?: Transcript[];
  expiresAt?: string;
  quoteId?: string;
  agreedPriceMinor?: number;
  lastCounterPriceMinor?: number;
  product?: { id?: string; title?: string; imageUrl?: string; effectivePriceMinor?: number };
};

export function PartnerNegotiationChat({
  negotiationId,
  customerId,
}: {
  negotiationId: string;
  customerId: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const base = `/partner/customers/${customerId}/negotiations`;
  const query = useApiQuery<Negotiation>(
    ["partner", "negotiation", negotiationId],
    `${base}/${negotiationId}`,
    Boolean(negotiationId && customerId),
  );

  const transcript = query.data?.transcript;
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript?.length]);

  async function send() {
    const text = message.trim();
    if (!text) return;
    setSending(true);
    try {
      await apiPost(`${base}/${negotiationId}/offers`, { message: text });
      setMessage("");
      await queryClient.invalidateQueries({ queryKey: ["partner", "negotiation", negotiationId] });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Message could not be sent",
      );
    } finally {
      setSending(false);
    }
  }

  async function accept() {
    setSending(true);
    try {
      await apiPost(`${base}/${negotiationId}/accept`, {});
      await queryClient.invalidateQueries({ queryKey: ["partner", "negotiation", negotiationId] });
      await queryClient.invalidateQueries({ queryKey: ["partner", "negotiations"] });
      toast.success("Price locked — add it to the cart");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Could not accept this price",
      );
    } finally {
      setSending(false);
    }
  }

  async function addToCart() {
    const quoteId = query.data?.quoteId;
    const productId = query.data?.product?.id;
    if (!quoteId || !productId) return;
    setSending(true);
    try {
      await apiPost(`/partner/customers/${customerId}/cart/items`, {
        productId,
        quantity: 1,
        quoteId,
      });
      await queryClient.invalidateQueries({ queryKey: ["partner", "basket"] });
      toast.success("Added at the negotiated price");
      router.push("/partner/basket");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Could not add to cart",
      );
    } finally {
      setSending(false);
    }
  }

  if (query.isLoading)
    return (
      <div className="grid min-h-80 place-items-center">
        <HookLoader label="Loading negotiation" />
      </div>
    );
  if (query.isError || !query.data)
    return <p className="text-sm text-destructive">This negotiation could not be loaded.</p>;

  const negotiation = query.data;
  const active = negotiation.status === "active";
  const agreed = negotiation.status === "agreed";
  const bestPrice = negotiation.agreedPriceMinor || negotiation.lastCounterPriceMinor;

  return (
    <div className="flex min-h-[70vh] flex-col">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1.5 px-1 text-[13px] font-semibold text-[#8F8F8F]"
      >
        <ArrowLeft size={15} /> Messages
      </button>

      <div className="mb-4 flex items-center gap-3 rounded-[10px] bg-white p-3">
        <ProductImage
          src={negotiation.product?.imageUrl}
          alt={negotiation.product?.title}
          className="size-14 shrink-0"
          sizes="56px"
          rounded="rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-black text-black">
            {negotiation.product?.title || "Product"}
          </p>
          <p className="mt-0.5 text-[13px] text-[#666]">
            Hook price {money(negotiation.product?.effectivePriceMinor)}
          </p>
        </div>
        {active && Number(negotiation.remainingOffers) >= 0 && (
          <span className="shrink-0 rounded-full bg-[#FFF3BF] px-3 py-2 text-[11px] font-black text-[#755900]">
            {negotiation.remainingOffers} left
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 rounded-[10px] bg-[#F0F0F1] p-4">
        {(negotiation.transcript || []).map((entry, index) => (
          <ChatBubble
            key={`${entry.createdAt}-${index}`}
            role={entry.role}
            message={entry.message}
            offeredPriceMinor={entry.offeredPriceMinor}
            createdAt={entry.createdAt}
          />
        ))}
        {!negotiation.transcript?.length && (
          <p className="py-8 text-center text-[13px] text-[#8F8F8F]">
            Make the first offer for your customer.
          </p>
        )}

        {agreed && bestPrice ? (
          <div className="mt-2 self-center rounded-2xl border border-[#F0D56B] bg-[#FFF7D6] px-4 py-3 text-center">
            <p className="text-[12px] font-bold text-[#755900]">Agreed price</p>
            <p className="mt-1 text-xl font-black">{money(bestPrice)}</p>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <div className="mt-4 space-y-2">
        {agreed && negotiation.quoteId ? (
          <MobileButton disabled={sending} onClick={() => void addToCart()}>
            {sending ? <HookLoader size="button" /> : <><ShoppingBag size={17} /> Add to cart at {money(bestPrice)}</>}
          </MobileButton>
        ) : active && bestPrice ? (
          <MobileButton disabled={sending} onClick={() => void accept()}>
            {sending ? <HookLoader size="button" /> : `Accept ${money(bestPrice)}`}
          </MobileButton>
        ) : null}

        {active && (
          <div className="flex items-end gap-2 rounded-[24px] bg-white p-1.5 pl-4">
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Message or offer, e.g. ₦25,000"
              maxLength={500}
              rows={1}
              className="max-h-24 min-h-11 flex-1 resize-none border-0 bg-transparent px-0 py-3 text-sm shadow-none focus-visible:ring-0"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void send();
                }
              }}
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={sending || !message.trim()}
              className="grid size-11 shrink-0 place-items-center rounded-full bg-[#FFC809] disabled:opacity-40"
              aria-label="Send"
            >
              {sending ? <HookLoader size="button" variant="dark" /> : <ArrowUp size={18} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
