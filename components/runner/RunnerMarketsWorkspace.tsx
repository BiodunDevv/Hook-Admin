"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Plus, Store, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HookLoader } from "@/components/shared/HookLoader";
import { QueryState } from "@/components/shared/QueryState";
import { useApiQuery } from "@/lib/query";
import { MarketVendorSheet } from "@/components/runner/MarketVendorSheet";
import { MarketImage } from "@/components/markets/MarketImage";
import { useState } from "react";

type Market = {
  id?: string;
  publicId?: string;
  name: string;
  address?: string;
  imageUrl?: string;
  shortDisplayName?: string;
  status?: string;
  stateId?: string;
};

type MarketsResponse = { markets: Market[]; assignments?: Array<{ marketId: string }> };

function marketId(market: Market) {
  return market.publicId || market.id || "";
}

export function RunnerMarketsWorkspace() {
  const query = useApiQuery<MarketsResponse>(["runner", "markets"], "/runner/markets");
  const [vendorMarket, setVendorMarket] = useState<Market | null>(null);
  const markets = query.data?.markets || [];

  if (query.isLoading) return <div className="grid min-h-80 place-items-center"><HookLoader label="Loading assigned Markets" /></div>;
  return (
    <div className="space-y-5 pb-24">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-semibold">Assigned Markets</h1><p className="mt-1 text-sm text-muted-foreground">View the markets you cover, track suppliers, and capture products with the right source context.</p></div><Badge variant="outline" className="w-fit">{markets.length} assigned</Badge></div>
      <QueryState error={query.error} errorTitle="Assigned Markets could not load" empty={!markets.length} emptyIcon={Store} emptyTitle="No active Markets assigned" emptyDescription="Operations will show a Market here when an active assignment is created." onRetry={() => void query.refetch()}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{markets.map((market) => { const id = marketId(market); return <Card key={id} className="overflow-hidden rounded-xl shadow-none"><div className="relative h-36 bg-muted"><MarketImage src={market.imageUrl} alt={`${market.name} market`} className="size-full" /><Badge className="absolute left-3 top-3 bg-white/95 text-foreground shadow-sm">Active assignment</Badge></div><CardContent className="space-y-4 p-4"><div><h2 className="font-semibold">{market.name}</h2><p className="mt-1 flex items-start gap-1.5 text-xs leading-5 text-muted-foreground"><MapPin className="mt-0.5 size-3.5 shrink-0" />{market.address || "Market address pending"}</p></div><div className="flex gap-2"><Button variant="outline" className="flex-1" asChild><Link href={`/runner/markets/${id}`}>Open Market <ArrowRight /></Link></Button><Button variant="brand" size="icon" onClick={() => setVendorMarket(market)} aria-label={`Add supplier to ${market.name}`}><Plus /></Button></div><p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="size-3.5" /> Add a Market supplier before creating a new product submission.</p></CardContent></Card>; })}</div>
      </QueryState>
      {vendorMarket ? <MarketVendorSheet marketId={marketId(vendorMarket)} marketName={vendorMarket.name} open={Boolean(vendorMarket)} onClose={() => setVendorMarket(null)} onSuccess={() => void query.refetch()} /> : null}
    </div>
  );
}
