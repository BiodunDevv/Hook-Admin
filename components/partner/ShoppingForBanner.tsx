"use client";

import Link from "next/link";
import { ArrowRight, UserRound, X } from "lucide-react";

export type SelectedCustomer = {
  publicId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  [key: string]: unknown;
};

/** Persistent context strip so the Partner always knows who they're shopping for. */
export function ShoppingForBanner({
  customer,
  basketCount,
  onClear,
}: {
  customer: SelectedCustomer | null;
  basketCount: number;
  onClear: () => void;
}) {
  if (!customer) {
    return (
      <Link
        href="/partner/customers"
        className="mb-5 flex items-center gap-3 rounded-[10px] border border-dashed border-[#D9D9D9] bg-white px-4 py-3.5"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#EAEBE7]">
          <UserRound className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold text-black">No customer selected</span>
          <span className="block text-[12px] text-[#8F8F8F]">
            Choose who you&apos;re shopping for
          </span>
        </span>
        <ArrowRight className="size-4 shrink-0 text-[#A3A3A6]" />
      </Link>
    );
  }

  const name =
    `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || String(customer.email || "");

  return (
    <div className="mb-5 flex items-center gap-3 rounded-[10px] bg-[#FFF3C4] px-4 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-[13px] font-black">
        {name.slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9a7400]">
          Shopping for
        </p>
        <p className="truncate text-[14px] font-bold text-black">{name}</p>
      </div>
      <Link
        href="/partner/basket"
        className="relative shrink-0 rounded-full bg-black px-3.5 py-2 text-[12px] font-bold text-white"
      >
        Basket
        {basketCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-[#FFC809] px-1 text-[10px] font-black text-black ring-2 ring-[#FFF3C4]">
            {basketCount}
          </span>
        )}
      </Link>
      <button
        type="button"
        onClick={onClear}
        className="grid size-8 shrink-0 place-items-center rounded-full text-[#9a7400] transition hover:bg-black/5"
        aria-label="Clear selected customer"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
