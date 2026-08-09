"use client";

import { Activity, Building2, MapPinned, Store } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { MarketRecord } from "./market-types";

function Stat({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof Store;
  label: string;
  value: number;
  detail: string;
  tone: string;
}) {
  return (
    <Card className="rounded-xl shadow-none">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <span className={`grid size-9 place-items-center rounded-lg ${tone}`}><Icon className="size-4" /></span>
          <span className="text-2xl font-semibold tabular-nums text-foreground">{value}</span>
        </div>
        <p className="mt-3 text-xs font-semibold text-foreground">{label}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

export function MarketOverview({ markets }: { markets: MarketRecord[] }) {
  const active = markets.filter((market) => market.status === "active").length;
  const connected = markets.filter((market) => Boolean(market.hubName || market.hubId || market.hub)).length;
  const states = new Set(markets.map((market) => market.stateName || market.state?.name).filter(Boolean)).size;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat icon={Store} label="Total markets" value={markets.length} detail="In the current admin scope" tone="bg-[#fff8dc] text-[#8a6900]" />
      <Stat icon={Activity} label="Active markets" value={active} detail="Available for operations" tone="bg-emerald-50 text-emerald-700" />
      <Stat icon={Building2} label="Hub connected" value={connected} detail="Ready for dispatch coordination" tone="bg-blue-50 text-blue-700" />
      <Stat icon={MapPinned} label="Operating states" value={states} detail="States represented here" tone="bg-violet-50 text-violet-700" />
    </div>
  );
}
