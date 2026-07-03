"use client";

import { useEffect, useState } from "react";
import { Activity, CheckCircle2, TrendingDown, AlertCircle, SlidersHorizontal, Settings2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NegotiationSession } from "@/components/ai-negotiation/NegotiationSession";
import { ChatInterface } from "@/components/ai-negotiation/ChatInterface";
import type { Session } from "@/components/ai-negotiation/NegotiationSession";
import { apiGet } from "@/lib/api";

interface NegotiationRow {
  id: string;
  status: string;
  offeredPrice: number;
  acceptedPrice?: number;
  updatedAt: string;
  product?: { title?: string; images?: string[] };
  user?: { firstName?: string; lastName?: string; email?: string };
}

interface Page<T> { data: T[]; total: number; accepted?: number; conversionRate?: number; }

export default function AINegotiationPage() {
  const [activeSession, setActiveSession] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [metrics, setMetrics] = useState({ total: 0, accepted: 0, conversionRate: 0 });

  useEffect(() => {
    apiGet<Page<NegotiationRow>>("/admin/negotiations")
      .then((result) => {
        const mapped = result.data.map((item) => {
          const customer = `${item.user?.firstName || ""} ${item.user?.lastName || ""}`.trim() || item.user?.email || "Customer";
          const statusColor = item.status === "accepted"
            ? "text-blue-600 bg-blue-50 border-blue-200"
            : item.status === "active"
              ? "text-emerald-600 bg-emerald-50 border-emerald-200"
              : "text-zinc-600 bg-zinc-50 border-zinc-200";
          return {
            id: item.id,
            status: item.status,
            statusColor,
            time: new Date(item.updatedAt).toLocaleString(),
            product: item.product?.title || "Product",
            customer,
            amountLabel: item.acceptedPrice ? "Won at" : "Offered",
            amount: `₦${Number(item.acceptedPrice || item.offeredPrice || 0).toLocaleString()}`,
            amountColor: item.acceptedPrice ? "text-emerald-600" : "text-zinc-900",
            img: item.product?.images?.[0] || "",
            hasIcon: !item.product?.images?.[0],
          };
        });
        setSessions(mapped);
        setActiveSession(mapped[0]?.id || "");
        setMetrics({ total: result.total || 0, accepted: result.accepted || 0, conversionRate: result.conversionRate || 0 });
      })
      .catch(() => setSessions([]));
  }, []);

  return (
    <div className="flex flex-col px-4 py-4 sm:px-6 sm:py-6">
      <PageHeader
        title="AI Negotiation Engine"
        description="Monitor automated haggling, configure margin floors, and step in when needed."
        actions={
          <>
            <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-zinc-500" /> Rule Configuration
            </Button>
            <Button variant="brand" size="sm" className="flex items-center gap-2">
              <Settings2 size={18} /> <span className="hidden sm:inline">Engine Settings</span>
            </Button>
          </>
        }
      />

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-zinc-200 shadow-card">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 sm:h-12 sm:w-12">
              <Activity size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-none text-zinc-900 sm:text-2xl">{metrics.total}</h3>
              <p className="mt-1 text-xs font-medium leading-tight text-zinc-500 sm:text-sm">
                Active Sessions<br />
                <span className="text-xs font-normal text-zinc-400">Live negotiations</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-card">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500 sm:h-12 sm:w-12">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-none text-zinc-900 sm:text-2xl">{metrics.accepted}</h3>
              <p className="mt-1 text-xs font-medium leading-tight text-zinc-500 sm:text-sm">
                Deals Closed Today<br />
                <span className="text-xs font-normal text-zinc-400">78% success rate</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-card">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-brand-gold sm:h-12 sm:w-12">
              <TrendingDown size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-none text-zinc-900 sm:text-2xl">{metrics.conversionRate}%</h3>
              <p className="mt-1 text-xs font-medium leading-tight text-zinc-500 sm:text-sm">
                Avg. Margin Saved<br />
                <span className="text-xs font-normal text-zinc-400">+2.1% vs last week</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-card">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 sm:h-12 sm:w-12">
              <AlertCircle size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-none text-zinc-900 sm:text-2xl">0</h3>
              <p className="mt-1 text-xs font-medium leading-tight text-zinc-500 sm:text-sm">
                Escalated to Human<br />
                <span className="text-xs font-normal text-zinc-400">Requires attention</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Workspace */}
      <div className="flex min-h-0 flex-col gap-6 lg:flex-row" style={{ minHeight: 500 }}>
        <NegotiationSession
          sessions={sessions}
          activeSession={activeSession}
          onSelect={setActiveSession}
        />
        <ChatInterface />
      </div>
    </div>
  );
}
