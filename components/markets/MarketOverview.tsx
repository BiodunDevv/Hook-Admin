"use client";

import { Activity, Building2, MapPinned, Store } from "lucide-react";
import { MetricCard } from "@/components/shared/MetricCard";
import type { MarketRecord } from "./market-types";

export function MarketOverview({ markets }: { markets: MarketRecord[] }) {
  const active = markets.filter((market) => market.status === "active").length;
  const connected = markets.filter((market) => Boolean(market.hubName || market.hubId || market.hub)).length;
  const states = new Set(markets.map((market) => market.stateName || market.state?.name).filter(Boolean)).size;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <MetricCard icon={Store} label="Total markets" value={markets.length} caption="In the current admin scope" intent="warning" />
      <MetricCard icon={Activity} label="Active markets" value={active} caption="Available for operations" intent="success" />
      <MetricCard icon={Building2} label="Hub connected" value={connected} caption="Ready for dispatch coordination" intent="info" />
      <MetricCard icon={MapPinned} label="Operating states" value={states} caption="States represented here" intent="violet" />
    </div>
  );
}
