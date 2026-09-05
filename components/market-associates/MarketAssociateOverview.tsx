"use client";

import { Activity, Clock3, MapPinned, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { MarketAssociateMember } from "./market-associate-types";

function countByStatus(members: MarketAssociateMember[], statuses: string[]) {
  return members.filter((member) => statuses.includes(String(member.status || "").toLowerCase())).length;
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Users; label: string; value: number; tone: string }) {
  return (
    <Card className="rounded-xl shadow-none">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <span className={`grid size-9 place-items-center rounded-lg ${tone}`}><Icon className="size-4" /></span>
          <span className="text-2xl font-semibold tabular-nums text-foreground">{value}</span>
        </div>
        <p className="mt-3 text-xs font-medium text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

export function MarketAssociateOverview({ members }: { members: MarketAssociateMember[] }) {
  const active = countByStatus(members, ["active"]);
  const invited = countByStatus(members, ["invited"]);
  const available = members.filter((member) => String(member.availability || "").toLowerCase() === "available").length;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat icon={Users} label="Total Market Associates" value={members.length} tone="bg-zinc-100 text-zinc-700" />
      <Stat icon={Activity} label="Active accounts" value={active} tone="bg-emerald-50 text-emerald-700" />
      <Stat icon={Clock3} label="Pending invitations" value={invited} tone="bg-amber-50 text-amber-700" />
      <Stat icon={MapPinned} label="Available now" value={available} tone="bg-blue-50 text-blue-700" />
    </div>
  );
}
