"use client";

import { CircleCheck, CirclePause, CircleSlash, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import type { MarketAssociateAction, MarketAssociateMember } from "./market-associate-types";
import { MarketAssociateCard } from "./MarketAssociateCard";

function groupFor(member: MarketAssociateMember) {
  const availability = String(member.availability || "unavailable").toLowerCase();
  if (availability === "available") return { key: "available", title: "Available now", icon: CircleCheck, tone: "text-emerald-700" };
  if (availability === "paused") return { key: "paused", title: "Paused", icon: CirclePause, tone: "text-amber-700" };
  return { key: "unavailable", title: "Unavailable", icon: CircleSlash, tone: "text-zinc-700" };
}

export function MarketAssociateDirectory({ members, onAction, onResend }: { members: MarketAssociateMember[]; onAction: (member: MarketAssociateMember, action: MarketAssociateAction) => void; onResend: (member: MarketAssociateMember) => void }) {
  const groups = new Map<string, { title: string; icon: typeof Users; tone: string; members: MarketAssociateMember[] }>();
  members.forEach((member) => {
    const group = groupFor(member);
    const existing = groups.get(group.key);
    if (existing) existing.members.push(member);
    else groups.set(group.key, { title: group.title, icon: group.icon, tone: group.tone, members: [member] });
  });
  const order = ["available", "paused", "unavailable"];
  if (!members.length) return <EmptyState icon={Users} title="No Market Associates found" description="Adjust the filters or create the first Market Associate invitation." />;
  return <div className="space-y-7">{order.map((key) => { const group = groups.get(key); if (!group) return null; const Icon = group.icon; return <section key={key}><div className="mb-3 flex items-center gap-2"><Icon className={`size-4 ${group.tone}`} /><h2 className="text-sm font-semibold text-foreground">{group.title}</h2><Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{group.members.length}</Badge></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{group.members.map((member) => <MarketAssociateCard key={member.id} member={member} onAction={onAction} onResend={onResend} />)}</div></section>; })}</div>;
}
