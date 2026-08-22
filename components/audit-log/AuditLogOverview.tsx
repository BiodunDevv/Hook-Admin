"use client";

import { CalendarClock, ClipboardList, Layers, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { AuditLogEvent } from "./audit-log-types";

function Stat({ icon: Icon, label, value, tone }: { icon: typeof ClipboardList; label: string; value: number; tone: string }) {
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

export function AuditLogOverview({ events, total }: { events: AuditLogEvent[]; total: number }) {
  const today = new Date().toDateString();
  const todayCount = events.filter((event) => event.createdAt && new Date(event.createdAt).toDateString() === today).length;
  const uniqueActors = new Set(events.map((event) => event.actorId).filter(Boolean)).size;
  const uniqueEntities = new Set(events.map((event) => event.entityType).filter(Boolean)).size;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat icon={ClipboardList} label="Total recorded events" value={total} tone="bg-zinc-100 text-zinc-700" />
      <Stat icon={CalendarClock} label="Events today" value={todayCount} tone="bg-amber-50 text-amber-700" />
      <Stat icon={UserCheck} label="Actors in view" value={uniqueActors} tone="bg-emerald-50 text-emerald-700" />
      <Stat icon={Layers} label="Entity types in view" value={uniqueEntities} tone="bg-blue-50 text-blue-700" />
    </div>
  );
}
