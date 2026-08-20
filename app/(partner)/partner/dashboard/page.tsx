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
  const pending = rows.filter(
    (order) => !["DELIVERED", "COLLECTED", "COMPLETED", "CANCELLED"].includes(String(order.commerceStatus)),
  ).length;
  const totalRevenueMinor = rows.reduce((sum, order) => sum + Number(order.totalMinor || 0), 0);

  return (
    <div>
      <div className="mb-6 px-1">
        <p className="text-[13px] text-[#8F8F8F]">{greeting()} 👋</p>
        <h1 className="mt-0.5 text-[22px] font-bold leading-tight text-black">Your counter</h1>
      </div>

      {orders.isLoading ? (
        <div className="grid min-h-40 place-items-center">
          <HookLoader label="Loading dashboard" />
        </div>
      ) : (
        <>
          <div className="mb-7 grid grid-cols-2 gap-3">
            <MobileStat icon={ShoppingCart} label="Orders assisted" value={rows.length} />
            <MobileStat icon={ClipboardList} label="Awaiting fulfilment" value={pending} tone="neutral" />
            <MobileStat icon={Package} label="Total sales" value={money(totalRevenueMinor)} tone="neutral" />
            <MobileStat icon={Users} label="Custody" value="Open" tone="neutral" />
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
