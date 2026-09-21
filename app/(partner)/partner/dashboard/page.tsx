"use client";

import Link from "next/link";
import { ClipboardList, Package, ShoppingBag, ShoppingCart, Users } from "lucide-react";
import { HookLoader } from "@/components/shared/HookLoader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  MobileEmpty,
  MobileRow,
  MobileSection,
  MobileStat,
} from "@/components/mobile/MobileUI";
import { money } from "@/lib/admin-utils";
import { useApiQuery } from "@/lib/query";

interface PartnerOrder {
  id?: string;
  publicId?: string;
  orderCode?: string;
  commerceStatus?: string;
  commercePaymentStatus?: string;
  totalMinor?: number;
  createdAt?: string;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function PartnerDashboardPage() {
  const orders = useApiQuery<PartnerOrder[]>(["partner", "orders"], "/partner/orders");
  const rows = orders.data || [];
  const paid = (order: PartnerOrder) => ["CONFIRMED", "PAID"].includes(String(order.commercePaymentStatus || "").toUpperCase());
  const live = (order: PartnerOrder) => !["DELIVERED", "COLLECTED", "COMPLETED", "CANCELLED"].includes(String(order.commerceStatus));
  // Only paid orders count as sales, and only paid, unfinished ones await fulfilment; unpaid orders are counted separately.
  const pending = rows.filter((order) => paid(order) && live(order)).length;
  const awaitingPayment = rows.filter((order) => !paid(order) && live(order)).length;
  const totalRevenueMinor = rows.filter((order) => paid(order) && String(order.commerceStatus) !== "CANCELLED").reduce((sum, order) => sum + Number(order.totalMinor || 0), 0);

  return (
    <div>
      <div className="mb-6 px-1">
        <p className="text-[13px] text-[#8F8F8F]">{greeting()} 👋</p>
        <h1 className="mt-0.5 text-[22px] font-bold leading-tight text-black">Your counter</h1>
      </div>

      {orders.isError ? (
        <div className="rounded-[10px] bg-white p-5 text-center">
          <p className="text-[15px] font-semibold text-black">Your dashboard could not load</p>
          <p className="mt-1 text-[13px] text-[#8F8F8F]">Check your connection and try again.</p>
          <button type="button" onClick={() => void orders.refetch()} className="mt-4 rounded-full bg-[#FFC809] px-5 py-2.5 text-[14px] font-bold text-black">Try again</button>
        </div>
      ) : orders.isLoading ? (
        <div className="grid min-h-40 place-items-center">
          <HookLoader label="Loading dashboard" />
        </div>
      ) : (
        <>
          <div className="mb-7 grid grid-cols-2 gap-3">
            <MobileStat icon={ShoppingCart} label="Orders assisted" value={rows.length} />
            <MobileStat icon={ClipboardList} label="Awaiting fulfilment" value={pending} tone="neutral" />
            <MobileStat icon={Package} label="Total sales" value={money(totalRevenueMinor)} tone="neutral" />
            <MobileStat icon={Users} label="Awaiting payment" value={awaitingPayment} tone="neutral" />
          </div>

          <MobileSection title="Quick actions">
            <MobileRow icon={ShoppingBag} label="Start assisted sale" description="Browse the Hook catalog for a customer" href="/partner/browse" />
            <MobileRow icon={Users} label="Find a customer" description="Look up or register a walk-in" href="/partner/customers" />
            <MobileRow icon={Package} label="Custody" description="Receive or release packages" href="/partner/fulfilment" />
          </MobileSection>

          <MobileSection
            title="Recent orders"
            action={
              <Link href="/partner/orders" className="text-[13px] font-semibold text-[#9a7400]">
                View all
              </Link>
            }
          >
            {rows.length ? (
              rows.slice(0, 6).map((order) => (
                <MobileRow
                  key={order.publicId || order.id}
                  icon={ShoppingCart}
                  tone="neutral"
                  label={order.publicId || order.orderCode || order.id || "Order"}
                  description={order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-NG") : undefined}
                  value={
                    <span className="flex items-center gap-2">
                      <span className="font-bold text-black">{money(order.totalMinor)}</span>
                      <StatusBadge status={order.commerceStatus || "PENDING"} />
                    </span>
                  }
                />
              ))
            ) : (
              <div className="py-2">
                <MobileEmpty
                  icon={ShoppingCart}
                  title="No assisted orders yet"
                  description="Start a sale for a customer and it will show up here."
                />
              </div>
            )}
          </MobileSection>
        </>
      )}
    </div>
  );
}
