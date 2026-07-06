"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, CheckCircle2, XCircle, Camera } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchInput } from "@/components/shared/SearchInput";
import { AgentReviewCard } from "@/components/field-agents/AgentReviewCard";
import type { QAItem } from "@/components/field-agents/AgentReviewCard";
import { apiGet } from "@/lib/api";

interface ProductReviewRow {
  id: string;
  title: string;
  createdAt: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  colors?: string[];
  sizes?: string[];
  images?: string[];
  category?: { name?: string };
  vendor?: { businessName?: string };
}

interface Page<T> { data: T[]; total: number; queueSize?: number; }

export default function FieldAgentsPage() {
  const [qaItems, setQaItems] = useState<QAItem[]>([]);
  const [queueSize, setQueueSize] = useState(0);
  const [agentCount, setAgentCount] = useState(0);

  useEffect(() => {
    apiGet<Page<ProductReviewRow>>("/admin/products/review")
      .then((result) => {
        setQueueSize(result.queueSize || result.total || 0);
        setQaItems(result.data.map((item, index) => ({
          id: index + 1,
          category: item.category?.name || "Uncategorized",
          title: item.title,
          time: new Date(item.createdAt).toLocaleString(),
          location: "Field upload",
          agent: item.vendor?.businessName || "Field team",
          costPrice: `₦${Number(item.costPrice || 0).toLocaleString()}`,
          markup: `+₦${Number((item.sellingPrice || 0) - (item.costPrice || 0)).toLocaleString()}`,
          sellingPrice: `₦${Number(item.sellingPrice || 0).toLocaleString()}`,
          details: `Qty: ${item.quantity || 0}`,
          image: item.images?.[0] || "",
          flagged: false,
        })));
      })
      .catch(() => setQaItems([]));
    apiGet<Page<unknown>>("/admin/field-agents")
      .then((result) => setAgentCount(result.total || 0))
      .catch(() => setAgentCount(0));
  }, []);

  return (
    <div className="p-2 sm:p-4">
      <PageHeader
        title="Field Agents & QA"
        description="Review catalog uploads from the field and manage mapping agents."
        actions={<SearchInput placeholder="Search items or agents..." className="hidden sm:block w-52 lg:w-72" />}
      />

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={ShieldAlert} tone="amber" label="Pending QA Review" value={queueSize} caption="Awaiting approval" />
        <KpiCard icon={CheckCircle2} tone="green" label="Approved Today" value={0} caption="Items cleared" />
        <KpiCard icon={XCircle} tone="red" label="Rejected Items" value={0} caption="Sent back to agent" />
        <KpiCard icon={Camera} tone="blue" label="Active Field Agents" value={agentCount} caption="In the market" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="qa-queue">
        <TabsList variant="line" className="mb-4 w-full justify-start border-b border-zinc-200 bg-transparent p-0">
          <TabsTrigger
            value="qa-queue"
            className="rounded-none border-b-2 border-transparent pb-3 font-medium text-zinc-500 data-active:border-brand-gold data-active:font-semibold data-active:text-zinc-900"
          >
            QA Review Queue
            <span className="ml-2 rounded-full bg-brand-gold px-2 py-0.5 text-[11px] font-bold text-zinc-900">{queueSize}</span>
          </TabsTrigger>
          <TabsTrigger
            value="agents"
            className="rounded-none border-b-2 border-transparent pb-3 font-medium text-zinc-500 data-active:border-brand-gold data-active:font-semibold data-active:text-zinc-900"
          >
            Agents Directory
          </TabsTrigger>
        </TabsList>

        <TabsContent value="qa-queue">
          <div className="grid grid-cols-1 gap-4 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
            {qaItems.length === 0 && (
              <div className="col-span-full rounded-lg border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
                No field uploads waiting for QA.
              </div>
            )}
            {qaItems.map((item) => (
              <AgentReviewCard key={item.id} item={item} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="agents">
          <div className="py-12 text-center">
            <Camera size={48} className="mx-auto text-zinc-300" />
            <h3 className="mt-4 text-lg font-semibold text-zinc-700">Agent Directory</h3>
            <p className="mt-1 text-sm text-zinc-400">Field agent directory and mapping coming soon.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
