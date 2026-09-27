"use client";

import { Activity, Clock3, MapPinned, Store } from "lucide-react";
import { MetricCard } from "@/components/shared/MetricCard";
import type { Partner } from "./partner-types";

function countByStatus(partners: Partner[], statuses: string[]) {
  return partners.filter((partner) => statuses.includes(String(partner.status || "").toLowerCase())).length;
}

export function PartnerOverview({ partners }: { partners: Partner[] }) {
  const active = countByStatus(partners, ["active"]);
  const invited = countByStatus(partners, ["invited"]);
  const suspended = countByStatus(partners, ["suspended"]);
  const states = new Set(partners.map((partner) => partner.stateId).filter(Boolean)).size;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <MetricCard label="Total Hook Partners" value={partners.length} icon={Store} />
      <MetricCard label="Active locations" value={active} icon={Activity} intent="success" />
      <MetricCard label="Pending invitations" value={invited} icon={Clock3} intent={invited ? "warning" : "neutral"} />
      <MetricCard label="States covered" value={states} icon={MapPinned} caption={suspended ? `${suspended} suspended` : undefined} />
    </div>
  );
}
