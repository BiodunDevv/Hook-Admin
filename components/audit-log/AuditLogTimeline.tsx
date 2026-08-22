"use client";

import { ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import type { AuditLogEvent } from "./audit-log-types";
import { actionIntent, dateTime, dayLabel, entityMetaFor, humanize } from "./audit-log-utils";

const intentClasses: Record<ReturnType<typeof actionIntent>, string> = {
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-rose-50 text-rose-700",
  neutral: "bg-zinc-100 text-zinc-700",
};

function groupByDay(events: AuditLogEvent[]) {
  const groups = new Map<string, AuditLogEvent[]>();
  events.forEach((event) => {
    const key = event.createdAt ? new Date(event.createdAt).toDateString() : "unknown";
    const existing = groups.get(key);
    if (existing) existing.push(event);
    else groups.set(key, [event]);
  });
  return [...groups.entries()];
}

export function AuditLogTimeline({ events, onSelect }: { events: AuditLogEvent[]; onSelect: (event: AuditLogEvent) => void }) {
  if (!events.length) return <EmptyState icon={ClipboardList} title="No audit events found" description="Adjust the filters or check back after the next operational change." />;
  const groups = groupByDay(events);
  return (
    <div className="space-y-7">
      {groups.map(([key, dayEvents]) => (
        <section key={key}>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">{dayLabel(dayEvents[0]?.createdAt)}</h2>
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{dayEvents.length}</Badge>
          </div>
          <div className="overflow-hidden rounded-xl border bg-card">
            {dayEvents.map((event, index) => {
              const meta = entityMetaFor(event.entityType);
              const Icon = meta.icon;
              const intent = actionIntent(event.action);
              return (
                <button
                  key={event.id || `${event.action}-${event.createdAt}-${index}`}
                  type="button"
                  onClick={() => onSelect(event)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40",
                    index !== dayEvents.length - 1 && "border-b",
                  )}
                >
                  <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", intentClasses[intent])}>
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-foreground">{humanize(event.action)}</p>
                      <time className="shrink-0 text-[11px] text-muted-foreground">{dateTime(event.createdAt)}</time>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {meta.label}{event.entityPublicId ? ` · ${event.entityPublicId}` : ""} · by {event.actorName || event.actorPublicId || "System"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
