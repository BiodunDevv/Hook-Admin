"use client";

import { CircleCheck, CirclePause, Clock3, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import type { Partner, PartnerAction } from "./partner-types";
import { PartnerCard } from "./PartnerCard";

function groupFor(partner: Partner) {
  const status = String(partner.status || "unknown").toLowerCase();
  if (status === "active") return { key: "active", title: "Active locations", icon: CircleCheck, tone: "text-emerald-700" };
  if (status === "invited") return { key: "invited", title: "Pending invitation", icon: Clock3, tone: "text-amber-700" };
  return { key: "other", title: "Suspended", icon: CirclePause, tone: "text-zinc-700" };
}

export function PartnerDirectory({
  partners,
  stateNames,
  cityNames,
  marketNames,
  onAction,
  onResend,
}: {
  partners: Partner[];
  stateNames: Map<string, string>;
  cityNames: Map<string, string>;
  marketNames: Map<string, string>;
  onAction: (partner: Partner, action: PartnerAction) => void;
  onResend: (partner: Partner) => void;
}) {
  const groups = new Map<string, { title: string; icon: typeof Store; tone: string; partners: Partner[] }>();
  partners.forEach((partner) => {
    const group = groupFor(partner);
    const existing = groups.get(group.key);
    if (existing) existing.partners.push(partner);
    else groups.set(group.key, { title: group.title, icon: group.icon, tone: group.tone, partners: [partner] });
  });
  const order = ["active", "invited", "other"];
  if (!partners.length) return <EmptyState icon={Store} title="No Hook Partners found" description="Adjust the filters or invite the first Hook Partner location." />;
  return (
    <div className="space-y-7">
      {order.map((key) => {
        const group = groups.get(key);
        if (!group) return null;
        const Icon = group.icon;
        return (
          <section key={key}>
            <div className="mb-3 flex items-center gap-2">
              <Icon className={`size-4 ${group.tone}`} />
              <h2 className="text-sm font-semibold text-foreground">{group.title}</h2>
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{group.partners.length}</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {group.partners.map((partner) => (
                <PartnerCard
                  key={partner.id}
                  partner={partner}
                  stateName={partner.stateId ? stateNames.get(partner.stateId) : undefined}
                  cityName={partner.cityId ? cityNames.get(partner.cityId) : undefined}
                  marketName={partner.marketId ? marketNames.get(partner.marketId) : undefined}
                  onAction={onAction}
                  onResend={onResend}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
