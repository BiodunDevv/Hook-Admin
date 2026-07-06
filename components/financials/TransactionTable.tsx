"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useApiQuery } from "@/lib/query";
import Link from "next/link";
import { HookLoader } from "@/components/shared/HookLoader";

interface Settlement {
  id: string;
  vendor?: { businessName?: string; bankDetails?: { bankName?: string; accountNumber?: string } };
  status: string;
  netAmount: number;
  createdAt: string;
}

export function TransactionTable() {
  const { data, isLoading, error } = useApiQuery<{ recentSettlements: Settlement[] }>(["admin", "financials"], "/admin/financials");
  const transactions = data?.recentSettlements || [];
  const errorMessage = error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "";

  return (
    <ScrollArea className="flex-1 pr-2">
      <div className="space-y-5">
        {isLoading && <div className="rounded-lg border border-zinc-100 bg-zinc-50/60 p-3"><HookLoader label="Loading transactions..." /></div>}
        {errorMessage && <div className="text-sm text-red-600">{errorMessage}</div>}
        {!isLoading && !errorMessage && transactions.length === 0 && <div className="text-sm text-zinc-500">No settlement activity yet.</div>}
        {transactions.map((tx) => {
          const Icon = tx.status === "paid" ? CheckCircle2 : tx.status === "failed" ? AlertCircle : Clock;
          const iconColor = tx.status === "paid" ? "text-emerald-500" : tx.status === "failed" ? "text-red-500" : "text-blue-500";
          const iconBg = tx.status === "paid" ? "bg-emerald-50" : tx.status === "failed" ? "bg-red-50" : "bg-blue-50";
          return (
          <Link key={tx.id} href={`/dashboard/financials/settlements/${tx.id}`} className="flex items-center justify-between rounded-md p-1 hover:bg-zinc-50">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg} ${iconColor}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="mb-0.5 font-semibold leading-tight text-zinc-900">{tx.vendor?.businessName || "Vendor settlement"}</p>
                <p className="text-[12px] text-zinc-500">{tx.status.replaceAll("_", " ")} payout</p>
              </div>
            </div>
            <div className="text-right">
              <p className="mb-0.5 font-bold leading-tight text-zinc-900">₦{Number(tx.netAmount || 0).toLocaleString()}</p>
              <p className="text-[12px] text-zinc-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
            </div>
          </Link>
        );})}
      </div>
    </ScrollArea>
  );
}
