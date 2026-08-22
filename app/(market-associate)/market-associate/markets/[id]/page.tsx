"use client";

import { useParams } from "next/navigation";
import { MarketAssociateMarketDetailWorkspace } from "@/components/market-associate/MarketAssociateMarketDetailWorkspace";

export default function MarketAssociateMarketDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <MarketAssociateMarketDetailWorkspace id={id} />;
}
