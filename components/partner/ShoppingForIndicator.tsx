"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { useSelectedCustomer } from "@/lib/use-selected-customer";

/**
 * Compact, always-visible header pill so a Partner never loses track of who
 * they're shopping for — shown on every page, not just Browse/Basket.
 */
export function ShoppingForIndicator() {
  const { customer } = useSelectedCustomer();

  if (!customer) {
    return (
      <Link
        href="/partner/customers"
        className="flex items-center gap-1.5 rounded-full border border-dashed border-[#D9D9D9] bg-white px-3 py-1.5"
      >
        <UserRound size={13} className="text-[#8F8F8F]" />
        <span className="text-[12px] font-semibold text-[#8F8F8F]">No customer</span>
      </Link>
    );
  }

  const name =
    `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || String(customer.email || "");

  return (
    <Link
      href="/partner/customers"
      className="flex max-w-[42vw] items-center gap-1.5 rounded-full bg-[#FFF3C4] px-3 py-1.5"
    >
      <span className="grid size-4 shrink-0 place-items-center rounded-full bg-white text-[9px] font-black">
        {name.slice(0, 1).toUpperCase()}
      </span>
      <span className="truncate text-[12px] font-bold text-[#9a7400]">{name}</span>
    </Link>
  );
}
