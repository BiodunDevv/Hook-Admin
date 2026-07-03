"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, CheckCircle2, XCircle, Camera } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="px-4 py-4 sm:px-6 sm:py-6">
      <PageHeader
        title="Field Agents & QA"
        description="Review catalog uploads from the field and manage mapping agents."
        actions={<SearchInput placeholder="Search items or agents..." className="hidden sm:block w-52 lg:w-72" />}
      />

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-zinc-200 shadow-card">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-yellow-500 sm:h-12 sm:w-12">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-none text-zinc-900 sm:text-2xl">{queueSize}</h3>
              <p className="mt-1 text-xs font-medium text-zinc-500 sm:text-sm">Pending QA Review</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-card">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 sm:h-12 sm:w-12">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-none text-zinc-900 sm:text-2xl">0</h3>
              <p className="mt-1 text-xs font-medium text-zinc-500 sm:text-sm">Approved Today</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-card">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 sm:h-12 sm:w-12">
              <XCircle size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-none text-zinc-900 sm:text-2xl">0</h3>
              <p className="mt-1 text-xs font-medium text-zinc-500 sm:text-sm">Rejected Items</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-card">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500 sm:h-12 sm:w-12">
              <Camera size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-none text-zinc-900 sm:text-2xl">{agentCount}</h3>
              <p className="mt-1 text-xs font-medium text-zinc-500 sm:text-sm">Active Field Agents</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="qa-queue">
        <TabsList variant="line" className="mb-6 w-full justify-start border-b border-zinc-200 bg-transparent p-0">
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
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
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
