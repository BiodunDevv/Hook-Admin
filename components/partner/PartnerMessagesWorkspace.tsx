"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MessagesSquare, UserRound } from "lucide-react";
import { HookLoader } from "@/components/shared/HookLoader";
import { MobileButton, MobileEmpty, MobileHeader } from "@/components/mobile/MobileUI";
import { ProductImage, money } from "@/components/mobile/MobileCommerce";
import { useApiQuery } from "@/lib/query";
import { useSelectedCustomer } from "@/lib/use-selected-customer";

type NegotiationRow = {
  negotiationId: string;
  status: string;
  offerCount?: number;
  maximumOffers?: number;
  remainingOffers?: number;
  expiresAt?: string;
  agreedPriceMinor?: number;
  transcript?: Array<{ role: string; message: string; createdAt?: string }>;
  product?: { id?: string; title?: string; imageUrl?: string; effectivePriceMinor?: number };
};

/** Live countdown for an active session, mirroring the native messages list. */
function useCountdown(expiresAt?: string, active?: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active || !expiresAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active, expiresAt]);
  if (!expiresAt) return undefined;
  const remaining = new Date(expiresAt).getTime() - now;
  if (remaining <= 0) return "00:00";
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function PartnerMessagesWorkspace() {
  const { customer } = useSelectedCustomer();

  const query = useApiQuery<NegotiationRow[]>(
    ["partner", "negotiations", customer?.publicId],
    customer
      ? `/partner/customers/${customer.publicId}/negotiations`
      : "/partner/customers/none/negotiations",
    Boolean(customer),
  );

  if (!customer) {
    return (
      <div>
        <MobileHeader title="Messages" subtitle="Price negotiations you started for a customer." />
        <MobileEmpty
          icon={UserRound}
          title="Choose a customer first"
          description="Negotiations belong to the customer you're shopping for."
          action={<MobileButton href="/partner/customers">Find a customer</MobileButton>}
        />
      </div>
    );
  }

  const rows = query.data || [];
  const activeCount = rows.filter((row) => row.status === "active").length;
  const name =
    `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || String(customer.email || "");

  return (
    <div>
      <MobileHeader
        title="Messages"
        subtitle={`Negotiations for ${name}`}
        action={
          activeCount ? (
            <span className="rounded-full bg-[#FFF0F0] px-2.5 py-1 text-[11px] font-black text-[#DC2626]">
              {activeCount} active
            </span>
          ) : undefined
        }
      />

      {query.isLoading ? (
        <div className="grid min-h-40 place-items-center">
          <HookLoader label="Loading conversations" />
        </div>
      ) : rows.length ? (
        <div className="overflow-hidden rounded-[10px] bg-white">
          {rows.map((row) => (
            <ConversationRow key={row.negotiationId} row={row} customerId={customer.publicId} />
          ))}
        </div>
      ) : (
        <MobileEmpty
          icon={MessagesSquare}
          title="No negotiations yet"
          description="Start one from a negotiable product while browsing."
          action={<MobileButton href="/partner/browse">Browse products</MobileButton>}
        />
      )}
    </div>
  );
}

function ConversationRow({ row, customerId }: { row: NegotiationRow; customerId: string }) {
  const active = row.status === "active";
  const countdown = useCountdown(row.expiresAt, active);
  const last = row.transcript?.[row.transcript.length - 1];
  const statusLabel = active
    ? countdown || "Active"
    : row.status === "agreed"
      ? "Agreed"
      : row.status === "expired"
        ? "Expired"
        : "Closed";

  return (
    <Link
      href={`/partner/messages/${row.negotiationId}?customerId=${encodeURIComponent(customerId)}`}
      className="flex items-center gap-3 border-b border-[#F0F0F1] px-4 py-4 last:border-b-0 transition active:bg-black/3"
    >
      <div className="relative shrink-0">
        <ProductImage
          src={row.product?.imageUrl}
          alt={row.product?.title}
          className="size-14"
          sizes="56px"
          rounded="rounded-2xl"
        />
        <span
          className={`absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-white ${active ? "bg-[#10B981]" : "bg-[#B7B7BC]"}`}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-[15px] font-black text-[#0A0A0A]">
            {row.product?.title || "Negotiation"}
          </p>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black tabular-nums ${active ? "bg-[#FFF6CE] text-[#8A6500]" : "bg-[#F1F1F3] text-[#77777E]"}`}
          >
            {statusLabel}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-3">
          <p className="min-w-0 flex-1 truncate text-[13px] leading-5 text-[#77777E]">
            {last?.message || "Open this conversation to make an offer"}
          </p>
          {active && Number(row.remainingOffers) > 0 && (
            <span className="grid min-w-5 shrink-0 place-items-center rounded-full bg-[#FFC809] px-1.5 py-0.5 text-[10px] font-black text-black">
              {row.remainingOffers}
            </span>
          )}
          {row.status === "agreed" && row.agreedPriceMinor ? (
            <span className="shrink-0 text-[12px] font-black text-[#0A0A0A]">
              {money(row.agreedPriceMinor)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
